// spec-init init <name>: scaffold the payload into <name>/.
// spec.config.js is the ground-truth config; there is no .spec-init snapshot.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { INTEGRATIONS, PERSONAS, UsageError } from '../args.js';
import type { CliOptions, Integration, Persona } from '../args.js';
import { resolvePayloadDir } from '../payload.js';
import { stripPersonas } from '../persona.js';
import { installIntegrations, stripIntegrations } from '../integrations.js';
import type { InstallResult } from '../integrations.js';
import { applyConfig, DEFAULT_PERSONA } from '../config.js';
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

  // Interactive on a TTY; quiet callers pass values in and own prompting.
  const persona = quiet ? opts.persona ?? DEFAULT_PERSONA : promptPersona(opts);
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
    let content = maybeTransform(rel, readFileSync(src, 'utf8'), persona, integrations);
    if (rel === 'spec.config.js') content = applyConfig(content, { persona, integrations });
    writeFileSync(dest, content);
    written += 1;
  }
  written += applyIntegrations(payloadDir, outDir, integrations);

  // Auto-install integrations that ship a known installer (never in quiet/CI).
  const installResults: InstallResult[] = quiet
    ? []
    : installIntegrations(integrations, {
        isTty: Boolean(process.stdin.isTTY),
        noInstall: opts.noInstall,
      });

  if (!quiet) {
    process.stdout.write(
      postInitChecklist(relative(process.cwd(), outDir) || '.', persona, integrations, installResults),
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

/** Injectable I/O for the prompts, so the gating logic stays testable. */
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

/** Prompt for a persona on an eligible interactive run; else --persona or the default. */
export function promptPersona(
  opts: CliOptions,
  deps: PromptDeps = { isTty: Boolean(process.stdin.isTTY), ask: readLineSync },
): Persona {
  if (opts.persona) return opts.persona;
  if (opts.dryRun || !deps.isTty) return DEFAULT_PERSONA;
  process.stdout.write('Persona? (tunes CLAUDE.md and guidance)\n');
  PERSONAS.forEach((p, i) => process.stdout.write(`  ${i + 1}) ${p}\n`));
  process.stdout.write(`> `);
  const choice = deps.ask().trim().toLowerCase();
  const n = Number.parseInt(choice, 10);
  if (Number.isInteger(n) && n >= 1 && n <= PERSONAS.length) return PERSONAS[n - 1] as Persona;
  if ((PERSONAS as readonly string[]).includes(choice)) return choice as Persona;
  return DEFAULT_PERSONA; // empty / unknown -> safe default
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
