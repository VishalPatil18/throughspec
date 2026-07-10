// Integration-strip parity: the TS port in packages/cli-node/src/integrations.ts
// must produce byte-identical output to tools/strip-integrations.mjs.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs sibling without types
import { stripIntegrations as stripMjs } from '../tools/strip-integrations.mjs';
import { stripIntegrations as stripTs } from '../packages/cli-node/dist/integrations.js';

const FIXTURES = [
  resolve(__dirname, '..', 'templates/CLAUDE.md'),
  resolve(__dirname, '..', 'templates/README.md'),
  resolve(__dirname, '..', 'templates/claude/srs.md'),
  resolve(__dirname, '..', 'templates/design/design.md'),
];

const ACTIVE_SETS = [[], ['graphify'], ['obsidian'], ['graphify', 'obsidian']] as const;

describe('integration-strip parity', () => {
  for (const path of FIXTURES) {
    const source = readFileSync(path, 'utf8');
    for (const active of ACTIVE_SETS) {
      it(`TS and .mjs agree for ${path.split('/').pop()} active=[${active.join(',')}]`, () => {
        expect(stripTs(source, active as unknown as never)).toBe(stripMjs(source, active));
      });
    }
  }
});
