#!/usr/bin/env node
// spec-init (Node CLI) entry: parse argv, dispatch, and centralize error printing.

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

/** True when a bare `spec-init` should open the interactive welcome (TTY only). */
export function shouldLaunchWelcome(opts: CliOptions, isTty: boolean): boolean {
  return opts.command === null && !opts.help && !opts.version && isTty;
}

/** Bin entry. Catches UsageError and prints its message; rethrows unknown errors. */
export async function main(argv: readonly string[]): Promise<number> {
  try {
    const opts = parseArgs(argv);
    if (shouldLaunchWelcome(opts, Boolean(process.stdin.isTTY))) {
      // Load the TUI (and @clack) only on the interactive path.
      const { runWelcome } = await import('./commands/welcome.js');
      return await runWelcome();
    }
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
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
