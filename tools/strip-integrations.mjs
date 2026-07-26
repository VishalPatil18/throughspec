#!/usr/bin/env node
// Integration-strip CLI for templates: keep/remove <!-- integration:NAME --> blocks per --active.

import { readFileSync, writeFileSync } from 'node:fs';
import { argv, exit, stdout } from 'node:process';

export const INTEGRATION_NAMES = [
  'graphify',
  'obsidian',
  'caveman',
  'agentmemory',
  'openwiki',
  'ponytail',
  'opencodereview',
];
const VALID = new Set(INTEGRATION_NAMES);

function parseArgs(args) {
  const parsed = { active: null, in: null, out: null };
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const val = args[i + 1];
    if (key === '--active') {
      parsed.active = val;
      i += 1;
    } else if (key === '--in') {
      parsed.in = val;
      i += 1;
    } else if (key === '--out') {
      parsed.out = val;
      i += 1;
    } else if (key === '-h' || key === '--help') {
      parsed.help = true;
    }
  }
  return parsed;
}

function usage() {
  return [
    'Usage: node tools/strip-integrations.mjs --active <csv> --in <path> [--out <path>]',
    `  --active   CSV of active integrations (subset of: ${INTEGRATION_NAMES.join(' | ')})`,
    '  --in       path to source markdown',
    '  --out      destination path (default: stdout)',
  ].join('\n');
}

/** Strip integration-gated blocks, keeping those whose NAME is in active. Exported for tests. */
export function stripIntegrations(source, active) {
  const set = new Set(active);
  for (const name of set) {
    if (!VALID.has(name)) throw new Error(`unknown integration: ${name}`);
  }
  const blockRe = /<!--\s*integration:([a-z]+)\s*-->([\s\S]*?)<!--\s*\/integration:\1\s*-->\n?/g;
  let stripped = source.replace(blockRe, (_match, name, body) => {
    if (!VALID.has(name)) throw new Error(`unknown integration in marker: ${name}`);
    return set.has(name) ? body : '';
  });
  // Drop prettier-ignore helper comments so kept front-matter lands on line 1.
  stripped = stripped.replace(/<!--\s*prettier-ignore-(start|end)\s*-->\n?/g, '');
  // Whitespace hygiene + leading-newline trim so top-of-file blocks land on line 1.
  return stripped.replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '').replace(/\n+$/, '\n');
}

function main() {
  const args = parseArgs(argv.slice(2));
  if (args.help) {
    stdout.write(`${usage()}\n`);
    return;
  }
  if (args.active === null || !args.in) {
    process.stderr.write(`error: --active and --in are required\n\n${usage()}\n`);
    exit(2);
  }
  const active = args.active
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const source = readFileSync(args.in, 'utf8');
  const out = stripIntegrations(source, active);
  if (args.out) {
    writeFileSync(args.out, out);
  } else {
    stdout.write(out);
  }
}

const invokedDirectly = import.meta.url === `file://${argv[1]}`;
if (invokedDirectly) {
  main();
}
