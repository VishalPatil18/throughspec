// Stage 2 persona-strip snapshot tests.
//
// Runs `tools/strip-personas.mjs` against `templates/CLAUDE.md` for every
// valid persona and snapshots the output. Guarantees:
//   1. Only the block for the chosen persona survives.
//   2. Other blocks (and their fences) are removed verbatim.
//   3. Unmarked content is retained.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs sibling without types
import { stripPersonas } from '../../tools/strip-personas.mjs';

const REPO_ROOT = resolve(__dirname, '..', '..');
const CLAUDE_MD = resolve(REPO_ROOT, 'templates/CLAUDE.md');
const PERSONAS = ['vibe', 'student', 'engineer', 'team'] as const;

describe('persona stripping', () => {
  const source = readFileSync(CLAUDE_MD, 'utf8');

  it('source contains all four persona markers', () => {
    for (const p of PERSONAS) {
      expect(source).toContain(`<!-- persona:${p} -->`);
      expect(source).toContain(`<!-- /persona:${p} -->`);
    }
  });

  for (const persona of PERSONAS) {
    it(`retains only the ${persona} block`, () => {
      const stripped: string = stripPersonas(source, persona);
      // No other persona's marker fences should survive. Match the fence form
      // exactly so the descriptive comment mentioning example names (which is
      // itself unmarked prose) does not trigger a false positive.
      for (const other of PERSONAS) {
        if (other === persona) continue;
        expect(stripped).not.toContain(`<!-- persona:${other} -->`);
        expect(stripped).not.toContain(`<!-- /persona:${other} -->`);
      }
      // Snapshot the whole file so drift is caught explicitly.
      expect(stripped).toMatchSnapshot();
    });
  }

  it('unmarked content survives every strip', () => {
    // "## 9. Quick links" is unmarked and must remain in every persona output.
    for (const persona of PERSONAS) {
      const stripped: string = stripPersonas(source, persona);
      expect(stripped).toContain('## 9. Quick links');
      expect(stripped).toContain('Template version');
    }
  });

  it('rejects an unknown persona', () => {
    expect(() => stripPersonas(source, 'ghost' as never)).toThrow(/unknown persona/);
  });
});
