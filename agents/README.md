# agents/

**Note:** the canonical source-of-truth for Throughspec agents lives at [`templates/.claude/agents/`](../templates/.claude/agents/), not here.

Agents are Claude Code sub-agent definitions - single-file `.md` documents with YAML frontmatter (`name`, `description`, `tools`) followed by the agent's system prompt. Claude Code auto-discovers them from `.claude/agents/` at project open time. Placing them inside `templates/` means every scaffolded project gets them via the existing payload pipeline (source → parity check → both CLIs → scaffolded `.claude/agents/`) with no build-time merge.

This directory is intentionally left empty. It exists only to prevent confusion for readers who look here first.

| Stage | Agents                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| 6     | `spec-interrogator`, `spec-architect`, `spec-planner`, `spec-coder`, `spec-refactorer`, `spec-doc-writer`                          |
| 7     | `spec-bug-hunter`                                                                                                                 |

See SRS §2.2.4 for the tool-allowlist per agent - enforced by `tests/agents.test.ts`.
