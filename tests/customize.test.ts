// customize: integration flip + persona swap.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function scaffold(persona = 'engineer'): string {
  const dir = mkdtempSync(join(tmpdir(), 'throughspec-customize-'));
  spawnSync('node', [CLI, 'init', 'p', '--persona', persona], { cwd: dir, encoding: 'utf8' });
  return join(dir, 'p');
}

describe('spec-init customize', () => {
  it('--add graphify flips the checkbox to [x]', () => {
    const project = scaffold();
    const r = spawnSync('node', [CLI, 'customize', '--add', 'graphify'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(r.status).toBe(0);
    expect(readFileSync(join(project, 'CLAUDE.md'), 'utf8')).toContain('- [x] Graphify');
  });

  it('--remove obsidian flips [x] back to [ ]', () => {
    const project = scaffold();
    spawnSync('node', [CLI, 'customize', '--add', 'obsidian'], { cwd: project, encoding: 'utf8' });
    const r = spawnSync('node', [CLI, 'customize', '--remove', 'obsidian'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(r.status).toBe(0);
    expect(readFileSync(join(project, 'CLAUDE.md'), 'utf8')).toContain('- [ ] Obsidian');
  });

  it('--persona swaps the surviving block', () => {
    const project = scaffold('engineer');
    const r = spawnSync('node', [CLI, 'customize', '--persona', 'student'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(r.status).toBe(0);
    const claude = readFileSync(join(project, 'CLAUDE.md'), 'utf8');
    expect(claude).toContain('For the Student');
    expect(claude).not.toContain('For the Solo Engineer');
  });

  it('exits 2 with no action flag', () => {
    const project = scaffold();
    const r = spawnSync('node', [CLI, 'customize'], { cwd: project, encoding: 'utf8' });
    expect(r.status).toBe(2);
  });

  it('exits 2 when run outside a scaffolded project', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-customize-outside-'));
    const r = spawnSync('node', [CLI, 'customize', '--add', 'graphify'], {
      cwd: dir,
      encoding: 'utf8',
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/CLAUDE\.md not found/);
  });
});
