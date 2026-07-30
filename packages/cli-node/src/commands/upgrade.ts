// spec-init upgrade: pull a newer template into the project without losing data.
// CLI-owned files are replaced, user data is preserved, and mixed files
// (CLAUDE.md) have only their managed regions swapped. No snapshot needed - the
// shipped payload is the new template; spec.config.js is the ground-truth config.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions } from '../args.js';
import { resolvePayloadDir } from '../payload.js';
import { isManaged, migrateLegacy, readConfig } from '../config.js';
import { classify, swapManagedRegions } from '../managed-region.js';
import { INTEGRATIONS_PREFIX, applyIntegrations, maybeTransform } from './init.js';

interface UpgradeReport {
  replaced: string[];
  preserved: string[];
  managed: string[];
  added: string[];
  skipped: string[];
}

/** Run `upgrade`. Never overwrites user data; managed regions are swapped in place. */
export function runUpgrade(opts: CliOptions): UpgradeReport {
  const projectRoot = resolve(process.cwd());
  if (!isManaged(projectRoot)) {
    throw new UsageError(
      'not a Throughspec project (spec.config.js not found). Run `spec-init reinit` first.',
    );
  }
  const migrated = migrateLegacy(projectRoot);
  const cfg = readConfig(projectRoot);
  const theirsDir = resolvePayloadDir();
  const dry = opts.dryRun;

  const report: UpgradeReport = {
    replaced: [],
    preserved: [],
    managed: [],
    added: [],
    skipped: [],
  };

  for (const rel of walk(theirsDir)) {
    if (rel.startsWith(INTEGRATIONS_PREFIX)) continue; // integration files handled below
    const oursPath = join(projectRoot, rel);
    const theirsPath = join(theirsDir, rel);
    const cls = classify(rel);
    const theirs = maybeTransform(rel, readFileSync(theirsPath, 'utf8'), cfg.persona, cfg.integrations);

    if (cls === 'preserve') {
      if (existsSync(oursPath)) {
        report.preserved.push(rel);
      } else {
        if (!dry) writeFile(oursPath, theirs);
        report.added.push(rel); // a new user-data file introduced this release
      }
      continue;
    }

    if (cls === 'managed') {
      if (!existsSync(oursPath)) {
        if (!dry) writeFile(oursPath, theirs);
        report.added.push(rel);
        continue;
      }
      const ours = readFileSync(oursPath, 'utf8');
      const swapped = swapManagedRegions(ours, theirs);
      if (swapped === null) {
        report.skipped.push(rel); // no matching markers - keep user's file untouched
      } else if (swapped !== ours) {
        if (!dry) writeFileSync(oursPath, swapped);
        report.managed.push(rel);
      } else {
        report.preserved.push(rel); // regions already current
      }
      continue;
    }

    // replace (CLI-owned)
    const ours = existsSync(oursPath) ? readFileSync(oursPath, 'utf8') : null;
    if (ours === theirs) continue; // already current
    if (!dry) writeFile(oursPath, theirs);
    report.replaced.push(rel);
  }

  // Refresh files for active integrations (CLI-owned, always replaced).
  if (!dry) applyIntegrations(theirsDir, projectRoot, cfg.integrations);

  printReport(report, dry, migrated);
  return report;
}

function writeFile(dest: string, content: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content);
}

function printReport(r: UpgradeReport, dry: boolean, migrated: boolean): void {
  const p = dry ? '[dry-run] ' : '';
  if (migrated) process.stdout.write(`${p}migrated legacy .spec-init/ into spec.config.js\n`);
  process.stdout.write(`${p}upgrade summary:\n`);
  process.stdout.write(`${p}  ${r.replaced.length} replaced (CLI-owned)\n`);
  process.stdout.write(`${p}  ${r.managed.length} instructions refreshed (managed regions)\n`);
  process.stdout.write(`${p}  ${r.added.length} new files added\n`);
  process.stdout.write(`${p}  ${r.preserved.length} preserved (your data, untouched)\n`);
  if (r.skipped.length > 0) {
    process.stdout.write(`${p}  ${r.skipped.length} skipped (no managed markers - left as-is):\n`);
    for (const rel of r.skipped) process.stdout.write(`${p}    ~ ${rel}\n`);
  }
}

/** Recursively list files under `root` as sorted forward-slash relative paths. */
function walk(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
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
