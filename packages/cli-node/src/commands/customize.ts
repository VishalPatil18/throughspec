// spec-init customize --add/--remove/--persona: re-derive marker-gated files from the snapshot.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions, Integration, Persona } from '../args.js';
import { stripPersonas } from '../persona.js';
import { stripIntegrations } from '../integrations.js';
import { INTEGRATIONS_PREFIX, applyIntegrations } from './init.js';

interface MetaFile {
  persona: Persona | null;
  integrations: Integration[];
}

/** Run `customize`. Requires exactly one of --add / --remove / --persona. */
export function runCustomize(opts: CliOptions): void {
  const projectRoot = resolve(process.cwd());
  const claudeMd = join(projectRoot, 'CLAUDE.md');
  if (!existsSync(claudeMd)) {
    throw new UsageError('customize must be run inside a scaffolded project (CLAUDE.md not found)');
  }

  const actions = [opts.addIntegration, opts.removeIntegration, opts.persona].filter(Boolean).length;
  if (actions === 0) throw new UsageError('customize requires --add, --remove, or --persona');
  if (actions > 1) throw new UsageError('customize accepts one of --add / --remove / --persona per invocation');

  const snapshotDir = join(projectRoot, '.spec-init', 'base');
  if (!existsSync(snapshotDir)) {
    throw new UsageError(
      'customize requires the .spec-init/base/ snapshot from init; missing here.',
    );
  }

  const meta = readMeta(projectRoot);
  const nextMeta: MetaFile = { persona: meta.persona, integrations: [...meta.integrations] };
  let target: Integration | null = null;
  let mode: 'add' | 'remove' | 'persona' = 'persona';

  if (opts.addIntegration) {
    mode = 'add';
    target = opts.addIntegration;
    if (!nextMeta.integrations.includes(target)) nextMeta.integrations.push(target);
  } else if (opts.removeIntegration) {
    mode = 'remove';
    target = opts.removeIntegration;
    nextMeta.integrations = nextMeta.integrations.filter((n) => n !== target);
  } else if (opts.persona) {
    nextMeta.persona = opts.persona;
  }

  const rederived = rederive(snapshotDir, projectRoot, mode, target, nextMeta, opts.dryRun);
  const integrationFilesTouched = applyIntegrationFiles(
    snapshotDir,
    projectRoot,
    mode,
    target,
    opts.dryRun,
  );

  if (opts.dryRun) {
    process.stdout.write(
      `[dry-run] would re-derive ${rederived} file(s) and touch ${integrationFilesTouched} integration file(s)\n`,
    );
    return;
  }

  writeFileSync(
    join(projectRoot, '.spec-init', 'meta.json'),
    JSON.stringify(nextMeta, null, 2) + '\n',
  );
  process.stdout.write(
    `[OK] customize: ${rederived} file(s) re-derived, ${integrationFilesTouched} integration file(s) updated\n`,
  );
}

function readMeta(projectRoot: string): MetaFile {
  const metaPath = join(projectRoot, '.spec-init', 'meta.json');
  if (!existsSync(metaPath)) return { persona: null, integrations: [] };
  const raw = JSON.parse(readFileSync(metaPath, 'utf8')) as Partial<MetaFile>;
  return {
    persona: (raw.persona as Persona | null) ?? null,
    integrations: Array.isArray(raw.integrations) ? (raw.integrations as Integration[]) : [],
  };
}

/** Re-derive snapshot files carrying the marker for the current action. */
function rederive(
  snapshotDir: string,
  outDir: string,
  mode: 'add' | 'remove' | 'persona',
  target: Integration | null,
  next: MetaFile,
  dryRun: boolean,
): number {
  const marker =
    mode === 'persona' ? '<!-- persona:' : `<!-- integration:${target} -->`;
  const files = walk(snapshotDir).filter((rel) => !rel.startsWith(INTEGRATIONS_PREFIX));
  let count = 0;
  for (const rel of files) {
    if (!rel.endsWith('.md')) continue;
    const snapPath = join(snapshotDir, rel);
    const snapContent = readFileSync(snapPath, 'utf8');
    if (!snapContent.includes(marker)) continue;
    let out = snapContent;
    if (rel === 'CLAUDE.md' && next.persona) out = stripPersonas(out, next.persona);
    out = stripIntegrations(out, next.integrations);
    if (!dryRun) {
      const dest = join(outDir, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, out);
    }
    count += 1;
  }
  return count;
}

/** Copy (--add) or delete (--remove) files under _integrations/<target>/. */
function applyIntegrationFiles(
  snapshotDir: string,
  outDir: string,
  mode: 'add' | 'remove' | 'persona',
  target: Integration | null,
  dryRun: boolean,
): number {
  if (mode === 'persona' || !target) return 0;
  const integrationRoot = join(snapshotDir, '_integrations', target);
  if (!existsSync(integrationRoot)) return 0;
  const files = walk(integrationRoot);
  if (mode === 'add') {
    if (dryRun) return files.length;
    return applyIntegrations(snapshotDir, outDir, [target]);
  }
  // remove: delete files and prune emptied directories.
  let count = 0;
  const dirsToPrune = new Set<string>();
  for (const rel of files) {
    const dest = join(outDir, rel);
    if (existsSync(dest)) {
      if (!dryRun) rmSync(dest);
      count += 1;
    }
    dirsToPrune.add(dirname(rel));
  }
  if (!dryRun) pruneEmpty(outDir, dirsToPrune);
  return count;
}

/** Delete now-empty directories that hosted an integration's files. */
function pruneEmpty(outDir: string, dirs: Set<string>): void {
  // Sort deepest first so children get pruned before their parents.
  const ordered = [...dirs].sort((a, b) => b.length - a.length);
  for (const rel of ordered) {
    let cur = rel;
    while (cur && cur !== '.') {
      const abs = join(outDir, cur);
      if (!existsSync(abs)) break;
      if (readdirSync(abs).length > 0) break;
      rmSync(abs, { recursive: true });
      cur = dirname(cur);
    }
  }
}

function walk(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) out.push(relative(root, full).split(/[\\/]/).join('/'));
    }
  }
  return out.sort();
}
