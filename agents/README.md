# agents/

Source-of-truth definitions for Throughspec's pre-configured Claude Code sub-agents.

Stage 1 leaves this directory empty. Agent definitions land in Stage 6 of [`claude/plan.md`](../claude/plan.md):

| Agent               | Role                                                       |
| ------------------- | ---------------------------------------------------------- |
| `spec-interrogator` | Cross-questioning rounds; produces requirements diffs      |
| `spec-architect`    | Proposes architecture options with tradeoffs               |
| `spec-planner`      | Decomposes scope into 8–10 testable stages                 |
| `spec-coder`        | Implements a single stage end-to-end                       |
| `spec-refactorer`   | Cleans only the diff Claude just produced                  |
| `spec-doc-writer`   | Updates the memory layer after every cycle                 |
| `spec-bug-hunter`   | Isolates, reproduces, and patches bugs without scope creep |

See SRS §2.2.4 for tool-allowlist constraints per agent.
