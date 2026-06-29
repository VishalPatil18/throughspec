// Stage 1 parity test.
//
// 1. Confirms `tools/check-payload-parity.mjs` exits 0 when both built payloads match.
// 2. Confirms it exits non-zero and reports a diff when a payload is corrupted.
//
// This test assumes both builds have already been run (`npm run build && npm run build:python`).
// Vitest is configured at the repo root via the default config.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(__dirname, '..', '..');
const PARITY_SCRIPT = resolve(REPO_ROOT, 'tools/check-payload-parity.mjs');
const NODE_PAYLOAD = resolve(REPO_ROOT, 'packages/cli-node/dist/templates');
const PY_PAYLOAD = resolve(REPO_ROOT, 'packages/cli-python/_payload');

function runParity(): { status: number; stdout: string; stderr: string } {
  const r = spawnSync('node', [PARITY_SCRIPT], { encoding: 'utf8' });
  return {
    status: r.status ?? -1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

describe('payload parity', () => {
  it('both payloads exist (build first if this fails)', () => {
    expect(existsSync(NODE_PAYLOAD)).toBe(true);
    expect(existsSync(PY_PAYLOAD)).toBe(true);
  });

  it('passes when both payloads match', () => {
    const { status, stdout } = runParity();
    expect(status, `parity script exited ${status}\n${stdout}`).toBe(0);
    expect(stdout).toContain('PASS');
  });

  it('fails and reports drift when a payload is corrupted', () => {
    const target = resolve(PY_PAYLOAD, 'CLAUDE.md');
    expect(existsSync(target)).toBe(true);
    const original = readFileSync(target);

    try {
      writeFileSync(target, original.toString('utf8') + '\n<!-- intentional drift -->\n');

      const { status, stderr } = runParity();
      expect(status).not.toBe(0);
      expect(stderr).toMatch(/mismatched|drift/);
    } finally {
      writeFileSync(target, original);
    }

    const { status: restoredStatus } = runParity();
    expect(restoredStatus, 'parity should pass again after restoring the file').toBe(0);
  });
});
