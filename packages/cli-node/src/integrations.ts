// Integration-strip port for the Node CLI. Byte-parity with
// tools/strip-integrations.mjs is guarded by tests/integrations-parity.test.ts.

import type { Integration } from './args.js';

export const INTEGRATION_NAMES: readonly Integration[] = [
  'graphify',
  'obsidian',
  'caveman',
  'agentmemory',
  'openwiki',
];
const VALID = new Set<string>(INTEGRATION_NAMES);

/** Strip integration-gated blocks; keep those whose NAME appears in `active`. */
export function stripIntegrations(source: string, active: readonly Integration[]): string {
  const set = new Set<string>(active);
  const blockRe = /<!--\s*integration:([a-z]+)\s*-->([\s\S]*?)<!--\s*\/integration:\1\s*-->\n?/g;
  let stripped = source.replace(blockRe, (_match, name: string, body: string) => {
    if (!VALID.has(name)) throw new Error(`unknown integration in marker: ${name}`);
    return set.has(name) ? body : '';
  });
  stripped = stripped.replace(/<!--\s*prettier-ignore-(start|end)\s*-->\n?/g, '');
  return stripped.replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '').replace(/\n+$/, '\n');
}
