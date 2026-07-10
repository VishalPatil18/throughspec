// doctor: OK on fresh scaffold, fails on corrupted / missing file.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function scaffold(): string {
  const dir = mkdtempSync(join(tmpdir(), 'throughspec-doctor-'));
  spawnSync('node', [CLI, 'init', 'p', '--persona', 'engineer'], { cwd: dir, encoding: 'utf8' });
  return join(dir, 'p');
}

describe('spec-init doctor', () => {
  it('exits 0 on a fresh scaffold', () => {
    const project = scaffold();
    const r = spawnSync('node', [CLI, 'doctor'], { cwd: project, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/healthy/);
  });

  it('exits 1 and lists issues when a required file is empty', () => {
    const project = scaffold();
    writeFileSync(join(project, 'claude', 'srs.md'), '');
    const r = spawnSync('node', [CLI, 'doctor'], { cwd: project, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/claude\/srs\.md/);
  });

  it('exits 1 when the .spec-init/base snapshot is missing', () => {
    const project = scaffold();
    rmSync(join(project, '.spec-init'), { recursive: true, force: true });
    const r = spawnSync('node', [CLI, 'doctor'], { cwd: project, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/\.spec-init/);
  });
});
