// upgrade: managed-region model. CLI-owned files are replaced, user data is
// preserved, and CLAUDE.md has only its managed regions refreshed.

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function scaffold(): string {
  const dir = mkdtempSync(join(tmpdir(), 'throughspec-upgrade-'));
  spawnSync('node', [CLI, 'init', 'p', '--persona', 'engineer', '--no-install'], {
    cwd: dir,
    encoding: 'utf8',
  });
  return join(dir, 'p');
}

describe('spec-init upgrade', () => {
  it('preserves user data files (never overwrites them)', () => {
    const project = scaffold();
    writeFileSync(join(project, 'claude', 'context.md'), 'MY DATA\n');
    const r = spawnSync('node', [CLI, 'upgrade'], { cwd: project, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(readFileSync(join(project, 'claude', 'context.md'), 'utf8')).toBe('MY DATA\n');
    expect(r.stdout).toMatch(/preserved/);
  });

  it('refreshes a tampered managed region of CLAUDE.md', () => {
    const project = scaffold();
    const claude = join(project, 'CLAUDE.md');
    const tampered = readFileSync(claude, 'utf8').replace(
      'This project follows the **Spec-Driven Development** SDLC.',
      'TAMPERED',
    );
    writeFileSync(claude, tampered);
    const r = spawnSync('node', [CLI, 'upgrade'], { cwd: project, encoding: 'utf8' });
    expect(r.status).toBe(0);
    const out = readFileSync(claude, 'utf8');
    expect(out).not.toContain('TAMPERED');
    expect(out).toContain('Spec-Driven Development');
  });

  it('preserves edits outside the managed markers', () => {
    const project = scaffold();
    const claude = join(project, 'CLAUDE.md');
    writeFileSync(
      claude,
      readFileSync(claude, 'utf8').replace('<one-line product name and pitch>', 'MY PITCH'),
    );
    spawnSync('node', [CLI, 'upgrade'], { cwd: project, encoding: 'utf8' });
    expect(readFileSync(claude, 'utf8')).toContain('MY PITCH');
  });

  it('migrates a leftover pre-1.2 .spec-init/ away', () => {
    const project = scaffold();
    mkdirSync(join(project, '.spec-init'), { recursive: true });
    writeFileSync(
      join(project, '.spec-init', 'meta.json'),
      '{"persona":"engineer","integrations":[]}',
    );
    const r = spawnSync('node', [CLI, 'upgrade'], { cwd: project, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(existsSync(join(project, '.spec-init'))).toBe(false);
  });

  it('refuses to run outside a Throughspec project (no spec.config.js)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-upgrade-bare-'));
    const r = spawnSync('node', [CLI, 'upgrade'], { cwd: dir, encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/spec\.config\.js/);
  });
});
