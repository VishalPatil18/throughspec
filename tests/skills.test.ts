// Structural + content validator for the initiation skills.
//
// Each SKILL.md is a Claude Code prompt - not code we can execute
// deterministically. What we CAN verify is that every prompt encodes the
// FR-* requirements the SRS mandates: correct frontmatter, required section
// headings, refusal clauses, and category coverage. If a future edit removes
// a load-bearing directive, these tests fire red.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SKILLS_ROOT = resolve(__dirname, '..', 'templates/.claude/skills');

interface Skill {
  name: string;
  content: string;
  frontmatter: Record<string, string>;
  body: string;
}

function loadSkill(name: string): Skill {
  const path = resolve(SKILLS_ROOT, name, 'SKILL.md');
  const content = readFileSync(path, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`no YAML frontmatter in ${path}`);
  const frontmatter: Record<string, string> = {};
  for (const line of (match[1] as string).split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) frontmatter[kv[1] as string] = (kv[2] as string).trim();
  }
  return { name, content, frontmatter, body: match[2] as string };
}

describe('spec-requirements SKILL', () => {
  const s = loadSkill('spec-requirements');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-requirements');
    expect(s.frontmatter.description).toBeDefined();
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('mandates at least three cross-questioning rounds (FR-REQ-01)', () => {
    expect(s.body).toMatch(/at least three rounds|three rounds of cross-questioning/i);
  });

  it('covers the five mandatory categories (FR-REQ-02)', () => {
    const required = [
      /target users/i,
      /jobs[- ]to[- ]be[- ]done/i,
      /primary success metric/i,
      /hard constraints/i,
      /explicit non-goals/i,
    ];
    for (const re of required) expect(s.body).toMatch(re);
  });

  it('refuses to proceed on missing categories (FR-REQ-03)', () => {
    expect(s.body).toMatch(/refuse to proceed|Cannot write srs\.md yet/i);
  });

  it('specifies the canonical srs.md section list (FR-REQ-04)', () => {
    for (const section of [
      /Overview/,
      /Personas/,
      /Functional Requirements/,
      /Non-Functional Requirements/,
      /Hard Constraints/,
      /Explicit Non-Goals/,
      /Success Metric/,
      /Open Questions/,
    ]) {
      expect(s.body).toMatch(section);
    }
  });

  it('tracks open questions as a checklist (FR-REQ-05)', () => {
    expect(s.body).toMatch(/checklist/i);
    expect(s.body).toMatch(/- \[ \]/);
  });

  it('has completion summary and next-step hint (NFR-USE-01)', () => {
    expect(s.body).toMatch(/completion summary|next step/i);
    expect(s.body).toMatch(/\/spec-design/);
  });

  it('has student-persona annotation (NFR-USE-03)', () => {
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });
});

describe('spec-design SKILL', () => {
  const s = loadSkill('spec-design');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-design');
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('is reference-driven first (FR-DESIGN-01)', () => {
    expect(s.body).toMatch(/reference|Do you have a design reference/i);
  });

  it('infers from srs.md when no reference is supplied (FR-DESIGN-02)', () => {
    expect(s.body).toMatch(/infer(red)? path|no reference/i);
    expect(s.body).toMatch(/srs\.md/);
  });

  it('produces tokens, components, do\'s and don\'ts, and surfaces (FR-DESIGN-03)', () => {
    expect(s.body).toMatch(/Tokens - Colors/);
    expect(s.body).toMatch(/Tokens - Typography/);
    expect(s.body).toMatch(/Components/);
    expect(s.body).toMatch(/Do's and Don'ts/);
    expect(s.body).toMatch(/Surfaces/);
  });

  it('places preview assets in design/preview/ (FR-DESIGN-04)', () => {
    expect(s.body).toMatch(/design\/preview\//);
  });

  it('refuses to fabricate brand colors (FR-DESIGN-05)', () => {
    expect(s.body).toMatch(/refuse to invent|do not (invent|fabricate)/i);
    expect(s.body).toMatch(/color/i);
  });

  it('has completion summary and next-step hint (NFR-USE-01)', () => {
    expect(s.body).toMatch(/completion summary|Wrote design\/design\.md/i);
    expect(s.body).toMatch(/\/spec-plan/);
  });

  it('has student-persona annotation (NFR-USE-03)', () => {
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });
});

describe('spec-plan SKILL', () => {
  const s = loadSkill('spec-plan');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-plan');
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('mandates 8-10 stages (FR-PLAN-01)', () => {
    expect(s.body).toMatch(/8-10 stages|8 to 10 stages/i);
  });

  it('requires standalone testable runnable deliverables (FR-PLAN-02)', () => {
    expect(s.body).toMatch(/standalone,?\s*testable,?\s*runnable deliverable/i);
  });

  it('specifies per-stage fields (FR-PLAN-03)', () => {
    for (const field of [
      /Goal/i,
      /Scope-in/i,
      /Scope-out/i,
      /Acceptance criteria/i,
      /Test plan/i,
      /Effort/i,
    ]) {
      expect(s.body).toMatch(field);
    }
  });

  it('uses a checklist Claude flips during execution (FR-PLAN-04)', () => {
    expect(s.body).toMatch(/- \[ \]/);
    expect(s.body).toMatch(/flip|checkbox/i);
  });

  it('refuses on unresolved load-bearing open questions (FR-PLAN-05)', () => {
    expect(s.body).toMatch(/refuse to proceed|Cannot generate plan yet/i);
    expect(s.body).toMatch(/load-bearing/i);
  });

  it('has completion summary and next-step hint (NFR-USE-01)', () => {
    expect(s.body).toMatch(/completion summary|Wrote claude\/plan\.md/i);
    expect(s.body).toMatch(/\/spec-feature/);
  });

  it('has student-persona annotation (NFR-USE-03)', () => {
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });
});

describe('spec-feature SKILL', () => {
  const s = loadSkill('spec-feature');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-feature');
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('names every one of the six phases (FR-FEATURE)', () => {
    for (const phase of [
      /Phase 1 - Requirements/i,
      /Phase 2 - Architecting/i,
      /Phase 3 - Product Specs/i,
      /Phase 4 - Tech Specs/i,
      /Phase 5 - Planning/i,
      /Phase 6 - Writing Code/i,
    ]) {
      expect(s.body).toMatch(phase);
    }
  });

  it('refuses to skip phases without --skip and logs the override', () => {
    expect(s.body).toMatch(/--skip/);
    expect(s.body).toMatch(/design-decisions\.md/);
    expect(s.body).toMatch(/refuse|Refusal/i);
  });

  it('delegates to every Stage-6 sub-agent', () => {
    for (const agent of [
      /spec-interrogator/,
      /spec-architect/,
      /spec-planner/,
      /spec-coder/,
      /spec-refactorer/,
      /spec-doc-writer/,
    ]) {
      expect(s.body).toMatch(agent);
    }
  });

  it('enforces FR-CODE-05 memory update order exactly', () => {
    // Look at the prescribed-order block only, not scattered references
    // elsewhere in the skill. The block is a fenced numbered list that
    // begins with `1. claude/context.md`.
    const blockMatch = s.body.match(/```[\s\S]*?1\. claude\/context\.md[\s\S]*?CHANGELOG\.md[\s\S]*?```/);
    expect(blockMatch, 'prescribed-order block missing').toBeTruthy();
    const block = blockMatch![0];
    const order = ['context.md', 'features.md', 'design-decisions.md', 'learnings.md', 'CHANGELOG.md'];
    const positions = order.map((f) => block.indexOf(f));
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i], `${order[i]} must appear after ${order[i - 1]}`).toBeGreaterThan(
        positions[i - 1] as number,
      );
    }
  });

  it('re-reads memory before code (FR-CODE-01)', () => {
    expect(s.body).toMatch(/re-read `CLAUDE\.md`|read `CLAUDE\.md`/);
    expect(s.body).toMatch(/context\.md/);
    expect(s.body).toMatch(/features\.md/);
  });

  it('has completion summary and student-persona annotation', () => {
    expect(s.body).toMatch(/Shipped feature|completion summary/i);
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });
});

describe('spec-refactor SKILL', () => {
  const s = loadSkill('spec-refactor');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-refactor');
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('is diff-scoped: refuses without the changed-files list (FR-CODE-04)', () => {
    expect(s.body).toMatch(/diff-scoped|diff scope/i);
    expect(s.body).toMatch(/refuse to proceed|Cannot refactor/i);
    expect(s.body).toMatch(/changed[- ]files list|current cycle/i);
  });

  it('delegates to spec-refactorer sub-agent', () => {
    expect(s.body).toMatch(/spec-refactorer/);
  });

  it('does not authorise touching files outside the diff', () => {
    expect(s.body).toMatch(/only these files|only the current cycle|outside the (?:current cycle'?s? )?diff/i);
  });

  it('has completion summary and student-persona annotation', () => {
    expect(s.body).toMatch(/Refactored|completion summary/i);
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });

  it('writes an audit trail under .claude/refactor-audits/ (Stage 7 finalized FR-CODE-04)', () => {
    expect(s.body).toMatch(/audit trail|audit log/i);
    expect(s.body).toMatch(/\.claude\/refactor-audits\//);
  });
});

describe('spec-bug SKILL', () => {
  const s = loadSkill('spec-bug');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-bug');
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('refuses to proceed without a reproduction recipe (FR-BUG-01)', () => {
    expect(s.body).toMatch(/reproduction recipe|reproducer/i);
    expect(s.body).toMatch(/refuse to proceed|Cannot proceed/i);
  });

  it('requires the smallest possible diff (FR-BUG-02)', () => {
    expect(s.body).toMatch(/smallest (possible )?diff/i);
  });

  it('requires a failing-before/passing-after regression test (FR-BUG-03)', () => {
    expect(s.body).toMatch(/regression test/i);
    expect(s.body).toMatch(/fail(s|ing)? (?:against|before|today)|MUST fail/i);
  });

  it('forbids refactors and unrelated improvements (FR-BUG-04)', () => {
    expect(s.body).toMatch(/no refactors|Forbid.*[Rr]efactors|refactors[^.]*outlaws|refactors.*FR-BUG-04/i);
  });

  it('appends to CHANGELOG.md under ### Fixed (FR-BUG-05)', () => {
    expect(s.body).toMatch(/CHANGELOG\.md/);
    expect(s.body).toMatch(/### Fixed/);
  });

  it('delegates to spec-bug-hunter for isolation', () => {
    expect(s.body).toMatch(/spec-bug-hunter/);
  });

  it('delegates the fix to spec-coder', () => {
    expect(s.body).toMatch(/spec-coder/);
  });

  it('has completion summary and student-persona annotation', () => {
    expect(s.body).toMatch(/Fixed|completion summary/i);
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });
});

describe('spec-docs SKILL', () => {
  const s = loadSkill('spec-docs');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-docs');
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('reconciles docs against context.md, features.md, README.md (FR-DOCS-01)', () => {
    expect(s.body).toMatch(/context\.md/);
    expect(s.body).toMatch(/features\.md/);
    expect(s.body).toMatch(/README\.md/);
    expect(s.body).toMatch(/reconcile/i);
  });

  it('produces a diff for approval before applying (FR-DOCS-02)', () => {
    expect(s.body).toMatch(/diff.*approval|Wait for user approval|PROPOSED DOC CHANGES/i);
  });

  it('refuses to modify source code (FR-DOCS-03)', () => {
    expect(s.body).toMatch(/source[- ]code/i);
    expect(s.body).toMatch(/refuse|Cannot apply|MUST NOT/i);
  });

  it('flags stale features (FR-DOCS-04)', () => {
    expect(s.body).toMatch(/stale|no longer exists|STALE FEATURES/i);
  });

  it('has completion summary and student-persona annotation', () => {
    expect(s.body).toMatch(/Reconciled|completion summary/i);
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });
});

describe('spec-sync SKILL', () => {
  const s = loadSkill('spec-sync');

  it('has valid frontmatter with name and description', () => {
    expect(s.frontmatter.name).toBe('spec-sync');
    expect((s.frontmatter.description as string).length).toBeGreaterThan(40);
  });

  it('reconciles context.md against actual repo state', () => {
    expect(s.body).toMatch(/context\.md/);
    expect(s.body).toMatch(/drift|reconcile/i);
  });

  it('compresses files over 1,500 lines (NFR-PERF-03)', () => {
    expect(s.body).toMatch(/1,?500/);
    expect(s.body).toMatch(/compress/i);
  });

  it('preserves a compressed-from audit trail', () => {
    expect(s.body).toMatch(/compressed[- ]from/i);
    expect(s.body).toMatch(/git|git log/);
  });

  it('refuses to compress a file with uncommitted changes', () => {
    expect(s.body).toMatch(/uncommitted changes/i);
  });

  it('has completion summary and student-persona annotation', () => {
    expect(s.body).toMatch(/Synced memory|completion summary/i);
    expect(s.body).toMatch(/student persona/i);
    expect(s.body).toMatch(/Why this step\?/);
  });
});
