// spec-init init <name>: scaffold the payload into <name>/, then snapshot .spec-init/base/.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { INTEGRATIONS, UsageError } from '../args.js';
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

/** Run `init`. Throws UsageError on user-facing errors. Quiet skips prompts + summary (caller owns I/O). */
export function runInit(opts: CliOptions, quiet = false): InitResult {
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

  // Interactive picker on a TTY; quiet callers pass integrations in and own prompting.
  const integrations = quiet ? [...opts.integrations] : promptIntegrations(opts);

  const allFiles = walkPayload(payloadDir);
  // _integrations/ files are copied conditionally by applyIntegrations(), not as base.
  const baseFiles = allFiles.filter((rel) => !rel.startsWith(INTEGRATIONS_PREFIX));

  if (opts.dryRun) {
    process.stdout.write(`[dry-run] would write ${baseFiles.length} files into ${outDir}\n`);
    for (const rel of baseFiles) process.stdout.write(`[dry-run]   ${rel}\n`);
    for (const rel of integrationFilesFor(payloadDir, integrations)) {
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
    const content = maybeTransform(rel, readFileSync(src, 'utf8'), opts.persona, integrations);
    writeFileSync(dest, content);
    written += 1;
  }
  written += applyIntegrations(payloadDir, outDir, integrations);

  // Snapshot the pristine payload so upgrade/customize can re-derive later.
  const baseDir = join(outDir, '.spec-init', 'base');
  cpSync(payloadDir, baseDir, { recursive: true });
  writeFileSync(
    join(outDir, '.spec-init', 'meta.json'),
    JSON.stringify({ persona: opts.persona, integrations }, null, 2) + '\n',
  );

  if (!quiet) {
    process.stdout.write(
      postInitChecklist(relative(process.cwd(), outDir) || '.', opts.persona, integrations),
    );
  }
  return { outDir, filesWritten: written, dryRun: false };
}

/** Recursively list files under `root` as forward-slash relative paths. */
export function walkPayload(root: string): string[] {
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
export function maybeTransform(
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
export function integrationFilesFor(payloadDir: string, active: readonly Integration[]): string[] {
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

/** Injectable I/O for promptIntegrations, so the gating logic stays testable. */
export interface PromptDeps {
  isTty: boolean;
  ask: () => string;
}

/** Read one line synchronously from stdin (fd 0). Returns '' on EOF/error. */
export function readLineSync(): string {
  const buf = Buffer.alloc(1);
  let out = '';
  for (;;) {
    let n = 0;
    try {
      n = readSync(0, buf, 0, 1, null);
    } catch {
      break; // EOF / EAGAIN
    }
    if (n === 0) break;
    const ch = buf.toString('utf8', 0, 1);
    if (ch === '\n') break;
    if (ch !== '\r') out += ch;
  }
  return out;
}

/** Prompt for integrations on an eligible interactive run; else return opts.integrations. */
export function promptIntegrations(
  opts: CliOptions,
  deps: PromptDeps = { isTty: Boolean(process.stdin.isTTY), ask: readLineSync },
): Integration[] {
  const current = [...opts.integrations];
  const eligible = !opts.dryRun && current.length === 0 && deps.isTty;
  if (!eligible) return current;
  process.stdout.write('Integrations to include?\n  1) all\n  2) let me select\n  3) none\n> ');
  const choice = deps.ask().trim().toLowerCase();
  if (choice === '1' || choice === 'all') return [...INTEGRATIONS];
  if (choice === '2' || choice === 'let me select' || choice === 'select') {
    process.stdout.write('Select integrations (space/comma-separated numbers, Enter to submit):\n');
    INTEGRATIONS.forEach((name, i) => process.stdout.write(`  ${i + 1}) ${name}\n`));
    process.stdout.write('> ');
    return parseSelection(deps.ask());
  }
  return []; // '3' | 'none' | empty | unknown -> none (safe default)
}

/** Map a "1 3" / "1,3" selection line to the chosen integrations, in list order. */
function parseSelection(line: string): Integration[] {
  const picked = new Set(
    line
      .split(/[\s,]+/)
      .map((tok) => Number.parseInt(tok, 10))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= INTEGRATIONS.length),
  );
  return INTEGRATIONS.filter((_, i) => picked.has(i + 1));
}

/** Suppresses unused-var lint for statSync import needed only in tests. */
export const __internals = { statSync };
