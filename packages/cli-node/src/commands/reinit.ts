// spec-init reinit [dir]: adopt Throughspec in place, keeping existing files unless --force.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions } from '../args.js';
import { resolvePayloadDir } from '../payload.js';
import { applyConfig, DEFAULT_PERSONA, isManaged } from '../config.js';
import { installIntegrations } from '../integrations.js';
import type { InstallResult } from '../integrations.js';
import { postInitChecklist } from '../checklist.js';
import {
  INTEGRATIONS_PREFIX,
  integrationFilesFor,
  maybeTransform,
  promptIntegrations,
  promptPersona,
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

/** Adopt Throughspec into an existing project in place; quiet skips prompts + output. */
export function runReinit(opts: CliOptions, quiet = false): ReinitResult {
  const [dirArg] = opts.positional;
  const dir = resolve(process.cwd(), dirArg ?? '.');
  const payloadDir = resolvePayloadDir();

  if (isManaged(dir)) {
    throw new UsageError(
      'this project already has spec.config.js - it looks Throughspec-managed.\n' +
        '       Run `spec-init upgrade` to merge a newer template, or `spec-init customize` to change options.',
    );
  }

  const persona = quiet ? opts.persona ?? DEFAULT_PERSONA : promptPersona(opts);
  const integrations = quiet ? [...opts.integrations] : promptIntegrations(opts);

  const baseFiles = walkPayload(payloadDir).filter((rel) => !rel.startsWith(INTEGRATIONS_PREFIX));
  const integrationRel = integrationFilesFor(payloadDir, integrations);
  const existing = new Set(
    [...baseFiles, ...integrationRel].filter((rel) => existsSync(join(dir, rel))),
  );
  const mode = quiet
    ? resolveReinitMode(opts, existing.size, { isTty: false, ask: () => '' })
    : resolveReinitMode(opts, existing.size);

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
    let content = maybeTransform(rel, readFileSync(join(payloadDir, rel), 'utf8'), persona, integrations);
    if (rel === 'spec.config.js') content = applyConfig(content, { persona, integrations });
    writeFileSync(dest, content);
    written += 1;
  }

  // Integration files copied raw, honoring the same keep/replace policy.
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

  const installResults: InstallResult[] = quiet
    ? []
    : installIntegrations(integrations, {
        isTty: Boolean(process.stdin.isTTY),
        noInstall: opts.noInstall,
      });

  const relDir = relative(process.cwd(), dir) || '.';
  if (!quiet) {
    process.stdout.write(`\nAdopted Throughspec in ${relDir}: ${written} written, ${kept} kept.\n`);
    process.stdout.write(postInitChecklist(relDir, persona, integrations, installResults, 'Initialized'));
  }
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
