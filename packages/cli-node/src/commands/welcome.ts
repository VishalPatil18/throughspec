// spec-init bare on a TTY: interactive @clack welcome that delegates to runInit/runReinit.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts';
import { INTEGRATIONS, PERSONAS } from '../args.js';
import type { CliOptions, Integration, Persona } from '../args.js';
import { runInit } from './init.js';
import { runReinit } from './reinit.js';
import { postInitChecklist } from '../checklist.js';

type Mode = 'new' | 'current';

/** Assemble a CliOptions from the welcome's answers. Pure, so it is testable. */
export function buildWelcomeOptions(
  mode: Mode,
  name: string,
  persona: Persona,
  integrations: readonly Integration[],
): CliOptions {
  return {
    command: mode === 'new' ? 'init' : 'reinit',
    positional: mode === 'new' ? [name] : [],
    persona,
    integrations: [...integrations],
    addIntegration: null,
    removeIntegration: null,
    force: false,
    dryRun: false,
    help: false,
    version: false,
  };
}

/** Run the interactive welcome. Returns a process exit code. */
export async function runWelcome(): Promise<number> {
  intro('Throughspec - Spec-driven. Drift-proof. Token-lean.');

  const cwd = resolve(process.cwd());
  if (existsSync(join(cwd, '.spec-init', 'base'))) {
    note(
      'This directory is already a Throughspec project.\n' +
        'Use `spec-init upgrade` to pull a newer template, or `spec-init customize` to change options.',
      'Nothing to set up',
    );
    outro('Already initialized.');
    return 0;
  }

  const mode = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'new', label: 'Start a new project', hint: 'creates a new folder' },
      {
        value: 'current',
        label: 'Set up in the current directory',
        hint: 'adopt Throughspec here, keeping your files',
      },
    ],
    initialValue: 'new',
  });
  if (isCancel(mode)) return bail();

  let name = '.';
  if (mode === 'new') {
    const answer = await text({
      message: 'Project name',
      placeholder: 'my-app',
      validate: (v) => (v && v.trim() ? undefined : 'Please enter a project name.'),
    });
    if (isCancel(answer)) return bail();
    name = answer.trim();
  }

  const persona = await select({
    message: 'Persona (tunes tone + verbosity)',
    options: PERSONAS.map((p) => ({ value: p, label: p })),
    initialValue: 'engineer' as Persona,
  });
  if (isCancel(persona)) return bail();

  const integrations = await multiselect({
    message: 'Integrations (space to toggle, enter to confirm - none is fine)',
    options: INTEGRATIONS.map((i) => ({ value: i, label: i })),
    required: false,
  });
  if (isCancel(integrations)) return bail();

  const proceed = await confirm({
    message:
      mode === 'new' ? `Scaffold ./${name}?` : 'Set up Throughspec in the current directory?',
  });
  if (isCancel(proceed) || !proceed) return bail();

  const opts = buildWelcomeOptions(
    mode as Mode,
    name,
    persona as Persona,
    integrations as Integration[],
  );

  const spin = spinner();
  spin.start(mode === 'new' ? 'Scaffolding your project' : 'Setting up Throughspec');
  let relDir: string;
  let fileCount: number;
  try {
    if (mode === 'new') {
      const r = runInit(opts, true);
      relDir = name;
      fileCount = r.filesWritten;
    } else {
      const r = runReinit(opts, true);
      relDir = '.';
      fileCount = r.written;
    }
  } catch (error) {
    spin.stop('Setup failed');
    note(error instanceof Error ? error.message : String(error), 'Error');
    return 1;
  }
  const verb = mode === 'new' ? 'Scaffolded' : 'Initialized';
  spin.stop(`${verb} ${relDir} - ${fileCount} files written`);

  note(postInitChecklist(relDir, opts.persona, opts.integrations, verb).trim(), 'Next steps');
  outro('Throughspec is ready. Open the project in Claude Code and run /spec-requirements.');
  return 0;
}

/** Clean cancellation path shared by every prompt. */
function bail(): number {
  cancel('Setup cancelled.');
  return 1;
}
