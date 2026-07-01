// spec-init doctor
//
// Verifies a scaffolded project's shape. Exits 0 when healthy, non-zero
// (via caller) when issues are found. Checks:
//   - Required files from SRS §6 exist and are non-empty
//   - CLAUDE.md carries a template-version line
//   - .spec-init/base/ snapshot exists (needed for `upgrade`)

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REQUIRED_FILES = [
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
];

export interface DoctorReport {
  ok: boolean;
  issues: string[];
}

/** Run `doctor` in `cwd`. Returns a report; caller decides exit code. */
export function runDoctor(cwd: string = process.cwd()): DoctorReport {
  const root = resolve(cwd);
  const issues: string[] = [];

  for (const rel of REQUIRED_FILES) {
    const path = join(root, rel);
    if (!existsSync(path)) {
      issues.push(`missing required file: ${rel}`);
      continue;
    }
    if (statSync(path).size === 0) {
      issues.push(`required file is empty: ${rel}`);
    }
  }

  const claudeMd = join(root, 'CLAUDE.md');
  if (existsSync(claudeMd)) {
    const text = readFileSync(claudeMd, 'utf8');
    if (!/Template version/i.test(text)) {
      issues.push('CLAUDE.md is missing the "Template version" line');
    }
  }

  const baseSnapshot = join(root, '.spec-init', 'base');
  if (!existsSync(baseSnapshot)) {
    issues.push('missing .spec-init/base/ snapshot (upgrade will not work)');
  }

  const report: DoctorReport = { ok: issues.length === 0, issues };
  if (report.ok) {
    process.stdout.write('[OK] project looks healthy\n');
  } else {
    process.stderr.write(`spec-init doctor: ${issues.length} issue(s)\n`);
    for (const line of issues) process.stderr.write(`  - ${line}\n`);
  }
  return report;
}
