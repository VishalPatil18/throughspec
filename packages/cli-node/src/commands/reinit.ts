// spec-init reinit [dir] [--persona] [--integrations] [--force] [--dry-run]
//
// Adopts Throughspec in an existing project, in place. Writes only the template
// payload files that are missing; files that already exist are KEPT by default
// (non-destructive). Pass --force, or answer "replace" at the prompt, to
// overwrite existing spec files with fresh templates. Writes the
// .spec-init/base/ snapshot + meta.json so `upgrade` works afterward. Never
// touches non-template (source) files.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions } from '../args.js';
import { resolvePayloadDir } from '../payload.js';
import { postInitChecklist } from '../checklist.js';
import {
  INTEGRATIONS_PREFIX,
  integrationFilesFor,
  maybeTransform,
  promptIntegrations,
  readLineSync,
  walkPayload,
} from './init.js';
import type { PromptDeps } from './init.js';

type ReinitMode = 'keep' | 'replace';

interface ReinitResult {
  dir: string;
  written: number;
  kept: number;
  dryRun: boolean;
}

/** Run `reinit`. Adopts Throughspec into an existing project in place. */
export function runReinit(opts: CliOptions): ReinitResult {
  const [dirArg] = opts.positional;
  const dir = resolve(process.cwd(), dirArg ?? '.');
  const payloadDir = resolvePayloadDir();

  if (existsSync(join(dir, '.spec-init', 'base'))) {
    throw new UsageError(
      'this project already has a .spec-init/base snapshot - it looks Throughspec-managed.\n' +
        '       Run `spec-init upgrade` to merge a newer template, or `spec-init customize` to change options.',
    );
  }

  // Offer the integration picker interactively (same rules as init).
  const integrations = promptIntegrations(opts);

  const baseFiles = walkPayload(payloadDir).filter((rel) => !rel.startsWith(INTEGRATIONS_PREFIX));
  const integrationRel = integrationFilesFor(payloadDir, integrations);
  const existing = new Set(
    [...baseFiles, ...integrationRel].filter((rel) => existsSync(join(dir, rel))),
  );
  const mode = resolveReinitMode(opts, existing.size);

  if (opts.dryRun) {
    printPlan(relative(process.cwd(), dir) || '.', baseFiles, integrationRel, existing, mode);
    return { dir, written: 0, kept: 0, dryRun: true };
  }

  let written = 0;
  let kept = 0;

  for (const rel of baseFiles) {
    const dest = join(dir, rel);
    if (existing.has(rel) && mode === 'keep') {
      kept += 1;
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    const content = maybeTransform(rel, readFileSync(join(payloadDir, rel), 'utf8'), opts.persona, integrations);
    writeFileSync(dest, content);
    written += 1;
  }

  // Integration payload files are copied raw (no persona/integration strip),
  // honoring the same keep/replace policy.
  for (const name of integrations) {
    const root = join(payloadDir, INTEGRATIONS_PREFIX, name);
    if (!existsSync(root)) continue;
    for (const rel of walkPayload(root)) {
      const dest = join(dir, rel);
      if (existing.has(rel) && mode === 'keep') {
        kept += 1;
        continue;
      }
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, readFileSync(join(root, rel)));
      written += 1;
    }
  }

  // Snapshot the pristine payload so future `upgrade`/`customize` can re-derive.
  const baseDir = join(dir, '.spec-init', 'base');
  cpSync(payloadDir, baseDir, { recursive: true });
  writeFileSync(
    join(dir, '.spec-init', 'meta.json'),
    JSON.stringify({ persona: opts.persona, integrations }, null, 2) + '\n',
  );

  const relDir = relative(process.cwd(), dir) || '.';
  process.stdout.write(`\nAdopted Throughspec in ${relDir}: ${written} written, ${kept} kept.\n`);
  process.stdout.write(postInitChecklist(relDir, opts.persona, integrations, 'Initialized'));
  return { dir, written, kept, dryRun: false };
}

/** Decide keep vs replace for existing spec files. Default is the safe `keep`. */
export function resolveReinitMode(
  opts: CliOptions,
  existingCount: number,
  deps: PromptDeps = { isTty: Boolean(process.stdin.isTTY), ask: readLineSync },
): ReinitMode {
  if (opts.force) return 'replace';
  if (existingCount === 0) return 'replace'; // nothing to keep; write every missing file
  if (opts.dryRun || !deps.isTty) return 'keep'; // safe non-interactive default
  process.stdout.write(
    `Found ${existingCount} existing spec file(s). Keep them, or replace with fresh templates? [keep/replace] `,
  );
  const answer = deps.ask().trim().toLowerCase();
  return answer === 'replace' || answer === 'r' ? 'replace' : 'keep';
}

/** Print the dry-run plan: which files would be written vs kept. */
function printPlan(
  relDir: string,
  baseFiles: readonly string[],
  integrationRel: readonly string[],
  existing: ReadonlySet<string>,
  mode: ReinitMode,
): void {
  const all = [...baseFiles, ...integrationRel];
  const willKeep = mode === 'keep' ? all.filter((rel) => existing.has(rel)) : [];
  const willWrite = all.filter((rel) => !willKeep.includes(rel));
  process.stdout.write(
    `[dry-run] reinit ${relDir} (mode: ${mode}): ${willWrite.length} would be written, ${willKeep.length} kept\n`,
  );
  for (const rel of willWrite) process.stdout.write(`[dry-run]   write  ${rel}\n`);
  for (const rel of willKeep) process.stdout.write(`[dry-run]   keep   ${rel}\n`);
}
