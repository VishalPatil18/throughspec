#!/usr/bin/env node
// Aggregate the programmatic SRS §9 acceptance checks into one pass/fail summary (ci.yml).

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath handles Windows drive letters that new URL().pathname would mangle.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CHECKS = [
  {
    id: 'SRS §9.1',
    name: 'Payload parity: npm and PyPI trees byte-match by SHA-256',
    run: () => execFileSync('node', ['tools/check-payload-parity.mjs'], { cwd: REPO }),
  },
  {
    id: 'SRS §9.2 / §NFR-PORT-01',
    name: 'Node CLI builds and dist/index.js is executable',
    run: () => {
      execFileSync('npm', ['run', 'build', '-w', 'packages/cli-node'], { cwd: REPO });
      const bin = resolve(REPO, 'packages/cli-node/dist/index.js');
      if (!existsSync(bin)) throw new Error(`missing ${bin}`);
    },
  },
  {
    id: 'SRS §9.3',
    name: 'All 9 skills + 7 agents present in the template payload',
    run: () => {
      const skills = [
        'spec-requirements',
        'spec-design',
        'spec-plan',
        'spec-feature',
        'spec-refactor',
        'spec-bug',
        'spec-docs',
        'spec-sync',
      ];
      const agents = [
        'spec-interrogator',
        'spec-architect',
        'spec-planner',
        'spec-coder',
        'spec-refactorer',
        'spec-doc-writer',
        'spec-bug-hunter',
      ];
      for (const s of skills) {
        const p = resolve(REPO, `templates/.claude/skills/${s}/SKILL.md`);
        if (!existsSync(p)) throw new Error(`missing skill ${s}`);
      }
      for (const a of agents) {
        const p = resolve(REPO, `templates/.claude/agents/${a}.md`);
        if (!existsSync(p)) throw new Error(`missing agent ${a}`);
      }
    },
  },
  {
    id: 'SRS §9.5 / NFR-PERF-02',
    name: 'Token budget: CLAUDE.md + context.md under 8k tokens',
    run: () => execFileSync('npm', ['run', 'stage2:tokens'], { cwd: REPO }),
  },
  {
    id: 'SRS §9.6',
    name: 'Full Vitest suite green (parity, persona, integrations, skills, agents)',
    run: () => execFileSync('npx', ['vitest', 'run'], { cwd: REPO }),
  },
  {
    id: 'SRS §9.7',
    name: 'Template markdownlint + prettier pass on a fresh copy',
    run: () => execFileSync('npx', ['vitest', 'run', 'tests/lint.test.ts'], { cwd: REPO }),
  },
  {
    id: 'SRS §9.8',
    name: 'Integration toggle roundtrip leaves zero residual files',
    run: () => execFileSync('npx', ['vitest', 'run', 'tests/integrations.test.ts'], { cwd: REPO }),
  },
];

const HUMAN_ONLY = [
  'SRS §9.4 - 90-minute new-user walkthrough (LLM required; see tests/acceptance/runbook.md)',
  'SRS §9.5 - Cycle-5 token budget ≤ 120% of cycle 1 (5 real feature cycles required; see runbook)',
  'SRS §9.7 - Website live at throughspec.v-ai.org with Lighthouse ≥ 90 / ≥ 95 (Vercel post-deploy check)',
];

const pass = [];
const fail = [];
for (const c of CHECKS) {
  process.stdout.write(`[..] ${c.id.padEnd(28)} ${c.name}\n`);
  try {
    c.run();
    pass.push(c);
    process.stdout.write(`\x1b[32m[OK]\x1b[0m ${c.id.padEnd(28)} ${c.name}\n`);
  } catch (err) {
    fail.push({ ...c, err });
    process.stdout.write(`\x1b[31m[FAIL]\x1b[0m ${c.id.padEnd(28)} ${c.name}\n`);
    process.stdout.write(`       ${err.message?.split('\n')[0] ?? err}\n`);
  }
}

process.stdout.write('\n─────── Programmatic §9 summary ───────\n');
process.stdout.write(`  passed: ${pass.length}/${CHECKS.length}\n`);
process.stdout.write(`  failed: ${fail.length}\n\n`);

process.stdout.write('─────── Human-only §9 items ───────\n');
for (const h of HUMAN_ONLY) process.stdout.write(`  · ${h}\n`);

process.exit(fail.length === 0 ? 0 : 1);
