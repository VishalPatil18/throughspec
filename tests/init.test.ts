// End-to-end init tests: tree shape, personas, integrations, force, dry-run,
// perf (< 5 s), and lint pass on the scaffolded output.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const requireCjs = createRequire(import.meta.url);

const REPO_ROOT = resolve(__dirname, '..');
const CLI = resolve(REPO_ROOT, 'packages/cli-node/dist/index.js');
const MARKDOWNLINT_CONFIG = resolve(REPO_ROOT, '.markdownlint.jsonc');
const PRETTIER_CONFIG = resolve(REPO_ROOT, '.prettierrc.json');
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const REQUIRED = [
  'CLAUDE.md',
  'README.md',
  'CHANGELOG.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'claude/srs.md',
  'claude/plan.md',
  'claude/context.md',
  'claude/features.md',
  'claude/design-decisions.md',
  'claude/learnings.md',
  'design/design.md',
  'spec.config.js',
  '.github/pull_request_template.md',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/feature_request.md',
  '.claude/skills/spec-requirements/SKILL.md',
  '.claude/skills/spec-design/SKILL.md',
  '.claude/skills/spec-plan/SKILL.md',
  '.claude/skills/spec-feature/SKILL.md',
  '.claude/skills/spec-refactor/SKILL.md',
  '.claude/skills/spec-bug/SKILL.md',
  '.claude/skills/spec-docs/SKILL.md',
  '.claude/skills/spec-sync/SKILL.md',
  '.claude/agents/spec-interrogator.md',
  '.claude/agents/spec-architect.md',
  '.claude/agents/spec-planner.md',
  '.claude/agents/spec-coder.md',
  '.claude/agents/spec-refactorer.md',
  '.claude/agents/spec-doc-writer.md',
  '.claude/agents/spec-bug-hunter.md',
];

function initInto(dir: string, name: string, extra: string[] = []): { status: number; ms: number } {
  const t0 = Date.now();
  const r = spawnSync('node', [CLI, 'init', name, ...extra], { cwd: dir, encoding: 'utf8' });
  return { status: r.status ?? -1, ms: Date.now() - t0 };
}

describe('spec-init init', () => {
  let workspace: string;

  beforeAll(() => {
    workspace = mkdtempSync(join(tmpdir(), 'throughspec-init-'));
  });

  it('produces the SRS §6 tree under 5 seconds', () => {
    const { status, ms } = initInto(workspace, 'perf-project', ['--persona', 'engineer']);
    expect(status).toBe(0);
    expect(ms).toBeLessThan(5_000);
    for (const rel of REQUIRED) {
      expect(existsSync(join(workspace, 'perf-project', rel)), rel).toBe(true);
    }
    expect(existsSync(join(workspace, 'perf-project', '.spec-init/base/CLAUDE.md'))).toBe(true);
  });

  it('strips persona blocks (student keeps only its section)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-persona-'));
    initInto(dir, 'p', ['--persona', 'student']);
    const claude = readFileSync(join(dir, 'p/CLAUDE.md'), 'utf8');
    expect(claude).toContain('For the Student');
    expect(claude).not.toContain('For the Vibe-Coder');
    expect(claude).not.toContain('For the Solo Engineer');
    expect(claude).not.toContain('For the Team Lead');
  });

  it('activates integration blocks and payload files when --integrations is passed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-integ-'));
    initInto(dir, 'p', ['--persona', 'vibe', '--integrations', 'graphify,obsidian']);
    const proj = join(dir, 'p');
    const claude = readFileSync(join(proj, 'CLAUDE.md'), 'utf8');
    expect(claude).toContain('**Graphify**');
    expect(claude).toContain('**Obsidian**');
    // Marker fences are consumed at init and must not appear in the output.
    expect(claude).not.toContain('<!-- integration:');
    // Integration file trees are present on disk.
    expect(existsSync(join(proj, '.graphify/config.yml'))).toBe(true);
    expect(existsSync(join(proj, '.obsidian/workspace.json'))).toBe(true);
    // Obsidian front-matter reaches every claude/*.md and design/design.md.
    for (const rel of [
      'claude/srs.md',
      'claude/plan.md',
      'claude/context.md',
      'claude/features.md',
      'claude/learnings.md',
      'claude/design-decisions.md',
      'design/design.md',
    ]) {
      const head = readFileSync(join(proj, rel), 'utf8').slice(0, 100);
      expect(head.startsWith('---\n'), rel).toBe(true);
    }
  });

  it('omits integration blocks and files when --integrations is not passed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-no-integ-'));
    initInto(dir, 'p', ['--persona', 'engineer']);
    const proj = join(dir, 'p');
    const claude = readFileSync(join(proj, 'CLAUDE.md'), 'utf8');
    expect(claude).not.toContain('**Graphify**');
    expect(claude).not.toContain('**Obsidian**');
    expect(claude).not.toContain('<!-- integration:');
    expect(existsSync(join(proj, '.graphify'))).toBe(false);
    expect(existsSync(join(proj, '.obsidian'))).toBe(false);
    const srsHead = readFileSync(join(proj, 'claude/srs.md'), 'utf8').slice(0, 30);
    expect(srsHead.startsWith('# ')).toBe(true);
  });

  it('refuses to overwrite a non-empty directory without --force', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-force-'));
    initInto(dir, 'p');
    const retry = initInto(dir, 'p');
    expect(retry.status).toBe(2);
    const forced = initInto(dir, 'p', ['--force']);
    expect(forced.status).toBe(0);
  });

  it('--dry-run writes no files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-dry-'));
    const r = spawnSync('node', [CLI, 'init', 'p', '--dry-run'], { cwd: dir, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(existsSync(join(dir, 'p'))).toBe(false);
  });

  it('ships a valid spec.config.js exporting skills/workflow/settings', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-config-'));
    initInto(dir, 'p', ['--persona', 'engineer']);
    const config = requireCjs(join(dir, 'p', 'spec.config.js'));
    expect(config).toMatchObject({
      skills: { disabled: expect.any(Array) },
      workflow: { phases: expect.any(Array), allowSkip: expect.any(Boolean) },
      settings: { commitSuggestions: expect.any(Boolean), customInstructions: expect.any(Array) },
    });
  });

  it('scaffolded output passes markdownlint and prettier --check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'throughspec-lint-'));
    initInto(dir, 'p', ['--persona', 'engineer']);
    const proj = join(dir, 'p');
    // Remove the .spec-init snapshot before lint since it contains raw templates
    // and lint has already been asserted on templates/ in Stage 2.
    writeFileSync(join(proj, '.markdownlintignore'), '.spec-init/\n');
    const ml = spawnSync(
      NPX,
      ['markdownlint-cli2', '--config', MARKDOWNLINT_CONFIG, '**/*.md', '!.spec-init/**'],
      { cwd: proj, encoding: 'utf8' },
    );
    expect(ml.status, `stdout:\n${ml.stdout}\nstderr:\n${ml.stderr}`).toBe(0);
    const pr = spawnSync(
      NPX,
      ['prettier', '--check', '--config', PRETTIER_CONFIG, '**/*.md', '!.spec-init/**'],
      { cwd: proj, encoding: 'utf8' },
    );
    expect(pr.status, `stdout:\n${pr.stdout}\nstderr:\n${pr.stderr}`).toBe(0);
  });
});
