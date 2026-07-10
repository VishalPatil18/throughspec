---
name: add-new-skill-or-agent
description: Workflow command scaffold for add-new-skill-or-agent in throughspec.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-skill-or-agent

Use this workflow when working on **add-new-skill-or-agent** in `throughspec`.

## Goal

Adds a new skill or agent to the project, updating both template and Python CLI payloads, and corresponding tests.

## Common Files

- `templates/.claude/skills/*/SKILL.md`
- `templates/.claude/agents/*.md`
- `packages/cli-python/src/spec_init/_payload/.claude/skills/*/SKILL.md`
- `packages/cli-python/src/spec_init/_payload/.claude/agents/*.md`
- `tests/skills.test.ts`
- `tests/agents.test.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update SKILL.md or agent markdown in templates/.claude/skills/ or templates/.claude/agents/
- Mirror the new skill or agent in packages/cli-python/src/spec_init/_payload/.claude/skills/ or .../agents/
- Update tests (e.g., tests/skills.test.ts, tests/agents.test.ts, tests/init.test.ts)
- Update claude/context.md, claude/learnings.md, claude/plan.md

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.