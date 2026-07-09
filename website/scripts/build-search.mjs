#!/usr/bin/env node
// Post-build search-index generator. Runs pagefind against the static export
// in `out/` so search works fully client-side, with no backend.
//
// Invoked automatically by `npm run build` (see package.json). Emits its
// index to out/pagefind/, which the Search client component loads on demand.

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);

async function main() {
  if (!existsSync('out')) {
    console.error('[build-search] no out/ directory - run `next build` first.');
    process.exit(1);
  }
  console.log('[build-search] indexing out/ with pagefind ...');
  const { stdout } = await run(
    'npx',
    ['--yes', 'pagefind', '--site', 'out'],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  process.stdout.write(stdout);
  console.log('[build-search] done - index written to out/pagefind/');
}

main().catch((err) => {
  console.error('[build-search] failed:', err);
  process.exit(1);
});
