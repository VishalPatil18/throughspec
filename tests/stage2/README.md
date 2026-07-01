# Stage 2 tests

Verifies the canonical template payload's acceptance criteria:

- `personas.test.ts` - snapshots the stripped `templates/CLAUDE.md` for each of the four personas (`vibe`, `student`, `engineer`, `team`).
- `tokens.test.ts` - asserts stripped `CLAUDE.md` + empty `templates/claude/context.md` stays under the 8,000-token budget (NFR-PERF-02).
- `lint.test.ts` - copies `templates/` to a temp dir and runs `markdownlint-cli2` + `prettier --check` there.

Run with `npx vitest run tests/stage2` from the repo root.
