#!/usr/bin/env node
// Persona-strip CLI for templates: keep/remove <!-- persona:NAME --> blocks per --persona.

import { readFileSync, writeFileSync } from 'node:fs';
import { argv, exit, stdout } from 'node:process';

const VALID_PERSONAS = new Set(['vibe', 'student', 'engineer', 'team']);

function parseArgs(args) {
  const parsed = { persona: null, in: null, out: null };
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const val = args[i + 1];
    if (key === '--persona') {
      parsed.persona = val;
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
    'Usage: node tools/strip-personas.mjs --persona <name> --in <path> [--out <path>]',
    `  --persona   one of: ${[...VALID_PERSONAS].join(' | ')}`,
    '  --in        path to source markdown',
    '  --out       destination path (default: stdout)',
  ].join('\n');
}

/** Strip persona-gated blocks, keeping those whose CSV name list contains persona. */
export function stripPersonas(source, persona) {
  if (!VALID_PERSONAS.has(persona)) {
    throw new Error(`unknown persona: ${persona}`);
  }
  const blockRe = /<!--\s*persona:([a-z,\s]+)\s*-->([\s\S]*?)<!--\s*\/persona:\1\s*-->\n?/g;
  const stripped = source.replace(blockRe, (match, namesRaw, body) => {
    const names = namesRaw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.some((n) => !VALID_PERSONAS.has(n))) {
      throw new Error(`unknown persona in marker: ${namesRaw.trim()}`);
    }
    return names.includes(persona) ? body : '';
  });
  // Collapse 3+ newlines left by removed blocks; end with one trailing newline.
  return stripped.replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
}

function main() {
  const args = parseArgs(argv.slice(2));
  if (args.help) {
    stdout.write(`${usage()}\n`);
    return;
  }
  if (!args.persona || !args.in) {
    process.stderr.write(`error: --persona and --in are required\n\n${usage()}\n`);
    exit(2);
  }
  const source = readFileSync(args.in, 'utf8');
  const stripped = stripPersonas(source, args.persona);
  if (args.out) {
    writeFileSync(args.out, stripped);
  } else {
    stdout.write(stripped);
  }
}

// Only run when invoked directly, not when imported by tests.
const invokedDirectly = import.meta.url === `file://${argv[1]}`;
if (invokedDirectly) {
  main();
}
