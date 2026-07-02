// Structural validator for the sub-agents shipped in templates/.claude/agents/.
//
// Each agent is a Claude Code sub-agent definition - a prompt with a required
// YAML frontmatter block declaring name, description, and a tools allowlist.
// The tools allowlist is load-bearing: SRS §2.2.4 pins each agent to a specific
// set of tools so a rogue prompt cannot escape its scope. These tests fire red
// if the allowlist drifts from the SRS.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const AGENTS_ROOT = resolve(__dirname, '..', 'templates/.claude/agents');

interface Agent {
  name: string;
  content: string;
  frontmatter: Record<string, string>;
  body: string;
  tools: string[];
}

function loadAgent(name: string): Agent {
  const path = resolve(AGENTS_ROOT, `${name}.md`);
  const content = readFileSync(path, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`no YAML frontmatter in ${path}`);
  const frontmatter: Record<string, string> = {};
  for (const line of (match[1] as string).split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) frontmatter[kv[1] as string] = (kv[2] as string).trim();
  }
  const tools = (frontmatter.tools ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return { name, content, frontmatter, body: match[2] as string, tools };
}

const AGENT_ALLOWLIST: Record<string, string[]> = {
  'spec-interrogator': ['Read'],
  'spec-architect': ['Read', 'Grep', 'Glob'],
  'spec-planner': ['Read', 'Grep'],
  'spec-coder': ['Read', 'Write', 'Edit', 'Bash'],
  'spec-refactorer': ['Read', 'Edit'],
  'spec-doc-writer': ['Read', 'Write', 'Edit'],
};

for (const [agentName, allowlist] of Object.entries(AGENT_ALLOWLIST)) {
  describe(`${agentName} agent`, () => {
    const a = loadAgent(agentName);

    it('has valid frontmatter with name, description, and tools', () => {
      expect(a.frontmatter.name).toBe(agentName);
      expect(a.frontmatter.description).toBeDefined();
      expect((a.frontmatter.description as string).length).toBeGreaterThan(40);
      expect(a.frontmatter.tools).toBeDefined();
    });

    it('tool allowlist matches SRS §2.2.4 exactly', () => {
      expect(a.tools.sort()).toEqual([...allowlist].sort());
    });

    it('body carries the "MUST NOT" boundary section', () => {
      expect(a.body).toMatch(/MUST NOT|Do not/);
    });
  });
}

describe('agents cross-cutting', () => {
  it('every SRS §2.2.4 Stage-6 agent has a file', () => {
    for (const name of Object.keys(AGENT_ALLOWLIST)) {
      expect(() => loadAgent(name)).not.toThrow();
    }
  });

  it('spec-interrogator has no write tools', () => {
    const a = loadAgent('spec-interrogator');
    expect(a.tools).not.toContain('Write');
    expect(a.tools).not.toContain('Edit');
    expect(a.tools).not.toContain('Bash');
  });

  it('spec-refactorer cannot Write new files (only Edit existing ones)', () => {
    const a = loadAgent('spec-refactorer');
    expect(a.tools).not.toContain('Write');
    expect(a.tools).toContain('Edit');
  });

  it('spec-doc-writer has no Bash (memory writes only, no shell)', () => {
    const a = loadAgent('spec-doc-writer');
    expect(a.tools).not.toContain('Bash');
  });
});
