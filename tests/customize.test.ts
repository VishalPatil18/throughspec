// customize: integration toggle (add/remove) + persona swap. Both flows
// re-derive template-managed files from the .spec-init/base/ snapshot and
// (for --add / --remove) copy or delete the integration's file tree.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function scaffold(persona = 'engineer', extra: string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'throughspec-customize-'));
  spawnSync('node', [CLI, 'init', 'p', '--persona', persona, ...extra], {
    cwd: dir,
    encoding: 'utf8',
  });
  return join(dir, 'p');
}

describe('spec-init customize', () => {
  it('--add graphify inserts the Graphify block and config file', () => {
    const project = scaffold();
    const r = spawnSync('node', [CLI, 'customize', '--add', 'graphify'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(r.status).toBe(0);
    const claude = readFileSync(join(project, 'CLAUDE.md'), 'utf8');
    expect(claude).toContain('**Graphify**');
    expect(existsSync(join(project, '.graphify/config.yml'))).toBe(true);
    const meta = JSON.parse(readFileSync(join(project, '.spec-init/meta.json'), 'utf8'));
    expect(meta.integrations).toContain('graphify');
  });

  it('--remove obsidian removes both the block and the .obsidian directory', () => {
    const project = scaffold('engineer', ['--integrations', 'obsidian']);
    expect(existsSync(join(project, '.obsidian/workspace.json'))).toBe(true);
    const r = spawnSync('node', [CLI, 'customize', '--remove', 'obsidian'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(r.status).toBe(0);
    const claude = readFileSync(join(project, 'CLAUDE.md'), 'utf8');
    expect(claude).not.toContain('**Obsidian**');
    expect(existsSync(join(project, '.obsidian'))).toBe(false);
    const meta = JSON.parse(readFileSync(join(project, '.spec-init/meta.json'), 'utf8'));
    expect(meta.integrations).not.toContain('obsidian');
  });

  it('--persona swaps the surviving block without touching integrations', () => {
    const project = scaffold('engineer', ['--integrations', 'graphify']);
    const r = spawnSync('node', [CLI, 'customize', '--persona', 'student'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(r.status).toBe(0);
    const claude = readFileSync(join(project, 'CLAUDE.md'), 'utf8');
    expect(claude).toContain('For the Student');
    expect(claude).not.toContain('For the Solo Engineer');
    // Graphify was on before the persona swap; it must remain on.
    expect(claude).toContain('**Graphify**');
    expect(existsSync(join(project, '.graphify/config.yml'))).toBe(true);
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
