// Stage 2 lint test.
//
// Acceptance criterion: "Manually copying `templates/` into an empty
// directory yields a tree that passes `markdownlint` and `prettier --check`."
//
// Approach: copy templates/ to a temp directory, then invoke each linter
// against that copy so we test the acceptance wording literally.

import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(__dirname, '..', '..');
const TEMPLATES = resolve(REPO_ROOT, 'templates');
const MARKDOWNLINT_CONFIG = resolve(REPO_ROOT, '.markdownlint.jsonc');
const PRETTIER_CONFIG = resolve(REPO_ROOT, '.prettierrc.json');
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function copyTemplatesToTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'throughspec-lint-'));
  cpSync(TEMPLATES, dir, { recursive: true });
  return dir;
}

describe('templates pass lint on a fresh copy', () => {
  it('markdownlint-cli2 exits 0', () => {
    const dir = copyTemplatesToTmp();
    const r = spawnSync(
      NPX,
      ['markdownlint-cli2', '--config', MARKDOWNLINT_CONFIG, '**/*.md'],
      { cwd: dir, encoding: 'utf8' },
    );
    expect(r.status, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`).toBe(0);
  });

  it('prettier --check exits 0', () => {
    const dir = copyTemplatesToTmp();
    const r = spawnSync(
      NPX,
      ['prettier', '--check', '--config', PRETTIER_CONFIG, '**/*.md'],
      { cwd: dir, encoding: 'utf8' },
    );
    expect(r.status, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`).toBe(0);
  });
});
