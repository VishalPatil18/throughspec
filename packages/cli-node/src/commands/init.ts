// spec-init init <name> [--persona] [--integrations] [--force] [--dry-run]
//
// Copies the shipped payload into <name>/, strips persona-gated and
// integration-gated blocks, layers in files for any active integrations,
// and stashes a snapshot in <name>/.spec-init/base/ so future `upgrade` runs
// have a three-way merge base.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions, Integration, Persona } from '../args.js';
import { resolvePayloadDir } from '../payload.js';
import { stripPersonas } from '../persona.js';
import { stripIntegrations } from '../integrations.js';
import { postInitChecklist } from '../checklist.js';

/** Payload prefix (forward-slash) that holds per-integration file trees. */
export const INTEGRATIONS_PREFIX = '_integrations/';

interface InitResult {
  outDir: string;
  filesWritten: number;
  dryRun: boolean;
}

/** Run `init`. Throws UsageError on user-facing errors. */
export function runInit(opts: CliOptions): InitResult {
  const [name] = opts.positional;
  if (!name) throw new UsageError('init requires a project name: spec-init init <name>');
  const outDir = resolve(process.cwd(), name);
  const payloadDir = resolvePayloadDir();

  if (existsSync(outDir) && !opts.force) {
    const existing = readdirSync(outDir).filter((f) => !f.startsWith('.'));
    if (existing.length > 0) {
      throw new UsageError(
        `refusing to overwrite non-empty directory: ${outDir}\n` +
          `       Pass --force to proceed, or choose a different name.`,
      );
    }
  }

  const allFiles = walkPayload(payloadDir);
  // Files under _integrations/ are per-integration payloads. They are copied
  // conditionally by applyIntegrations(), never as part of the base tree.
  const baseFiles = allFiles.filter((rel) => !rel.startsWith(INTEGRATIONS_PREFIX));

  if (opts.dryRun) {
    process.stdout.write(`[dry-run] would write ${baseFiles.length} files into ${outDir}\n`);
    for (const rel of baseFiles) process.stdout.write(`[dry-run]   ${rel}\n`);
    for (const rel of integrationFilesFor(payloadDir, opts.integrations)) {
      process.stdout.write(`[dry-run]   ${rel}\n`);
    }
    return { outDir, filesWritten: 0, dryRun: true };
  }

  mkdirSync(outDir, { recursive: true });
  let written = 0;
  for (const rel of baseFiles) {
    const src = join(payloadDir, rel);
    const dest = join(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    const content = maybeTransform(rel, readFileSync(src, 'utf8'), opts.persona, opts.integrations);
    writeFileSync(dest, content);
    written += 1;
  }
  written += applyIntegrations(payloadDir, outDir, opts.integrations);

  // Snapshot the raw (untransformed) payload - including _integrations/ - so
  // future `upgrade` and `customize` runs can re-derive from a pristine base.
  const baseDir = join(outDir, '.spec-init', 'base');
  cpSync(payloadDir, baseDir, { recursive: true });
  writeFileSync(
    join(outDir, '.spec-init', 'meta.json'),
    JSON.stringify({ persona: opts.persona, integrations: opts.integrations }, null, 2) + '\n',
  );

  process.stdout.write(postInitChecklist(relative(process.cwd(), outDir) || '.', opts.persona));
  return { outDir, filesWritten: written, dryRun: false };
}

/** Recursively list files under `root` as forward-slash relative paths. */
function walkPayload(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(relative(root, full).split(/[\\/]/).join('/'));
      }
    }
  }
  return out.sort();
}

/** Apply persona and integration strips to `.md` files; other files untouched. */
function maybeTransform(
  relPath: string,
  content: string,
  persona: Persona | null,
  integrations: readonly Integration[],
): string {
  if (!relPath.endsWith('.md')) return content;
  let out = content;
  if (relPath === 'CLAUDE.md' && persona) out = stripPersonas(out, persona);
  out = stripIntegrations(out, integrations);
  return out;
}

/** List destination-relative paths that will be written for `active`. */
export function integrationFilesFor(
  payloadDir: string,
  active: readonly Integration[],
): string[] {
  const out: string[] = [];
  for (const name of active) {
    const root = join(payloadDir, '_integrations', name);
    if (!existsSync(root)) continue;
    for (const rel of walkPayload(root)) out.push(rel);
  }
  return out.sort();
}

/** Copy every file under _integrations/<name>/ into `outDir` for active names. */
export function applyIntegrations(
  payloadDir: string,
  outDir: string,
  active: readonly Integration[],
): number {
  let count = 0;
  for (const name of active) {
    const root = join(payloadDir, '_integrations', name);
    if (!existsSync(root)) continue;
    for (const rel of walkPayload(root)) {
      const src = join(root, rel);
      const dest = join(outDir, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, readFileSync(src));
      count += 1;
    }
  }
  return count;
}

/** Suppresses unused-var lint for statSync import needed only in tests. */
export const __internals = { statSync };
