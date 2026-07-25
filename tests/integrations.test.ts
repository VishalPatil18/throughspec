// Stage 8 acceptance: scaffold → add → remove must leave zero residual files
// or bytes vs the original scaffold. Also exercises both integrations at once
// and asserts the marker-strip / re-derive plumbing.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { promptIntegrations } from '../packages/cli-node/dist/commands/init.js';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

function scaffold(persona = 'engineer'): string {
  const dir = mkdtempSync(join(tmpdir(), 'throughspec-integ-round-'));
  const r = spawnSync('node', [CLI, 'init', 'p', '--persona', persona], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`init failed: ${r.stderr}`);
  return join(dir, 'p');
}

/** Recursively hash every file under `root` -> { relPath: sha256 }. */
function fingerprint(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const rel = relative(root, full).split(/[\\/]/).join('/');
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else out[rel] = createHash('sha256').update(readFileSync(full)).digest('hex');
    }
  }
  return out;
}

function assertRoundtripEmpty(before: Record<string, string>, after: Record<string, string>) {
  // Meta will differ only by insertion-order-neutral JSON if we did our job
  // right; treat meta.json specially (compare parsed value, not bytes).
  const skip = new Set(['.spec-init/meta.json']);
  const missing: string[] = [];
  const extra: string[] = [];
  const changed: string[] = [];
  for (const rel of Object.keys(before)) {
    if (skip.has(rel)) continue;
    if (!(rel in after)) missing.push(rel);
    else if (after[rel] !== before[rel]) changed.push(rel);
  }
  for (const rel of Object.keys(after)) {
    if (skip.has(rel)) continue;
    if (!(rel in before)) extra.push(rel);
  }
  expect({ missing, extra, changed }).toEqual({ missing: [], extra: [], changed: [] });
}

describe('Stage 8 - integration toggle roundtrip', () => {
  it('add graphify then remove graphify leaves zero residual files', () => {
    const project = scaffold();
    const before = fingerprint(project);
    const add = spawnSync('node', [CLI, 'customize', '--add', 'graphify'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(add.status).toBe(0);
    expect(existsSync(join(project, '.graphify/config.yml'))).toBe(true);
    const rm = spawnSync('node', [CLI, 'customize', '--remove', 'graphify'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(rm.status).toBe(0);
    assertRoundtripEmpty(before, fingerprint(project));
  });

  it('add obsidian then remove obsidian leaves zero residual files', () => {
    const project = scaffold();
    const before = fingerprint(project);
    spawnSync('node', [CLI, 'customize', '--add', 'obsidian'], { cwd: project, encoding: 'utf8' });
    expect(existsSync(join(project, '.obsidian/workspace.json'))).toBe(true);
    spawnSync('node', [CLI, 'customize', '--remove', 'obsidian'], {
      cwd: project,
      encoding: 'utf8',
    });
    assertRoundtripEmpty(before, fingerprint(project));
  });

  it('add both then remove both leaves zero residual files', () => {
    const project = scaffold();
    const before = fingerprint(project);
    for (const name of ['graphify', 'obsidian']) {
      spawnSync('node', [CLI, 'customize', '--add', name], { cwd: project, encoding: 'utf8' });
    }
    expect(existsSync(join(project, '.graphify/config.yml'))).toBe(true);
    expect(existsSync(join(project, '.obsidian/workspace.json'))).toBe(true);
    for (const name of ['obsidian', 'graphify']) {
      spawnSync('node', [CLI, 'customize', '--remove', name], { cwd: project, encoding: 'utf8' });
    }
    assertRoundtripEmpty(before, fingerprint(project));
  });

  it('add caveman then remove caveman leaves zero residual files', () => {
    const project = scaffold();
    const before = fingerprint(project);
    const add = spawnSync('node', [CLI, 'customize', '--add', 'caveman'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(add.status).toBe(0);
    expect(existsSync(join(project, 'claude/caveman.md'))).toBe(true);
    const rm = spawnSync('node', [CLI, 'customize', '--remove', 'caveman'], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(rm.status).toBe(0);
    assertRoundtripEmpty(before, fingerprint(project));
  });

  it.each([
    ['agentmemory', 'claude/agentmemory.md'],
    ['openwiki', 'claude/openwiki.md'],
    ['ponytail', 'claude/ponytail.md'],
  ])('add %s then remove %s leaves zero residual files', (name, marker) => {
    const project = scaffold();
    const before = fingerprint(project);
    const add = spawnSync('node', [CLI, 'customize', '--add', name], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(add.status).toBe(0);
    expect(existsSync(join(project, marker))).toBe(true);
    const rm = spawnSync('node', [CLI, 'customize', '--remove', name], {
      cwd: project,
      encoding: 'utf8',
    });
    expect(rm.status).toBe(0);
    assertRoundtripEmpty(before, fingerprint(project));
  });

  it('README external links resolve to known integration hosts', () => {
    const project = scaffold();
    for (const name of ['graphify', 'obsidian', 'caveman', 'agentmemory', 'openwiki', 'ponytail']) {
      spawnSync('node', [CLI, 'customize', '--add', name], { cwd: project, encoding: 'utf8' });
    }
    const readme = readFileSync(join(project, 'README.md'), 'utf8');
    expect(readme).toContain('https://graphify.net/');
    expect(readme).toContain('https://obsidian.md/');
    expect(readme).toContain('https://github.com/JuliusBrussee/caveman');
    expect(readme).toContain('https://github.com/rohitg00/agentmemory');
    expect(readme).toContain('https://github.com/langchain-ai/openwiki');
    expect(readme).toContain('https://github.com/DietrichGebert/ponytail');
  });
});

describe('promptIntegrations gating', () => {
  const base = {
    command: 'init' as const,
    positional: ['p'],
    persona: null,
    integrations: [] as never[],
    addIntegration: null,
    removeIntegration: null,
    force: false,
    dryRun: false,
    help: false,
    version: false,
  };

  /** Return an `ask` that yields the queued answers in order. */
  const queued = (answers: string[]) => {
    let i = 0;
    return () => answers[i++];
  };

  it('all selects every integration', () => {
    const everything = ['graphify', 'obsidian', 'caveman', 'agentmemory', 'openwiki', 'ponytail'];
    expect(promptIntegrations(base, { isTty: true, ask: () => '1' })).toEqual(everything);
    expect(promptIntegrations(base, { isTty: true, ask: () => 'all' })).toEqual(everything);
  });

  it('none (or empty) selects nothing', () => {
    expect(promptIntegrations(base, { isTty: true, ask: () => '3' })).toEqual([]);
    expect(promptIntegrations(base, { isTty: true, ask: () => '' })).toEqual([]);
  });

  it('let me select returns the picked subset in list order', () => {
    // choose "let me select", then pick caveman + graphify (out of order)
    expect(promptIntegrations(base, { isTty: true, ask: queued(['2', '3 1']) })).toEqual([
      'graphify',
      'caveman',
    ]);
  });

  it('never prompts when non-TTY, dry-run, or integrations already chosen', () => {
    const boom = () => {
      throw new Error('ask() must not be called');
    };
    expect(promptIntegrations(base, { isTty: false, ask: boom })).toEqual([]);
    expect(promptIntegrations({ ...base, dryRun: true }, { isTty: true, ask: boom })).toEqual([]);
    expect(
      promptIntegrations({ ...base, integrations: ['graphify'] as never[] }, { isTty: true, ask: boom }),
    ).toEqual(['graphify']);
  });
});
