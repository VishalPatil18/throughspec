// Post-init checklist (FR-INIT-04, NFR-USE-01).
// Prints a single-screen "what to do next" summary after scaffolding.

import type { Integration, Persona } from './args.js';

/** Return the post-init checklist as a string. `outDir` is the scaffold path. */
export function postInitChecklist(
  outDir: string,
  persona: Persona | null,
  integrations: readonly Integration[] = [],
  verb = 'Scaffolded',
): string {
  const lines = [
    '',
    `[OK] ${verb} ${outDir}`,
    '',
    'Next steps:',
    `  1. cd ${outDir}`,
    '  2. Open the project in Claude Code',
    '  3. Run /spec-requirements to build claude/srs.md',
    '  4. Then /spec-design and /spec-plan',
    '',
  ];
  if (persona === 'student') {
    lines.push('Student mode: after each phase, ask Claude "Why this step?" and append to claude/learnings.md.');
    lines.push('');
  }
  if (integrations.includes('caveman')) {
    lines.push('Caveman enabled - install the skill once (free, local, no account):');
    lines.push('  npx skills add JuliusBrussee/caveman');
    lines.push('Then use /caveman in Claude Code. See claude/caveman.md.');
    lines.push('');
  }
  return lines.join('\n');
}
