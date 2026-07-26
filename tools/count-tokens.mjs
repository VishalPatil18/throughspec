#!/usr/bin/env node
// Token counter for templates using js-tiktoken cl100k_base (close Anthropic proxy).

import { readFileSync } from 'node:fs';
import { argv, exit, stdout } from 'node:process';
import { getEncoding } from 'js-tiktoken';

/** Count tokens across the given file paths (cl100k_base). Exported for tests. */
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
