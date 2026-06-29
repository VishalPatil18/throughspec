# tests/

Repo-level tests that span packages. Per-package unit tests live next to their source.

Stage 1 ships the parity test under `tests/parity/`, which proves the byte-for-byte
contract between the Node and Python payloads (SRS §2.3, Risk row 6).

Run with:

```bash
npm test
```

Vitest is configured at the repo root in `vitest.config.ts`.
