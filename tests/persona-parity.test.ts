// Persona-strip parity: the TS port in packages/cli-node/src/persona.ts must
// produce byte-identical output to the .mjs source in tools/strip-personas.mjs.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs sibling without types
import { stripPersonas as stripMjs } from '../tools/strip-personas.mjs';
import { stripPersonas as stripTs } from '../packages/cli-node/dist/persona.js';

const CLAUDE_MD = resolve(__dirname, '..', 'templates/CLAUDE.md');
const PERSONAS = ['vibe', 'student', 'engineer', 'team'] as const;

describe('persona-strip parity', () => {
  const source = readFileSync(CLAUDE_MD, 'utf8');
  for (const p of PERSONAS) {
    it(`TS and .mjs agree for persona=${p}`, () => {
      expect(stripTs(source, p)).toBe(stripMjs(source, p));
    });
  }
});
