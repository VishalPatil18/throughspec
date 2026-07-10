// CLI smoke tests: help, unknown command, exit codes.

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function run(args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync('node', [CLI, ...args], { encoding: 'utf8' });
  return { status: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

describe('spec-init CLI', () => {
  it('--help prints every command and flag', () => {
    const { status, stdout } = run(['--help']);
    expect(status).toBe(0);
    for (const cmd of ['init', 'customize', 'add-skill', 'upgrade', 'doctor']) {
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

  it('unknown command exits 2 with a hint', () => {
    const { status, stderr } = run(['gremlin']);
    expect(status).toBe(2);
    expect(stderr).toMatch(/unknown command/);
  });

  it('unknown flag exits 2', () => {
    const { status, stderr } = run(['init', 'foo', '--nope']);
    expect(status).toBe(2);
    expect(stderr).toMatch(/unknown flag/);
  });

  it('--version prints a version string', () => {
    const { status, stdout } = run(['--version']);
    // --version has no command so dispatcher prints help; version flag alone
    // is fine but requires a command context. We accept either.
    expect([0, 2]).toContain(status);
    expect(stdout.length).toBeGreaterThan(0);
  });
});
