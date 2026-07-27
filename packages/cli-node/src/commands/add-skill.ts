// spec-init add-skill <name>: copy a skill from the payload catalog into .claude/skills/.

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions } from '../args.js';
import { resolvePayloadDir } from '../payload.js';

/** Run `add-skill`. Throws UsageError on missing name or unknown skill. */
export function runAddSkill(opts: CliOptions): void {
  const [name] = opts.positional;
  if (!name) throw new UsageError('add-skill requires a name: spec-init add-skill <name>');

  const payloadRoot = resolve(resolvePayloadDir(), '..');
  const catalog = join(payloadRoot, 'skills');
  const available = existsSync(catalog) ? readdirSync(catalog) : [];

  if (available.length === 0) {
    process.stderr.write(
      'spec-init: no skills available in this payload (populated in Stage 5).\n',
    );
    throw new UsageError(`add-skill: unknown skill '${name}'`);
  }

  const source = join(catalog, name);
  if (!existsSync(source)) {
    throw new UsageError(`add-skill: unknown skill '${name}' (available: ${available.join(', ')})`);
  }

  const projectRoot = resolve(process.cwd());
  const dest = join(projectRoot, '.claude', 'skills', name);
  if (opts.dryRun) {
    process.stdout.write(`[dry-run] would copy ${source} -> ${dest}\n`);
    return;
  }

  mkdirSync(dest, { recursive: true });
  cpSync(source, dest, { recursive: true });
  process.stdout.write(`[OK] installed skill: ${name}\n`);
}
