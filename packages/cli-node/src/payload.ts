// Locates the dist/templates payload sitting next to the built CLI.

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the shipped templates payload; throws if missing. */
export function resolvePayloadDir(): string {
  const candidate = resolve(__dirname, 'templates');
  if (!existsSync(candidate)) {
    throw new Error(
      `spec-init: templates payload missing at ${candidate}. Reinstall the package.`,
    );
  }
  return candidate;
}
