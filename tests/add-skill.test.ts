// add-skill: empty catalog + unknown-skill refusal.
// Stage 5 populates the catalog; Stage 3 only guarantees the wiring.

import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = resolve(__dirname, '..', 'packages/cli-node/dist/index.js');

describe('spec-init add-skill', () => {
  it('exits 2 without a skill name', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-addskill-'));
    const r = spawnSync('node', [CLI, 'add-skill'], { cwd: dir, encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/requires a name/);
  });

  it('exits 2 with a helpful message when the catalog is empty', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-addskill-'));
    const r = spawnSync('node', [CLI, 'add-skill', 'spec-requirements'], {
      cwd: dir,
      encoding: 'utf8',
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/no skills available|unknown skill/);
  });
});
