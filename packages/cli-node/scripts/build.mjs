#!/usr/bin/env node
// Build the Node CLI:
//   1. Compile TypeScript src/ -> dist/
//   2. Copy the canonical templates/ payload -> dist/templates/
//   3. Add a shebang and chmod the bin entry so it's executable.
//
// This script is intentionally dependency-free (just Node stdlib) so the build
// works on a clean clone without any optional tooling.

import { execSync } from 'node:child_process';
import { cpSync, chmodSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const repoRoot = resolve(packageRoot, '..', '..');
const templatesSrc = resolve(repoRoot, 'templates');
const distDir = resolve(packageRoot, 'dist');
const distTemplates = resolve(distDir, 'templates');
const binFile = resolve(distDir, 'index.js');

function log(msg) {
  console.log(`[cli-node:build] ${msg}`);
}

if (!existsSync(templatesSrc)) {
  console.error(`[cli-node:build] FATAL: templates/ not found at ${templatesSrc}`);
  process.exit(1);
}

if (existsSync(distDir)) {
  log('cleaning dist/');
  rmSync(distDir, { recursive: true, force: true });
}

log('compiling TypeScript');
execSync('npx tsc -p tsconfig.json', { cwd: packageRoot, stdio: 'inherit' });

log('copying templates payload');
cpSync(templatesSrc, distTemplates, { recursive: true });

if (existsSync(binFile)) {
  const original = readFileSync(binFile, 'utf8');
  if (!original.startsWith('#!')) {
    writeFileSync(binFile, `#!/usr/bin/env node\n${original}`);
  }
  chmodSync(binFile, 0o755);
  log('bin entry made executable');
} else {
  console.error(`[cli-node:build] FATAL: bin entry missing at ${binFile}`);
  process.exit(1);
}

log('done');
