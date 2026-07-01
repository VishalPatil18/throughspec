// Stage 2 token-budget test (NFR-PERF-02).
//
// Asserts that CLAUDE.md (stripped for any persona) + empty context.md
// stays under 8,000 tokens using the cl100k_base encoding as a proxy.

import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs sibling without types
import { stripPersonas } from '../tools/strip-personas.mjs';
// @ts-expect-error - .mjs sibling without types
import { countTokens } from '../tools/count-tokens.mjs';

const REPO_ROOT = resolve(__dirname, '..');
const CLAUDE_MD = resolve(REPO_ROOT, 'templates/CLAUDE.md');
const CONTEXT_MD = resolve(REPO_ROOT, 'templates/claude/context.md');
const BUDGET = 8_000;
const PERSONAS = ['vibe', 'student', 'engineer', 'team'] as const;

describe('NFR-PERF-02 token budget', () => {
  for (const persona of PERSONAS) {
    it(`stripped CLAUDE.md (${persona}) + context.md stays under ${BUDGET} tokens`, () => {
      const source = readFileSync(CLAUDE_MD, 'utf8');
      const stripped: string = stripPersonas(source, persona);

      const dir = mkdtempSync(join(tmpdir(), 'throughspec-tokens-'));
      const claudePath = join(dir, 'CLAUDE.md');
      const contextPath = join(dir, 'context.md');
      writeFileSync(claudePath, stripped);
      writeFileSync(contextPath, readFileSync(CONTEXT_MD));

      const { total } = countTokens([claudePath, contextPath]);
      expect(total).toBeLessThan(BUDGET);
    });
  }
});
