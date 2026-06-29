# Throughspec - Build Plan

> Spec-driven. Drift-proof. Token-lean.

| Field             | Value                           |
| ----------------- | ------------------------------- |
| Plan Version      | 1.0                             |
| Source SRS        | [`../srs.md`](../srs.md) v1.0.0 |
| Behavior Contract | [`../CLAUDE.md`](../CLAUDE.md)  |
| Status            | Confirmed 2026-06-29            |
| Last Updated      | 2026-06-29                      |

---

## How To Read This Plan

- 10 stages, executed top-to-bottom.
- Each stage ends with a **standalone, testable, runnable deliverable** (SRS §3.4 FR-PLAN-02).
- Checkboxes flip from `[ ]` to `[x]` only when the stage's acceptance criteria are verified end-to-end.
- Effort bands: **S** ≈ ≤1 day, **M** ≈ 2–4 days, **L** ≈ 5+ days of focused work.
- Stages MUST NOT pull scope from later stages. If scope is missing, surface it (CLAUDE.md §1) before extending the stage.

---

## Stage Map (At-A-Glance)

| #   | Stage                                                                          | Deliverable                                                     | Effort |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------ |
| 1   | Monorepo & Source-of-Truth Templates Layout                                    | Repo skeleton + single `templates/` tree both packagers consume | S      |
| 2   | Canonical Project Payload                                                      | Versioned template files that produce a passing scaffold        | M      |
| 3   | Node.js Scaffolding CLI (`spec-init`)                                          | `npx spec-init` produces the §6 tree on macOS/Linux/Windows     | M      |
| 4   | Python Scaffolding CLI (`spec-init`)                                           | `pipx install spec-init` produces an identical tree             | M      |
| 5   | Initiation Skills (`/spec-requirements`, `/spec-design`, `/spec-plan`)         | First three slash commands execute end-to-end                   | M      |
| 6   | 6-Phase Feature Cycle (`/spec-feature` + agents)                               | One real feature shipped through all six phases                 | L      |
| 7   | Maintenance Skills (`/spec-refactor`, `/spec-bug`, `/spec-docs`, `/spec-sync`) | All four skills wired with isolation guarantees                 | M      |
| 8   | Integrations (Graphify, Obsidian)                                              | Toggle-on/toggle-off integrations with no leftover artifacts    | S      |
| 9   | Companion Website                                                              | Static site live with all §7.3 sections                         | M      |
| 10  | Cross-Platform Verification & Release                                          | v1.0.0 published to npm + PyPI with acceptance run              | M      |

---

## Stage 1 - Monorepo & Source-of-Truth Templates Layout

- [x] **Goal:** Establish the single `templates/` tree that both the npm and PyPI packagers consume, so the two channels cannot drift (SRS §2.3, Risk row 6). _Completed 2026-06-29._

### Scope-In

- Top-level repo layout: `packages/cli-node/`, `packages/cli-python/`, `templates/`, `skills/`, `agents/`, `website/`, `tests/`.
- A `tools/build-payload.{js,py}` script that copies `templates/` into each package's build output.
- License (zero-cost compatible), `README.md`, `CONTRIBUTING.md`, `SECURITY.md` for the Throughspec repo itself.
- Linting/formatting baseline (Prettier + ESLint for Node, Ruff for Python) - no paid services.

### Scope-Out

- Template content (Stage 2).
- CLI logic (Stages 3–4).
- Skill/agent definitions (Stages 5–7).

### Acceptance Criteria

- Both packages' build commands emit a directory containing an **identical SHA-256 manifest** of `templates/**`.
- `pnpm -r build` and `uv build` (or chosen equivalents) both succeed on a clean checkout.
- A `tools/check-payload-parity.{js,py}` script exits 0.

### Test Plan

- Unit: parity check script asserts file count, byte size, SHA per file.
- CI: matrix job runs parity check on macOS, Linux, Windows.
- Manual: corrupt one template file and confirm parity check fails loudly.

**Effort:** S
**Exit signal:** Parity script green on every platform.

---

## Stage 2 - Canonical Project Payload

- [ ] **Goal:** Produce the versioned template files that a fresh `spec-init` run will copy (SRS §6 tree), each pre-seeded with the structure and front-matter the Kit's skills depend on.

### Scope-In

- `templates/CLAUDE.md` carrying a `template-version` field (NFR-MAINT-01).
- `templates/claude/{srs.md, plan.md, context.md, learnings.md, features.md, design-decisions.md}` with safe-default empty sections and the append-only headers each skill expects.
- `templates/design/design.md` placeholder calling out tokens, components, do's/don'ts.
- `templates/.github/ISSUE_TEMPLATE/*`, `templates/CHANGELOG.md`, `templates/README.md`, `templates/SECURITY.md`, `templates/CONTRIBUTING.md`.
- Persona switches (`vibe | student | engineer | team`) expressed as token-bounded sections inside `CLAUDE.md`, gated by a marker the CLI can keep or strip.

### Scope-Out

- Any runtime behavior - these are static files only.
- Integration-specific files (Stage 8).

### Acceptance Criteria

- Manually copying `templates/` into an empty directory yields a tree that passes `markdownlint` and `prettier --check`.
- `CLAUDE.md` token cost when concatenated with an empty `claude/context.md` is **< 8,000 tokens** (NFR-PERF-02), measured with the `tiktoken` reference counter.
- Persona stripping removes the right blocks for each of the four personas in a fixture test.

### Test Plan

- Snapshot tests for each persona variant.
- Token-budget assertion test.
- Lint pass on every markdown file.

**Effort:** M
**Exit signal:** A human can read the resulting tree and understand the project's intended SDLC without referring back to the SRS.

---

## Stage 3 - Node.js Scaffolding CLI (`spec-init`)

- [ ] **Goal:** Ship the Node-based CLI that produces the §6 tree, supports `init / customize / add-skill / upgrade / doctor`, and refuses to overwrite without `--force` (FR-INIT-01..06, NFR-PERF-01).

### Scope-In

- `packages/cli-node` written in TypeScript, distributed as ESM, Node ≥18 - published to **npm** (confirmed 2026-06-29).
- Commands: `init`, `customize`, `add-skill`, `upgrade`, `doctor`.
- Flags: `--persona`, `--integrations`, `--force`, `--dry-run`.
- Three-way merge for `upgrade` (NFR-REL-02). Use a small, audited library (e.g., `diff3`) - no paid services.
- Post-init checklist printed with the next slash command to run (FR-INIT-04).
- Telemetry strictly off by default (NFR-SEC-02).

### Scope-Out

- The Python CLI (Stage 4) - but its CLI surface MUST mirror Node's, so the contract is finalized here and copied.
- Skills and agents (Stages 5–7).

### Acceptance Criteria

- `npx spec-init <name>` produces the §6 tree in **< 5 seconds** on a standard laptop (NFR-PERF-01).
- `spec-init init` against an existing directory exits non-zero without `--force`.
- `spec-init upgrade` against a hand-edited project surfaces conflicts; no silent overwrites.
- `spec-init doctor` reports OK on a freshly scaffolded project and identifies a deliberately corrupted one.
- `spec-init --help` prints all commands and flags.

### Test Plan

- Unit (Vitest): argument parsing, persona/integration flag matrix, three-way merge edge cases.
- Integration: end-to-end scaffold into a temp dir, assert tree shape and lint pass.
- Cross-platform CI: macOS, Linux, Windows runners (NFR-PORT-01).
- Manual: install the local tarball via `npm pack` and run it.

**Effort:** M
**Exit signal:** A user with only Node installed can scaffold a passing project from a tarball.

---

## Stage 4 - Python Scaffolding CLI (`spec-init`)

- [ ] **Goal:** Mirror the Node CLI in Python so npm and PyPI users get an identical first experience (SRS §2.3).

### Scope-In

- `packages/cli-python` using `typer` (or `argparse` to stay dependency-light), Python ≥3.10.
- Same command surface, flags, exit codes, and post-init checklist as Stage 3.
- Distribution via `pipx install spec-init` and `pip install spec-init` - published to **PyPI** (confirmed 2026-06-29).
- Shared parity test that runs _both_ CLIs against the same fixtures and compares output trees byte-for-byte.

### Scope-Out

- New CLI features - Stage 4 must not invent capabilities Stage 3 lacks.

### Acceptance Criteria

- Parity test asserts npm CLI and PyPI CLI emit identical trees for every persona/integration combination.
- `pipx install ./dist/spec-init-*.whl && spec-init <name>` succeeds on macOS, Linux, Windows (PowerShell + WSL).
- Cold-start scaffold completes **< 5 seconds** (NFR-PERF-01).

### Test Plan

- Pytest unit tests for argument parsing and merge logic.
- Cross-language parity harness (called from CI).
- Smoke test on a Windows runner via PowerShell.

**Effort:** M
**Exit signal:** Either CLI is a drop-in replacement for the other.

---

## Stage 5 - Initiation Skills (`/spec-requirements`, `/spec-design`, `/spec-plan`)

- [ ] **Goal:** Ship the three skills that produce `claude/srs.md`, `design/design.md`, and `claude/plan.md` via cross-questioning, enforcing all FR-REQ, FR-DESIGN, and FR-PLAN gates.

### Scope-In

- Skill source files under `skills/` (single source of truth, compiled into both payloads - NFR-MAINT-02).
- `/spec-requirements`: ≥3 rounds of cross-questioning, refusal-to-proceed if any of the five mandatory categories is empty (FR-REQ-01..05).
- `/spec-design`: reference-driven if a reference is supplied, inferred otherwise; refuses to fabricate brand colors (FR-DESIGN-01..05).
- `/spec-plan`: enforces 8–10 stages, refuses to proceed if SRS open questions remain in load-bearing categories (FR-PLAN-01..05).
- One-line completion summary + next-step hint per skill (NFR-USE-01).

### Scope-Out

- The 6-phase feature cycle (Stage 6).
- Maintenance skills (Stage 7).

### Acceptance Criteria

- Running the three skills in sequence against a fresh scaffold produces a valid `srs.md`, `design.md`, and `plan.md` that pass the §9 acceptance lints.
- Forcing a missing mandatory category causes the skill to refuse and explain why (FR-REQ-03).
- Student-persona scaffolds receive the "Why this step?" annotation (NFR-USE-03).

### Test Plan

- Skill-level fixture tests: feed pre-canned transcripts, assert the resulting markdown.
- Refusal tests: assert error paths trigger when preconditions fail.
- Manual: run end-to-end against a real toy project idea.

**Effort:** M
**Exit signal:** A new user reaches `/spec-plan` complete on a fresh scaffold without editing any file by hand (NFR-USE-02).

---

## Stage 6 - 6-Phase Feature Cycle (`/spec-feature` + Agents)

- [ ] **Goal:** Implement the full 6-phase cycle (SRS §3.5, §5.2) and the agents that support it, then prove it by shipping one real feature inside a sample project.

### Scope-In

- `/spec-feature` orchestrating phases 1–6 in order, refusing to skip unless `--skip` is passed and the override is logged in `design-decisions.md` (FR-FEATURE).
- Agents: `spec-interrogator`, `spec-architect`, `spec-planner`, `spec-coder`, `spec-refactorer`, `spec-doc-writer` (SRS §2.2.4).
- Phase-6 memory-update ordering: `context.md` → `features.md` → `design-decisions.md` → `learnings.md` → `CHANGELOG.md` (FR-CODE-05).
- Diff-scoped `/spec-refactor` (FR-CODE-04) - preliminary version; isolation contract finalized in Stage 7.

### Scope-Out

- Bug, docs, sync skills (Stage 7).
- Integrations (Stage 8).

### Acceptance Criteria

- A scripted feature ("add a todo item") completes all six phases on a sample app, ending with passing tests and updated memory files.
- Skipping a phase without `--skip` is blocked.
- `--skip` is recorded with reason in `design-decisions.md`.
- Phase-6 memory updates appear in the exact prescribed order (assertion test on file mtimes / git log).

### Test Plan

- Agent-isolation tests: each agent has only the tools listed in SRS §2.2.4.
- End-to-end fixture: run the feature against a tiny stub project; assert all artifacts.
- Token-budget regression: cycle 5 ≤ 120% of cycle 1 token usage (SRS §9 acceptance).

**Effort:** L
**Exit signal:** A fresh user completes Initiation + one Feature Cycle in **< 90 minutes** (SRS §9 acceptance).

---

## Stage 7 - Maintenance Skills (`/spec-refactor`, `/spec-bug`, `/spec-docs`, `/spec-sync`)

- [ ] **Goal:** Ship the four maintenance skills that keep the project honest after the initial build (FR-BUG, FR-DOCS, FR-CODE-04, §5.3, §5.4, §5.5).

### Scope-In

- `/spec-bug`: reproduction-first, regression test, smallest diff, no refactors, CHANGELOG entry (FR-BUG-01..05).
- `/spec-docs`: read repo state, present a diff, never touch source code, flag stale features (FR-DOCS-01..04).
- `/spec-refactor`: diff-scoped only - must read the cycle's changed-files list, not the repo (FR-CODE-04).
- `/spec-sync`: reconcile `context.md` against repo state and compress any memory file > 1,500 lines (NFR-PERF-03).

### Scope-Out

- New workflow phases - keep these strictly maintenance.

### Acceptance Criteria

- `/spec-bug` refuses to proceed without a reproduction recipe.
- `/spec-docs` rejects any attempt to modify a source file.
- `/spec-refactor` only opens files in the current cycle's diff (verified via tool-call audit).
- `/spec-sync` compresses a >1,500-line memory file and leaves a `compressed-from` audit trail.

### Test Plan

- Scenario tests for each refusal path.
- A "drift simulator" test: corrupt `context.md` and assert `/spec-sync` heals it.
- Compression test: feed an oversized fixture and check resulting line count and audit trail.

**Effort:** M
**Exit signal:** All four skills pass refusal-path and happy-path fixtures.

---

## Stage 8 - Integrations (Graphify, Obsidian)

- [ ] **Goal:** Ship the two optional integrations as fully toggleable add-ons (FR-INTEGRATE-01..03).

### Scope-In

- Graphify: `.graphify/config.yml`, README section, CLAUDE.md note preferring Graphify queries over full-repo greps.
- Obsidian: `.obsidian/workspace.json`, recommended plugin list in README, front-matter conventions in every `claude/*.md`.
- `spec-init customize --add <name>` and `--remove <name>` paths.

### Scope-Out

- Any paid plugin or hosted service (CLAUDE.md §7).

### Acceptance Criteria

- Toggling either integration on then off leaves **zero residual files** (SRS §9 acceptance).
- README links resolve (`https://graphify.net/`, `https://obsidian.md/`).
- Integration sections appear / disappear in `README.md` and `CLAUDE.md` cleanly.

### Test Plan

- Toggle-roundtrip fixture: scaffold → add → remove → diff against the original tree (must be empty).
- Lint pass on the modified README.

**Effort:** S
**Exit signal:** A user can adopt or drop either integration without manual cleanup.

---

## Stage 9 - Companion Website

- [ ] **Goal:** Stand up the static documentation/distribution site with every section enumerated in SRS §7.3.

### Scope-In

- Static site built with Astro or Next.js static export, deployed to **Vercel free tier** (confirmed 2026-06-29; CLAUDE.md §7 - zero-cost).
- Sections: Install, Quickstart, Workflows, Design Prompt Library, Learning Map, Customization Recipes, Changelog.
- Visual system pulled from `./design/` HTML mocks (CLAUDE.md §8); Tailwind utilities only, no inline CSS.
- Search across docs (client-side index - no paid search service).

### Scope-Out

- Server-side rendering, authentication, analytics that cost money.
- Any feature requiring a backend.

### Acceptance Criteria

- All seven §7.3 sections render with real content (no lorem ipsum).
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95.
- Build is reproducible from a clean checkout in under 2 minutes.
- Site deploys to a free tier and resolves at a stable URL.

### Test Plan

- Playwright smoke test that visits every top-level route.
- Link checker over all internal anchors.
- Visual diff vs. the `./design/*.dc.html` references.

**Effort:** M
**Exit signal:** A new visitor can install the kit and find the quickstart in < 30 seconds.

---

## Stage 10 - Cross-Platform Verification & v1.0.0 Release

- [ ] **Goal:** Verify every SRS §9 acceptance criterion on macOS, Linux, and Windows, then publish v1.0.0 to npm and PyPI.

### Scope-In

- CI matrix: `{macos, ubuntu, windows} × {node 18/20, python 3.10/3.11/3.12}`.
- End-to-end "new user" walkthrough scripted in CI: install → scaffold → run all initiation skills → run one feature cycle.
- Token-budget assertion: cycle 5 ≤ 120% of cycle 1.
- Migration notes published in `CHANGELOG.md` and on the website (NFR-MAINT-03).
- npm + PyPI publication via tagged release; SHA-256 of the shared payload committed to the release notes (Risk row 6).
- Open Questions in SRS §11 either resolved or explicitly deferred to v1.1 with rationale (CLAUDE.md §1).

### Scope-Out

- New features beyond what Stages 1–9 shipped.

### Acceptance Criteria

- Every checkbox in SRS §9 is `[x]` with linked evidence (CI run, screenshot, transcript).
- Both packages installable via their canonical commands on all three OSes.
- Release notes name every breaking template change and its migration path.
- Post-publish smoke test runs `npx spec-init throughspec-smoke && cd throughspec-smoke && ...` and exits 0 on each runner.

### Test Plan

- Full CI matrix green.
- Manual user trial (1–2 testers) following the website's Quickstart.
- Telemetry-off verification (no outbound network calls during install - NFR-SEC-02).

**Effort:** M
**Exit signal:** `spec-init` is publicly installable and the SRS §9 board is fully checked.

---

## Cross-Cutting Risks (Carried From SRS §10)

| Risk                                 | Mitigation in This Plan                                                | Stage(s) |
| ------------------------------------ | ---------------------------------------------------------------------- | -------- |
| Memory files drift from reality      | `/spec-sync` + Stop-hook warning; tested in Stage 7                    | 6, 7     |
| Users skip cross-questioning         | Refusal gates in `/spec-requirements`, `/spec-feature`, `/spec-plan`   | 5, 6     |
| Template upgrades clobber user edits | Three-way merge in Stage 3 `upgrade`; conflict surface, never silent   | 3, 4     |
| Graphify/Obsidian API changes        | Integrations isolated to dedicated config files; toggle-roundtrip test | 8        |
| Token cost grows unbounded           | NFR-PERF-02 budget asserted in Stage 2 and Stage 10                    | 2, 10    |
| Two distribution channels drift      | Single `templates/` tree + parity script asserted in Stages 1 and 4    | 1, 4     |

---

## Open Questions Inherited From SRS §11

These remain unresolved and SHOULD be answered before Stage 10 ships v1.0.0:

- [ ] Should `/spec-sync` run automatically on a `Stop` hook, or stay manual?
- [ ] Do we ship a default test runner per stack, or stay stack-agnostic?
- [ ] How do we version skills independently of the template payload?
- [ ] Should the Student persona's `learnings.md` be a separate Obsidian vault?

Resolutions MUST be recorded in `claude/design-decisions.md` (SRS §2.2.2) when answered.

---

## Confirmation Gate

Before Stage 1 begins, the user MUST confirm:

1. The 10-stage decomposition above matches their intent.
2. The zero-cost stack choices (Astro/Next.js static, Vitest, Ruff, free-tier hosting) are acceptable.
3. The four SRS §11 open questions can be carried as deferred work rather than answered up-front.

Reply with `proceed`, `modify: <changes>`, or specific stage feedback to advance.

**User confirmation - 2026-06-29:**

1. 10-stage shape: **approved**.
2. Stack: **approved** - Vercel for website hosting; npm for the Node CLI; PyPI for the Python CLI.
3. SRS §11 open questions: **carried as deferred work** (to be resolved before v1.0.0 in Stage 10).

---

_End of plan.md v0.1.0 - generated 2026-06-29 from `srs.md` v1.0.0 and `CLAUDE.md`._
