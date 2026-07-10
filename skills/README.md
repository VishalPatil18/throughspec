# skills/

**Note:** the canonical source-of-truth for Throughspec skills lives at [`templates/.claude/skills/`](../templates/.claude/skills/), not here.

Skills are Claude Code prompts that ship with every scaffolded project - so putting them inside `templates/` means they flow through the existing payload pipeline (source → parity check → both CLIs → scaffolded `.claude/skills/`) with no build-time merge. NFR-MAINT-02's "single directory" principle is preserved: there is exactly one canonical location, and it lives where the skills are actually delivered.

This directory is intentionally left empty. It exists only to prevent confusion for readers who look here first.

| Stage | Skills                                                    |
| ----- | --------------------------------------------------------- |
| 5     | `/spec-requirements`, `/spec-design`, `/spec-plan`        |
| 6     | `/spec-feature` (with the 6-phase agents)                 |
| 7     | `/spec-refactor`, `/spec-bug`, `/spec-docs`, `/spec-sync` |
