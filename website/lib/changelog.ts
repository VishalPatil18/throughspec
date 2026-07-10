// Build-time parser for the repo-root CHANGELOG.md. Runs at RSC render
// time (server-only) so the file is read once during `next build` and never
// shipped to the client.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ChangelogGroup {
  kind: string; // Added | Changed | Fixed | Deprecated | Removed | Security
  items: string[];
}

export interface Release {
  version: string; // e.g. "Unreleased" or "1.0.0"
  date: string | null; // ISO string when present in the heading
  groups: ChangelogGroup[];
}

const CHANGELOG_PATH = resolve(process.cwd(), '..', 'CHANGELOG.md');

/** Parse the repo's CHANGELOG.md into structured Release entries. */
export function loadChangelog(): Release[] {
  const src = readFileSync(CHANGELOG_PATH, 'utf8');
  const lines = src.split('\n');
  const releases: Release[] = [];
  let current: Release | null = null;
  let group: ChangelogGroup | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const h2 = line.match(/^##\s+\[(.+?)\](?:\s*-\s*(.+))?$/);
    if (h2) {
      if (current) releases.push(current);
      current = { version: h2[1]!, date: h2[2]?.trim() || null, groups: [] };
      group = null;
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3 && current) {
      group = { kind: h3[1]!.trim(), items: [] };
      current.groups.push(group);
      continue;
    }
    const bullet = line.match(/^\s*-\s+(.+)$/);
    if (bullet && group) {
      // Strip nested-bullet Markdown (Keep-a-Changelog often has indented lists).
      group.items[group.items.length - 1] && line.startsWith('  ')
        ? (group.items[group.items.length - 1] += ` ${bullet[1]}`)
        : group.items.push(bullet[1]!);
    }
  }
  if (current) releases.push(current);
  return releases;
}
