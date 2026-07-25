// spec-init reinit: adopting Throughspec into an existing project in place.
// Verifies the non-destructive default (keep), --force replace, the
// already-managed guard, dry-run, and the mode-resolution gating.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveReinitMode } from '../packages/cli-node/dist/commands/reinit.js';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function run(dir: string, args: string[]) {
  return spawnSync('node', [CLI, 'reinit', dir, ...args], { encoding: 'utf8' });
}

function existingProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'throughspec-reinit-'));
  writeFileSync(join(dir, 'app.js'), 'console.log(1)\n');
  return dir;
}

describe('spec-init reinit', () => {
  it('keeps existing spec files and never touches source (default mode)', () => {
    const dir = existingProject();
    writeFileSync(join(dir, 'CLAUDE.md'), 'MY OWN CONTRACT\n');
    const r = run(dir, ['--persona', 'engineer']);
    expect(r.status).toBe(0);
    // existing spec file preserved
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toBe('MY OWN CONTRACT\n');
    // source untouched
    expect(readFileSync(join(dir, 'app.js'), 'utf8')).toBe('console.log(1)\n');
    // missing spec files written + snapshot established
    expect(existsSync(join(dir, 'claude/srs.md'))).toBe(true);
    expect(existsSync(join(dir, '.spec-init/base/CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, '.spec-init/meta.json'))).toBe(true);
    expect(r.stdout).toMatch(/1 kept/);
  });

  it('--force replaces existing spec files with fresh templates', () => {
    const dir = existingProject();
    writeFileSync(join(dir, 'CLAUDE.md'), 'MY OWN CONTRACT\n');
    const r = run(dir, ['--persona', 'engineer', '--force']);
    expect(r.status).toBe(0);
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toContain('CLAUDE.md - Project Behavior Contract');
    expect(r.stdout).toMatch(/0 kept/);
  });

  it('writes the full payload into a project with no spec files', () => {
    const dir = existingProject();
    const r = run(dir, ['--persona', 'engineer']);
    expect(r.status).toBe(0);
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, 'claude/context.md'))).toBe(true);
  });

  it('refuses when the project is already Throughspec-managed', () => {
    const dir = existingProject();
    run(dir, ['--persona', 'engineer']); // first reinit establishes .spec-init/base
    const again = run(dir, []);
    expect(again.status).toBe(2);
    expect(again.stderr).toMatch(/already has a \.spec-init\/base snapshot/);
    expect(again.stderr).toMatch(/spec-init upgrade/);
  });

  it('--dry-run writes nothing', () => {
    const dir = existingProject();
    const r = run(dir, ['--dry-run']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/\[dry-run\]/);
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(dir, '.spec-init'))).toBe(false);
  });
});

describe('resolveReinitMode gating', () => {
  const base = {
    command: 'reinit' as const,
    positional: [] as string[],
    persona: null,
    integrations: [] as never[],
    addIntegration: null,
    removeIntegration: null,
    force: false,
    dryRun: false,
    help: false,
    version: false,
  };
  const boom = () => {
    throw new Error('ask() must not be called');
  };

  it('--force always replaces (no prompt)', () => {
    expect(resolveReinitMode({ ...base, force: true }, 5, { isTty: true, ask: boom })).toBe('replace');
  });

  it('no existing files -> replace without prompting', () => {
    expect(resolveReinitMode(base, 0, { isTty: true, ask: boom })).toBe('replace');
  });

  it('non-TTY or dry-run defaults to keep (no prompt)', () => {
    expect(resolveReinitMode(base, 3, { isTty: false, ask: boom })).toBe('keep');
    expect(resolveReinitMode({ ...base, dryRun: true }, 3, { isTty: true, ask: boom })).toBe('keep');
  });

  it('interactive prompt: replace on "replace"/"r", keep otherwise', () => {
    expect(resolveReinitMode(base, 3, { isTty: true, ask: () => 'replace' })).toBe('replace');
    expect(resolveReinitMode(base, 3, { isTty: true, ask: () => 'r' })).toBe('replace');
    expect(resolveReinitMode(base, 3, { isTty: true, ask: () => '' })).toBe('keep');
    expect(resolveReinitMode(base, 3, { isTty: true, ask: () => 'keep' })).toBe('keep');
  });
});
