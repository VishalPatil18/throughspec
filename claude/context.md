# Project Context

> Persistent knowledge base for Throughspec. Append-only Session History.
> Read this file (at minimum: Current State + the most recent 2–3 Session History entries) before any code change.

---

## Session History Template

> Copy this block below the divider for every new entry. Never edit past entries - corrections go in a new entry.

```
## <YYYY-MM-DD> - <short title>

**Prompt / trigger:** <what the user asked for>

**What was done:**
- <bullet>

**Files touched:**
- `<path>` - create|update|delete - <why>

**Decisions made:**
- <decision> - <rationale> (also logged in Key Decisions if non-trivial)

**Open questions / follow-ups:**
- <item>
```

---

## Current State

**Stage:** Stage 1 complete - Monorepo & Source-of-Truth Templates Layout. Stage 2 (Canonical Project Payload) is next.

**Tech stack**

- Node CLI: TypeScript (ESM), Node ≥ 18, distributed via npm as `spec-init`.
- Python CLI: Python ≥ 3.10, packaged with `uv`, distributed via PyPI as `spec-init`.
- Package manager (monorepo): npm workspaces.
- Linting/formatting: Prettier + ESLint (JS/TS), Ruff (Python).
- Test runner: Vitest (parity harness lives in `tests/parity`).
- License: MIT.
- Deploy targets (later stages): Vercel free tier (website), npm + PyPI (packages).

**Repo layout**

- `packages/cli-node/` - Node CLI skeleton (`src/index.ts`, `scripts/build.mjs`).
- `packages/cli-python/` - Python CLI skeleton (`src/spec_init/`, `_build.py`).
- `templates/` - single source-of-truth payload consumed by both CLIs.
- `tools/check-payload-parity.mjs` - SHA-256 manifest parity check across both build outputs.
- `tests/parity/` - Vitest parity test.
- `skills/`, `agents/`, `website/` - placeholders (READMEs only) for later stages.
- `srs.md`, `CLAUDE.md`, `claude/plan.md` - spec, behavior contract, build plan.

**Build / run / test**

- Node CLI build: `npm run build -w packages/cli-node` (runs `scripts/build.mjs`, copies `templates/` → `packages/cli-node/dist/_payload/`).
- Python CLI build: `uv build packages/cli-python` (invokes `_build.py` to copy `templates/` → `packages/cli-python/_payload/`).
- Parity check: `node tools/check-payload-parity.mjs` - exits 0 when both payloads match SHA-256.
- Tests: `npx vitest run` from repo root.

## Session History

## 2026-06-29 - Stage 1: Monorepo & Templates Layout

**Prompt / trigger:** `/plan` from SRS, then `/feature-dev` for Stage 1.

**What was done:**

- Established npm workspace monorepo with `packages/cli-node/` and `packages/cli-python/`.
- Created the single `templates/` tree that both packagers will consume (source-of-truth for Risk row 6 in SRS).
- Wired both build scripts (`scripts/build.mjs`, `_build.py`) to copy `templates/**` into per-package `_payload/` directories.
- Wrote `tools/check-payload-parity.mjs` - hashes every file in both payloads and diffs SHA-256 manifests. Exits non-zero on any drift.
- Added Vitest parity test in `tests/parity/parity.test.ts` that runs the check as a unit test.
- Added repo hygiene files: `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, GitHub issue and PR templates, `.gitignore`.
- Configured baseline tooling: `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `ruff.toml`.
- Rewrote root `README.md` to describe the packages (CLI + Claude workflow) rather than the future website.

**Files touched:** see `git show df0df95 4aa6d04 --stat` - Stage 1 is the union of both commits.

**Decisions made:**

- **npm workspaces** for the JS side rather than pnpm/Yarn - most-recognized default for OSS consumers.
- **uv** for the Python side - fast, modern, and zero-cost.
- **MIT license** - permissive, widely trusted for OSS templates.
- **Parity via SHA-256 manifest** rather than byte-diff or rsync - deterministic, cheap to run in CI, easy to fail loudly.

**Open questions / follow-ups:**

- Stage 2 will populate `templates/claude/*.md` with the append-only headers each skill depends on.
- Whether to add a Windows CI runner now or defer to Stage 10.

---

## 2026-06-30 - Backfill: create context.md and learnings.md

**Prompt / trigger:** User noticed Stage 1 completion did not produce `claude/context.md` or `claude/learnings.md`.

**What was done:**

- Created `claude/context.md` (this file) with the Session History template and Stage 1 state backfilled from `git log` and the current working tree.
- Created `claude/learnings.md` with the concepts surfaced during Stage 1 (monorepo layout, payload parity, package manager choices).

**Files touched:**

- `claude/context.md` - create - persistent project knowledge base per CLAUDE.md §9.
- `claude/learnings.md` - create - teaching log per CLAUDE.md §10.

**Decisions made:**

- Followed the schema in the project's own `CLAUDE.md` §9/§10 (Session History + `###` topic headings) rather than the `templates/claude/context.md` compressed-snapshot shape. Rationale: the project's CLAUDE.md is the binding contract for this repo; the template file is a payload artifact for downstream users.

**Open questions / follow-ups:**

- Reconcile the two shapes before Stage 2 ships - either update the template to match, or update the project CLAUDE.md, so Throughspec's own repo eats its own dogfood.

---

## Key Decisions

- **2026-06-29** - Single `templates/` tree consumed by both packagers; parity enforced by SHA-256 manifest. Prevents npm/PyPI drift (SRS Risk row 6).
- **2026-06-29** - npm workspaces + uv as the two package managers.
- **2026-06-29** - MIT license.
- **2026-06-30** - Project's own `claude/context.md` and `claude/learnings.md` follow CLAUDE.md §9/§10 schema, not the `templates/claude/` shape. Needs reconciliation before Stage 2.

## Open Questions / TODOs

- [ ] Reconcile the schema mismatch between `claude/context.md` (Session-History style) and `templates/claude/context.md` (compressed-snapshot style) - pick one and align both.
- [ ] Should Windows CI be wired in Stage 1 or deferred to Stage 10?
- [ ] SRS §11 open questions carried as deferred work to Stage 10.
