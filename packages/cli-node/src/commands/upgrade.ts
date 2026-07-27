// spec-init upgrade: three-way merge the new payload into the project via .spec-init/base/.

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions } from '../args.js';
import { resolvePayloadDir } from '../payload.js';
import { threeWayMerge } from '../three-way-merge.js';

interface UpgradeReport {
  updated: string[];
  merged: string[];
  conflicted: string[];
}

/** Run `upgrade`. Non-zero exit is left to the caller when conflicts arise. */
export function runUpgrade(opts: CliOptions): UpgradeReport {
  const projectRoot = resolve(process.cwd());
  const baseDir = join(projectRoot, '.spec-init', 'base');
  if (!existsSync(baseDir)) {
    throw new UsageError(
      'upgrade requires the .spec-init/base/ snapshot. Was this project scaffolded with spec-init?',
    );
  }
  const theirsDir = resolvePayloadDir();

  const report: UpgradeReport = { updated: [], merged: [], conflicted: [] };
  for (const rel of walk(theirsDir)) {
    const basePath = join(baseDir, rel);
    const oursPath = join(projectRoot, rel);
    const theirsPath = join(theirsDir, rel);

    const theirs = readFileSync(theirsPath, 'utf8');
    const base = existsSync(basePath) ? readFileSync(basePath, 'utf8') : '';
    const ours = existsSync(oursPath) ? readFileSync(oursPath, 'utf8') : base;

    if (base === theirs) continue; // template unchanged in this release
    if (base === ours) {
      // user hasn't edited - safe to take theirs
      if (opts.dryRun) {
        report.updated.push(rel);
        continue;
      }
      mkdirSync(dirname(oursPath), { recursive: true });
      writeFileSync(oursPath, theirs);
      report.updated.push(rel);
      continue;
    }

    const { merged, hasConflict } = threeWayMerge(base, ours, theirs);
    if (opts.dryRun) {
      (hasConflict ? report.conflicted : report.merged).push(rel);
      continue;
    }
    mkdirSync(dirname(oursPath), { recursive: true });
    writeFileSync(oursPath, merged);
    (hasConflict ? report.conflicted : report.merged).push(rel);
  }

  if (!opts.dryRun) {
    // Refresh the snapshot so the next upgrade uses the new baseline.
    cpSync(theirsDir, baseDir, { recursive: true });
  }

  printReport(report, opts.dryRun);
  return report;
}

function printReport(r: UpgradeReport, dryRun: boolean): void {
  const prefix = dryRun ? '[dry-run] ' : '';
  process.stdout.write(`${prefix}upgrade summary:\n`);
  process.stdout.write(`${prefix}  ${r.updated.length} taken from new template\n`);
  process.stdout.write(`${prefix}  ${r.merged.length} merged cleanly\n`);
  process.stdout.write(`${prefix}  ${r.conflicted.length} conflicts requiring manual resolution\n`);
  for (const rel of r.conflicted) process.stdout.write(`${prefix}    ! ${rel}\n`);
}

function walk(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(relative(root, full).split(/[\\/]/).join('/'));
      }
    }
  }
  return out.sort();
}
