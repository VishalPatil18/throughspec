// spec-init customize --add/--remove/--persona: update spec.config.js (ground
// truth), re-derive CLAUDE.md's managed region, and add/remove integration files.

import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { UsageError } from '../args.js';
import type { CliOptions, Integration } from '../args.js';
import { resolvePayloadDir } from '../payload.js';
import { isManaged, readConfig, writeConfig } from '../config.js';
import { swapManagedRegions } from '../managed-region.js';
import { installIntegrations } from '../integrations.js';
import { applyIntegrations, maybeTransform, walkPayload } from './init.js';

/** Run `customize`. Requires exactly one of --add / --remove / --persona. */
export function runCustomize(opts: CliOptions): void {
  const projectRoot = resolve(process.cwd());
  if (!isManaged(projectRoot)) {
    throw new UsageError('customize must be run inside a scaffolded project (spec.config.js not found)');
  }

  const actions = [opts.addIntegration, opts.removeIntegration, opts.persona].filter(Boolean).length;
  if (actions === 0) throw new UsageError('customize requires --add, --remove, or --persona');
  if (actions > 1) {
    throw new UsageError('customize accepts one of --add / --remove / --persona per invocation');
  }

  const cfg = readConfig(projectRoot);
  const next = { persona: cfg.persona, integrations: [...cfg.integrations] };
  let target: Integration | null = null;
  let mode: 'add' | 'remove' | 'persona' = 'persona';

  if (opts.addIntegration) {
    mode = 'add';
    target = opts.addIntegration;
    if (!next.integrations.includes(target)) next.integrations.push(target);
  } else if (opts.removeIntegration) {
    mode = 'remove';
    target = opts.removeIntegration;
    next.integrations = next.integrations.filter((n) => n !== target);
  } else if (opts.persona) {
    next.persona = opts.persona;
  }

  const payloadDir = resolvePayloadDir();

  if (opts.dryRun) {
    process.stdout.write(
      `[dry-run] would set persona=${next.persona ?? 'engineer'}, integrations=[${next.integrations.join(', ')}]\n`,
    );
    return;
  }

  // 1. Persist config (ground truth).
  writeConfig(projectRoot, next);

  // 2. Re-derive CLAUDE.md's managed region for the new persona/integrations.
  const claudeOurs = join(projectRoot, 'CLAUDE.md');
  if (existsSync(claudeOurs)) {
    const theirs = maybeTransform(
      'CLAUDE.md',
      readFileSync(join(payloadDir, 'CLAUDE.md'), 'utf8'),
      next.persona,
      next.integrations,
    );
    const swapped = swapManagedRegions(readFileSync(claudeOurs, 'utf8'), theirs);
    if (swapped) writeFileSync(claudeOurs, swapped);
  }

  // 3. Integration files: add copies them in, remove deletes them.
  let touched = 0;
  if (mode === 'add' && target) {
    touched = applyIntegrations(payloadDir, projectRoot, [target]);
  } else if (mode === 'remove' && target) {
    touched = removeIntegrationFiles(payloadDir, projectRoot, target);
  }

  // 4. Auto-install a newly added integration (respects --no-install / non-TTY).
  if (mode === 'add' && target) {
    installIntegrations([target], { isTty: Boolean(process.stdin.isTTY), noInstall: opts.noInstall });
  }

  process.stdout.write(
    `[OK] customize: persona=${next.persona ?? 'engineer'}, integrations=[${next.integrations.join(', ')}] ` +
      `(${touched} integration file(s) changed)\n`,
  );
}

/** Delete an integration's files from the project and prune emptied dirs. */
function removeIntegrationFiles(payloadDir: string, projectRoot: string, target: Integration): number {
  const root = join(payloadDir, '_integrations', target);
  if (!existsSync(root)) return 0;
  let count = 0;
  const dirs = new Set<string>();
  for (const rel of walkPayload(root)) {
    const dest = join(projectRoot, rel);
    if (existsSync(dest)) {
      rmSync(dest);
      count += 1;
      dirs.add(dirname(rel));
    }
  }
  pruneEmpty(projectRoot, dirs);
  return count;
}

/** Remove now-empty directories that hosted an integration's files. */
function pruneEmpty(outDir: string, dirs: Set<string>): void {
  const ordered = [...dirs].sort((a, b) => b.length - a.length);
  for (const relDir of ordered) {
    let cur = relDir;
    while (cur && cur !== '.') {
      const abs = join(outDir, cur);
      if (!existsSync(abs)) break;
      if (readdirSync(abs).length > 0) break;
      rmSync(abs, { recursive: true });
      cur = dirname(cur);
    }
  }
}
