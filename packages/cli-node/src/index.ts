#!/usr/bin/env node
// Throughspec - spec-init (Node CLI) entry point.
// Parses argv, dispatches to a command module. All error printing happens here
// so command modules can throw UsageError with a message and know it lands.

import { HELP_TEXT, parseArgs, UsageError } from './args.js';
import type { CliOptions } from './args.js';
import { runInit } from './commands/init.js';
import { runReinit } from './commands/reinit.js';
import { runCustomize } from './commands/customize.js';
import { runAddSkill } from './commands/add-skill.js';
import { runUpgrade } from './commands/upgrade.js';
import { runDoctor } from './commands/doctor.js';

const VERSION = '0.1.0-alpha.0';

/** Dispatch a parsed command to its runner. Exported for direct testing. */
export function dispatch(opts: CliOptions): number {
  if (opts.help || opts.command === null) {
    process.stdout.write(HELP_TEXT);
    return opts.command === null && !opts.help ? 2 : 0;
  }
  if (opts.version) {
    process.stdout.write(`spec-init ${VERSION}\n`);
    return 0;
  }
  switch (opts.command) {
    case 'init':
      runInit(opts);
      return 0;
    case 'reinit':
      runReinit(opts);
      return 0;
    case 'customize':
      runCustomize(opts);
      return 0;
    case 'add-skill':
      runAddSkill(opts);
      return 0;
    case 'upgrade': {
      const r = runUpgrade(opts);
      return r.conflicted.length > 0 ? 1 : 0;
    }
    case 'doctor': {
      const r = runDoctor();
      return r.ok ? 0 : 1;
    }
  }
}

/** Bin entry. Catches UsageError and prints its message; rethrows unknown errors. */
export function main(argv: readonly string[]): number {
  try {
    const opts = parseArgs(argv);
    return dispatch(opts);
  } catch (error: unknown) {
    if (error instanceof UsageError) {
      process.stderr.write(`spec-init: ${error.message}\n`);
      return 2;
    }
    throw error;
  }
}

// Only invoke main when run as the bin, not when imported by tests.
const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  process.exit(main(process.argv.slice(2)));
}
