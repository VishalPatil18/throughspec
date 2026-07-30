// Read/write the CLI-managed persona + integrations in spec.config.js.
// spec.config.js is the project's ground-truth config; the CLI only touches the
// two fields inside the `spec-init:managed` markers and reads them by regex
// (the file is JS, so this must work without executing it - the Python CLI
// mirrors the same parsing).

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { INTEGRATIONS, PERSONAS } from './args.js';
import type { Integration, Persona } from './args.js';

export const DEFAULT_PERSONA: Persona = 'engineer';

export interface ProjectConfig {
  persona: Persona | null;
  integrations: Integration[];
}

const PERSONA_RE = /persona:\s*['"]([^'"]*)['"]/;
const INTEGRATIONS_RE = /integrations:\s*\[([\s\S]*?)\]/;

/** Absolute path to a project's spec.config.js. */
export function configPath(projectRoot: string): string {
  return join(projectRoot, 'spec.config.js');
}

/** True when a directory looks Throughspec-managed (has spec.config.js). */
export function isManaged(projectRoot: string): boolean {
  return existsSync(configPath(projectRoot));
}

/** Parse persona + integrations out of a spec.config.js source string. */
export function parseConfig(src: string): ProjectConfig {
  let persona: Persona | null = null;
  const pm = src.match(PERSONA_RE);
  if (pm && (PERSONAS as readonly string[]).includes(pm[1] as string)) {
    persona = pm[1] as Persona;
  }
  const integrations: Integration[] = [];
  const im = src.match(INTEGRATIONS_RE);
  if (im) {
    for (const m of (im[1] ?? '').matchAll(/['"]([a-z-]+)['"]/g)) {
      const name = m[1] as string;
      if ((INTEGRATIONS as readonly string[]).includes(name)) integrations.push(name as Integration);
    }
  }
  return { persona, integrations };
}

/** Read persona + integrations from a project's spec.config.js. */
export function readConfig(projectRoot: string): ProjectConfig {
  const p = configPath(projectRoot);
  if (!existsSync(p)) return { persona: null, integrations: [] };
  return parseConfig(readFileSync(p, 'utf8'));
}

/** Return `src` with the managed persona + integrations fields set to `cfg`. */
export function applyConfig(src: string, cfg: ProjectConfig): string {
  const list = cfg.integrations.map((i) => `'${i}'`).join(', ');
  let out = src.replace(PERSONA_RE, `persona: '${cfg.persona ?? DEFAULT_PERSONA}'`);
  out = out.replace(INTEGRATIONS_RE, `integrations: [${list}]`);
  return out;
}

/** Write persona + integrations into a project's spec.config.js in place. */
export function writeConfig(projectRoot: string, cfg: ProjectConfig): void {
  const p = configPath(projectRoot);
  writeFileSync(p, applyConfig(readFileSync(p, 'utf8'), cfg));
}

const MANAGED_BLOCK =
  '  // <spec-init:managed>\n' +
  "  persona: 'engineer',\n" +
  '  integrations: [],\n' +
  '  // </spec-init:managed>\n\n';

/**
 * Migrate a pre-1.2 project (which stored persona/integrations in
 * .spec-init/meta.json and kept a full .spec-init/base snapshot) to the
 * spec.config.js-as-ground-truth model, then delete .spec-init/. Returns true
 * when a migration happened. Safe to call on already-migrated projects (no-op).
 */
export function migrateLegacy(projectRoot: string): boolean {
  const specDir = join(projectRoot, '.spec-init');
  if (!existsSync(specDir)) return false;

  let persona: Persona | null = null;
  let integrations: Integration[] = [];
  const metaPath = join(specDir, 'meta.json');
  if (existsSync(metaPath)) {
    try {
      const raw = JSON.parse(readFileSync(metaPath, 'utf8'));
      if ((PERSONAS as readonly string[]).includes(raw.persona)) persona = raw.persona;
      if (Array.isArray(raw.integrations)) {
        integrations = raw.integrations.filter((n: unknown) =>
          (INTEGRATIONS as readonly string[]).includes(n as string),
        );
      }
    } catch {
      /* ignore malformed legacy meta */
    }
  }

  const cfgPath = configPath(projectRoot);
  if (existsSync(cfgPath)) {
    let src = readFileSync(cfgPath, 'utf8');
    if (!/persona:\s*['"]/.test(src)) {
      // Old-format spec.config.js: drop the legacy comment line, inject the block.
      src = src.replace(/\/\/ active-persona:.*\n\n?/, '');
      src = src.replace(/module\.exports = \{\n/, `module.exports = {\n${MANAGED_BLOCK}`);
    }
    writeFileSync(cfgPath, applyConfig(src, { persona, integrations }));
  }

  rmSync(specDir, { recursive: true, force: true });
  return true;
}
