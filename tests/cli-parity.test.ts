// Cross-language init parity: the Node CLI and Python CLI must produce
// byte-identical trees for every persona/integration combination (SRS §2.3).
//
// Skips silently when the Python CLI is not installed - CI wires it up
// via `uv sync` before running the suite.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(__dirname, '..');
const NODE_CLI = resolve(REPO_ROOT, 'packages/cli-node/dist/index.js');
const PY_PROJECT = resolve(REPO_ROOT, 'packages/cli-python');
const PERSONAS = ['vibe', 'student', 'engineer', 'team'] as const;

function hasUv(): boolean {
  const r = spawnSync('uv', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}

function walk(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) out.push(relative(root, full).split(/[\\/]/).join('/'));
    }
  }
  return out.sort();
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function scaffoldNode(dir: string, name: string, extra: string[]): void {
  const r = spawnSync('node', [NODE_CLI, 'init', name, ...extra], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`node init failed: ${r.stderr}`);
}

function scaffoldPython(dir: string, name: string, extra: string[]): void {
  const r = spawnSync(
    'uv',
    ['--project', PY_PROJECT, 'run', 'python', '-m', 'spec_init', 'init', name, ...extra],
    { cwd: dir, encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(`python init failed: ${r.stderr}`);
}

describe('cross-language init parity', () => {
  const skip = !hasUv() || !existsSync(NODE_CLI);
  if (skip) {
    it.skip('uv and Node CLI must be built; skipping', () => {});
    return;
  }

  for (const persona of PERSONAS) {
    it(`Node and Python emit identical trees for persona=${persona}`, () => {
      const nodeDir = mkdtempSync(join(tmpdir(), `parity-node-${persona}-`));
      const pyDir = mkdtempSync(join(tmpdir(), `parity-py-${persona}-`));
      const extra = ['--persona', persona];
      scaffoldNode(nodeDir, 'p', extra);
      scaffoldPython(pyDir, 'p', extra);

      const nodeFiles = walk(join(nodeDir, 'p')).filter((f) => !f.startsWith('.spec-init/'));
      const pyFiles = walk(join(pyDir, 'p')).filter((f) => !f.startsWith('.spec-init/'));
      expect(pyFiles).toEqual(nodeFiles);

      for (const rel of nodeFiles) {
        const nodePath = join(nodeDir, 'p', rel);
        const pyPath = join(pyDir, 'p', rel);
        const nodeSize = statSync(nodePath).size;
        const pySize = statSync(pyPath).size;
        expect(pySize, `size differs for ${rel}`).toBe(nodeSize);
        expect(sha256(pyPath), `SHA-256 differs for ${rel}`).toBe(sha256(nodePath));
      }
    });
  }

  it('Node and Python emit identical trees with integrations flipped', () => {
    const nodeDir = mkdtempSync(join(tmpdir(), 'parity-node-integ-'));
    const pyDir = mkdtempSync(join(tmpdir(), 'parity-py-integ-'));
    const extra = ['--persona', 'engineer', '--integrations', 'graphify,obsidian'];
    scaffoldNode(nodeDir, 'p', extra);
    scaffoldPython(pyDir, 'p', extra);

    const nodeClaude = readFileSync(join(nodeDir, 'p/CLAUDE.md'), 'utf8');
    const pyClaude = readFileSync(join(pyDir, 'p/CLAUDE.md'), 'utf8');
    expect(pyClaude).toBe(nodeClaude);
  });
});
