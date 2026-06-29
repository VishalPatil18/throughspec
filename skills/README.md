# skills/

Source-of-truth definitions for Throughspec's user-invocable slash commands (skills).

Stage 1 leaves this directory empty. Skill definitions land in Stages 5 and 7 of [`claude/plan.md`](../claude/plan.md):

| Stage | Skills                                                    |
| ----- | --------------------------------------------------------- |
| 5     | `/spec-requirements`, `/spec-design`, `/spec-plan`        |
| 6     | `/spec-feature` (with the 6-phase agents)                 |
| 7     | `/spec-refactor`, `/spec-bug`, `/spec-docs`, `/spec-sync` |

Per SRS NFR-MAINT-02, every skill MUST live here as the single source-of-truth and be compiled into both the npm and PyPI payloads.
