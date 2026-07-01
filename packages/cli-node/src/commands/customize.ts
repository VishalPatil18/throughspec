// spec-init customize --add <name> | --remove <name> | --persona <name>
//
// Non-destructive: only touches the integration checkbox in CLAUDE.md
// (Stage 3 scope). Persona re-selection re-runs stripPersonas against the
// snapshot in .spec-init/base/CLAUDE.md so user edits below section 10 stay.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions } from '../args.js';
import { stripPersonas } from '../persona.js';
import { flipIntegration } from './init.js';

/** Run `customize`. Requires exactly one of --add / --remove / --persona. */
export function runCustomize(opts: CliOptions): void {
  const projectRoot = resolve(process.cwd());
  const claudeMd = join(projectRoot, 'CLAUDE.md');
  if (!existsSync(claudeMd)) {
    throw new UsageError('customize must be run inside a scaffolded project (CLAUDE.md not found)');
  }

  const actions = [opts.addIntegration, opts.removeIntegration, opts.persona].filter(Boolean).length;
  if (actions === 0) {
    throw new UsageError('customize requires --add, --remove, or --persona');
  }
  if (actions > 1) {
    throw new UsageError('customize accepts one of --add / --remove / --persona per invocation');
  }

  let content = readFileSync(claudeMd, 'utf8');

  if (opts.addIntegration) {
    content = flipIntegration(content, opts.addIntegration, true);
  } else if (opts.removeIntegration) {
    content = flipIntegration(content, opts.removeIntegration, false);
  } else if (opts.persona) {
    const baseClaude = join(projectRoot, '.spec-init', 'base', 'CLAUDE.md');
    if (!existsSync(baseClaude)) {
      throw new UsageError(
        '--persona swap requires the .spec-init/base/ snapshot from init; missing here.',
      );
    }
    // Re-strip from the pristine snapshot so persona blocks come back cleanly.
    content = stripPersonas(readFileSync(baseClaude, 'utf8'), opts.persona);
  }

  if (opts.dryRun) {
    process.stdout.write('[dry-run] CLAUDE.md would be updated\n');
    return;
  }

  writeFileSync(claudeMd, content);
  process.stdout.write('[OK] CLAUDE.md updated\n');
}
