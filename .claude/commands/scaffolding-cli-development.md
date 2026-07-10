---
name: scaffolding-cli-development
description: Workflow command scaffold for scaffolding-cli-development in throughspec.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /scaffolding-cli-development

Use this workflow when working on **scaffolding-cli-development** in `throughspec`.

## Goal

Implements or updates a CLI scaffolding tool in either Node.js or Python, including commands, args, persona logic, and corresponding tests.

## Common Files

- `packages/cli-node/src/commands/*.ts`
- `packages/cli-node/src/*.ts`
- `packages/cli-node/README.md`
- `packages/cli-node/package.json`
- `packages/cli-python/src/spec_init/commands/*.py`
- `packages/cli-python/src/spec_init/*.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update CLI source files (commands, args, persona, payload, etc.) in packages/cli-node or packages/cli-python
- Add or update README and package/pyproject files for the CLI
- Add or update tests for CLI commands and features
- Update claude/context.md, claude/learnings.md, claude/plan.md

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.