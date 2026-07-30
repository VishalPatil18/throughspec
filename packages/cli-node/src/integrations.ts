// Integration-strip: byte-parity TS port of tools/strip-integrations.mjs.

import { spawnSync } from 'node:child_process';
import type { Integration } from './args.js';

export const INTEGRATION_NAMES: readonly Integration[] = [
  'graphify',
  'obsidian',
  'caveman',
  'agentmemory',
  'openwiki',
  'ponytail',
  'opencodereview',
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

// --- Registry: docs + optional local installer per integration ------------

export interface IntegrationInfo {
  title: string;
  docsUrl: string;
  /** argv of a local install command, or null when there is no clean installer. */
  install: string[] | null;
}

/** Metadata for every integration: friendly name, official docs, installer. */
export const INTEGRATION_REGISTRY: Record<Integration, IntegrationInfo> = {
  graphify: { title: 'Graphify', docsUrl: 'https://graphify.net/', install: null },
  obsidian: { title: 'Obsidian', docsUrl: 'https://obsidian.md/', install: null },
  caveman: {
    title: 'Caveman',
    docsUrl: 'https://github.com/JuliusBrussee/caveman',
    install: ['npx', '--yes', 'skills', 'add', 'JuliusBrussee/caveman'],
  },
  agentmemory: { title: 'agentmemory', docsUrl: 'https://github.com/rohitg00/agentmemory', install: null },
  openwiki: { title: 'openwiki', docsUrl: 'https://github.com/langchain-ai/openwiki', install: null },
  ponytail: { title: 'ponytail', docsUrl: 'https://github.com/DietrichGebert/ponytail', install: null },
  opencodereview: { title: 'Open Code Review', docsUrl: 'https://github.com/alibaba/open-code-review', install: null },
};

export interface InstallResult {
  name: Integration;
  status: 'installed' | 'failed' | 'manual' | 'skipped';
  command?: string;
}

export interface InstallOpts {
  isTty: boolean;
  noInstall: boolean;
  /** Injectable runner for tests; defaults to spawnSync inheriting stdio. */
  run?: (argv: string[]) => boolean;
}

function defaultRun(argv: string[]): boolean {
  const r = spawnSync(argv[0] as string, argv.slice(1), { stdio: 'inherit' });
  return r.status === 0;
}

/**
 * Run the known installer for each active integration that has one.
 * Skips all installs on a non-TTY run or when `noInstall` is set (prints the
 * command as `manual` instead). Never throws - a failed install is reported,
 * not fatal, so the scaffold still succeeds.
 */
export function installIntegrations(
  active: readonly Integration[],
  opts: InstallOpts,
): InstallResult[] {
  const run = opts.run ?? defaultRun;
  const out: InstallResult[] = [];
  for (const name of active) {
    const info = INTEGRATION_REGISTRY[name];
    if (!info.install) continue; // link-only integration
    const command = info.install.join(' ');
    if (opts.noInstall || !opts.isTty) {
      out.push({ name, status: 'manual', command });
      continue;
    }
    process.stdout.write(`\nInstalling ${info.title}: ${command}\n`);
    out.push({ name, status: run(info.install) ? 'installed' : 'failed', command });
  }
  return out;
}
