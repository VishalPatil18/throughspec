// Payload resolution.
//
// The CLI ships with `dist/templates/` sitting next to `dist/index.js`.
// This module locates that directory from `import.meta.url` so the CLI works
// whether invoked via `npx`, a global install, or a local tarball.

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to the templates directory shipped inside the built CLI.
 * Throws if not found - the CLI is unusable without it.
 */
export function resolvePayloadDir(): string {
  const candidate = resolve(__dirname, 'templates');
  if (!existsSync(candidate)) {
    throw new Error(
      `spec-init: templates payload missing at ${candidate}. Reinstall the package.`,
    );
  }
  return candidate;
}
