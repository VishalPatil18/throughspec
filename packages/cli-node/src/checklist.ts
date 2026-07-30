// Post-init checklist: the "what to do next" summary after scaffolding (FR-INIT-04).

import type { Integration, Persona } from './args.js';
import { INTEGRATION_REGISTRY } from './integrations.js';
import type { InstallResult } from './integrations.js';

/** One-line, persona-specific guidance printed after a scaffold. */
export const PERSONA_GUIDANCE: Record<Persona, string> = {
  vibe: 'Ship first. Ask Claude to explain any heavy step in one line before doing it - but never skip a required cross-question.',
  student: 'After each phase, ask Claude "Why this step?" and append the answer to claude/learnings.md.',
  engineer: 'Read claude/context.md before Grep (cheaper), and log every non-trivial decision to claude/design-decisions.md.',
  team: 'Every PR runs the checklist in .github/pull_request_template.md; treat unresolved memory-file conflicts as blocking.',
};

/** Return the post-init checklist as a string. `outDir` is the scaffold path. */
export function postInitChecklist(
  outDir: string,
  persona: Persona | null,
  integrations: readonly Integration[] = [],
  installResults: readonly InstallResult[] = [],
  verb = 'Scaffolded',
): string {
  const lines = ['', `[OK] ${verb} ${outDir}`, ''];

  if (persona) {
    lines.push(`Persona: ${persona}`);
    lines.push(`  ${PERSONA_GUIDANCE[persona]}`);
    lines.push('  Change it any time with: spec-init customize --persona <name>');
    lines.push('');
  }

  lines.push('Next steps:');
  lines.push(`  1. cd ${outDir}`);
  lines.push('  2. Open the project in Claude Code');
  lines.push('  3. Run /spec-requirements to build claude/srs.md');
  lines.push('  4. Then /spec-design and /spec-plan');
  lines.push('');

  if (integrations.length > 0) {
    lines.push('Integrations enabled:');
    for (const name of integrations) {
      const info = INTEGRATION_REGISTRY[name];
      const res = installResults.find((r) => r.name === name);
      let tag = '';
      if (res?.status === 'installed') tag = '  [installed]';
      else if (res?.status === 'failed') tag = `  [install failed - run: ${res.command}]`;
      else if (res?.status === 'manual') tag = `  [install: ${res.command}]`;
      lines.push(`  - ${info.title}${tag}`);
      lines.push(`    docs: ${info.docsUrl}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
