// Strip persona-gated blocks; byte-parity TS port of tools/strip-personas.mjs.

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
  // Collapse 3+ newlines left by removed blocks; end with one trailing newline.
  return stripped.replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
}
