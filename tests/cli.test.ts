// CLI smoke tests: help, unknown command, exit codes.

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../packages/cli-node/dist/args.js';
import { shouldLaunchWelcome } from '../packages/cli-node/dist/index.js';
import { buildWelcomeOptions } from '../packages/cli-node/dist/commands/welcome.js';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function run(args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync('node', [CLI, ...args], { encoding: 'utf8' });
  return { status: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

describe('spec-init CLI', () => {
  it('--help prints every command and flag', () => {
    const { status, stdout } = run(['--help']);
    expect(status).toBe(0);
    for (const cmd of ['init', 'reinit', 'customize', 'add-skill', 'upgrade', 'doctor']) {
      expect(stdout).toContain(cmd);
    }
    for (const flag of ['--persona', '--integrations', '--force', '--dry-run']) {
      expect(stdout).toContain(flag);
    }
  });

  it('with no command prints help and exits 2', () => {
    const { status, stdout } = run([]);
    expect(status).toBe(2);
    expect(stdout).toContain('USAGE');
  });

  it('bare non-command token is an implied init, not an error', () => {
    // Create-app shorthand: `spec-init <name>` == `spec-init init <name>`.
    expect(parseArgs(['gremlin'])).toMatchObject({ command: 'init', positional: ['gremlin'] });
  });

  it('a dash-prefixed unknown token exits 2 with a hint', () => {
    const { status, stderr } = run(['-gremlin']);
    expect(status).toBe(2);
    expect(stderr).toMatch(/unknown command/);
  });

  it('unknown flag exits 2', () => {
    const { status, stderr } = run(['init', 'foo', '--nope']);
    expect(status).toBe(2);
    expect(stderr).toMatch(/unknown flag/);
  });

  it('--version prints the version and exits 0', () => {
    const { status, stdout } = run(['--version']);
    expect(status).toBe(0);
    expect(stdout).toMatch(/spec-init \d+\.\d+\.\d+/);
  });
});

describe('welcome gate + option mapping', () => {
  it('launches the welcome only on a bare TTY invocation', () => {
    expect(shouldLaunchWelcome(parseArgs([]), true)).toBe(true);
    expect(shouldLaunchWelcome(parseArgs([]), false)).toBe(false); // non-TTY (CI/pipes)
    expect(shouldLaunchWelcome(parseArgs(['init', 'p']), true)).toBe(false); // has a command
    expect(shouldLaunchWelcome(parseArgs(['--help']), true)).toBe(false);
    expect(shouldLaunchWelcome(parseArgs(['--version']), true)).toBe(false);
  });

  it('maps welcome answers to the right CliOptions', () => {
    expect(buildWelcomeOptions('new', 'my-app', 'engineer', ['graphify'])).toMatchObject({
      command: 'init',
      positional: ['my-app'],
      persona: 'engineer',
      integrations: ['graphify'],
      force: false,
      dryRun: false,
    });
    expect(buildWelcomeOptions('current', '.', 'student', [])).toMatchObject({
      command: 'reinit',
      positional: [],
      persona: 'student',
      integrations: [],
    });
  });
});
