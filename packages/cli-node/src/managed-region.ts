// Managed-region model: upgrade rewrites only CLI-owned regions of a mixed
// file (CLAUDE.md), never the user's content around them. File classes decide
// per-path whether upgrade replaces, preserves, or region-swaps a file.

export const MANAGED_START = '<!-- throughspec:managed:start -->';
export const MANAGED_END = '<!-- throughspec:managed:end -->';

const REGION_RE = /<!-- throughspec:managed:start -->[\s\S]*?<!-- throughspec:managed:end -->/g;

export type FileClass = 'preserve' | 'managed' | 'replace';

// User-owned data: never overwritten by upgrade (written only if missing).
const PRESERVE = new Set<string>([
  'claude/context.md',
  'claude/srs.md',
  'claude/plan.md',
  'claude/features.md',
  'claude/design-decisions.md',
  'claude/learnings.md',
  'design/design.md',
  'CHANGELOG.md',
  'README.md',
  'spec.config.js',
]);

// Mixed files: CLI instructions inside markers, user data outside.
const MANAGED = new Set<string>(['CLAUDE.md']);

/** Classify a payload-relative path for upgrade handling. */
export function classify(rel: string): FileClass {
  if (PRESERVE.has(rel)) return 'preserve';
  if (MANAGED.has(rel)) return 'managed';
  return 'replace';
}

/** Count the managed regions in a file. */
export function countRegions(text: string): number {
  return text.match(REGION_RE)?.length ?? 0;
}

/**
 * Return `ours` with each managed region replaced by the corresponding region
 * from `theirs` (matched by position). Returns null when the two files do not
 * have the same number of managed regions - the caller then preserves `ours`
 * rather than risk losing user content.
 */
export function swapManagedRegions(ours: string, theirs: string): string | null {
  const oursRegions = ours.match(REGION_RE) ?? [];
  const theirsRegions = theirs.match(REGION_RE) ?? [];
  if (oursRegions.length === 0 || oursRegions.length !== theirsRegions.length) return null;
  let i = 0;
  return ours.replace(REGION_RE, () => theirsRegions[i++] as string);
}
