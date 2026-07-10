#!/usr/bin/env node
// Token counter for Throughspec templates.
//
// Uses js-tiktoken with the cl100k_base encoding (GPT-4 / GPT-3.5-turbo tokenizer,
// close-enough proxy for Anthropic token counts at this budget's precision).
//
// Usage:
//   node tools/count-tokens.mjs <path> [<path> ...]
//
// Prints a per-file count and a total. Exits 0.

import { readFileSync } from 'node:fs';
import { argv, exit, stdout } from 'node:process';
import { getEncoding } from 'js-tiktoken';

/**
 * Count tokens across the given file paths using the cl100k_base encoding.
 * Exported for tests.
 */
export function countTokens(paths) {
  const enc = getEncoding('cl100k_base');
  const perFile = [];
  let total = 0;
  for (const p of paths) {
    const text = readFileSync(p, 'utf8');
    const count = enc.encode(text).length;
    perFile.push({ path: p, tokens: count });
    total += count;
  }
  return { perFile, total };
}

function main() {
  const paths = argv.slice(2);
  if (paths.length === 0) {
    process.stderr.write('error: at least one path is required\n');
    exit(2);
  }
  const { perFile, total } = countTokens(paths);
  for (const { path, tokens } of perFile) {
    stdout.write(`${tokens.toString().padStart(8)} ${path}\n`);
  }
  stdout.write(`${total.toString().padStart(8)} TOTAL\n`);
}

const invokedDirectly = import.meta.url === `file://${argv[1]}`;
if (invokedDirectly) {
  main();
}
