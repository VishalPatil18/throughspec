// Persona-strip: TypeScript port of `tools/strip-personas.mjs`.
//
// Kept byte-for-byte equivalent to the .mjs source. `tests/stage3/parity.test.ts`
// asserts both produce identical output on the same input.
//
// Marker convention: `<!-- persona:NAME(,NAME)* -->` ... `<!-- /persona:NAME(,NAME)* -->`.
// A block is retained when the chosen persona appears in NAME's CSV list.

import type { Persona } from './args.js';

const VALID: ReadonlySet<string> = new Set(['vibe', 'student', 'engineer', 'team']);

/** Strip persona-gated blocks from `source`, keeping only those matching `persona`. */
export function stripPersonas(source: string, persona: Persona): string {
  if (!VALID.has(persona)) {
    throw new Error(`unknown persona: ${persona}`);
  }
  const blockRe = /<!--\s*persona:([a-z,\s]+)\s*-->([\s\S]*?)<!--\s*\/persona:\1\s*-->\n?/g;
  const stripped = source.replace(blockRe, (_match, namesRaw: string, body: string) => {
    const names = namesRaw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.some((n) => !VALID.has(n))) {
      throw new Error(`unknown persona in marker: ${namesRaw.trim()}`);
    }
    return names.includes(persona) ? body : '';
  });
  // Removing a block leaves the source's surrounding blank lines behind.
  // Collapse any resulting run of 3+ newlines to the canonical paragraph break,
  // and ensure the file ends with a single trailing newline.
  return stripped.replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
}
