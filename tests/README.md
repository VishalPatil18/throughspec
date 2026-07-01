# tests/

Repo-level tests that span packages. Per-package unit tests live next to their source. Vitest is configured at the repo root in `vitest.config.ts`.

Run with:

```bash
npm test
```

## Files

| File | Purpose |
|------|---------|
| `payload-parity.test.ts` | Byte-for-byte SHA-256 parity between the Node and Python payloads (SRS §2.3, Risk row 6). |
| `personas.test.ts` | Snapshot per persona of the stripped `templates/CLAUDE.md`. |
| `tokens.test.ts` | NFR-PERF-02 budget: stripped CLAUDE.md + empty context.md stays under 8,000 tokens. |
| `lint.test.ts` | `markdownlint-cli2` + `prettier --check` on a fresh copy of `templates/`. |
| `persona-parity.test.ts` | TypeScript `stripPersonas` matches `tools/strip-personas.mjs` byte-for-byte. |
| `cli.test.ts` | `spec-init` help, unknown command, exit codes. |
| `init.test.ts` | Tree shape, personas, integrations, `--force`, `--dry-run`, perf (< 5 s), lint pass on scaffolded output. |
| `doctor.test.ts` | `spec-init doctor` OK on fresh scaffold; fails on deliberate corruption. |
| `customize.test.ts` | Integration checkbox flip and persona swap. |
| `add-skill.test.ts` | Empty-catalog message and unknown-skill refusal. |
| `upgrade.test.ts` | Three-way merge: silent take on unedited, clean merge on non-conflict, conflict markers on conflict. |

`__snapshots__/` holds Vitest's auto-generated snapshot files.
