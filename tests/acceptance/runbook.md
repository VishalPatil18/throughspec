# Acceptance Runbook

Human-executed acceptance procedure for a Throughspec release. Everything in SRS §9 that a script cannot verify lives here. Everything else is covered by `tools/verify-acceptance.mjs` and the CI matrix.

Run this once per release candidate. File the outputs (transcripts, screenshots, CI run URLs) alongside the release in the GitHub release notes.

---

## 0. Pre-flight

- [ ] `main` (or `development` for RC) is green on the `ci` workflow across all 15 matrix cells.
- [ ] `tools/verify-acceptance.mjs` exits 0 locally on a fresh clone.
- [ ] `packages/cli-node/package.json` and `packages/cli-python/pyproject.toml` versions match the intended tag.
- [ ] `CHANGELOG.md` has a `[X.Y.Z] - YYYY-MM-DD` section (no dangling `[Unreleased]` items).

## 1. Install from local build

Node CLI (npm tarball):

```bash
npm run build -w packages/cli-node
npm pack --workspace packages/cli-node   # → spec-init-1.0.0.tgz
npm i -g ./spec-init-1.0.0.tgz
spec-init --version
```

Python CLI (wheel):

```bash
cd packages/cli-python && uv build
pipx install ./dist/spec-init-1.0.0-py3-none-any.whl
spec-init --version
```

Repeat on macOS, Linux, and Windows (PowerShell + WSL). Record OS + shell in the release notes for each pass.

## 2. Scaffold + doctor (both channels, each OS)

```bash
spec-init init throughspec-acceptance --persona engineer --integrations graphify,obsidian
cd throughspec-acceptance
spec-init doctor
```

Expected:

- [ ] Scaffold completes in **< 5 s** (NFR-PERF-01).
- [ ] All SRS §6 files present.
- [ ] `.graphify/config.yml` and `.obsidian/workspace.json` present.
- [ ] Front-matter on every `claude/*.md` and `design/design.md`.
- [ ] `doctor` exits 0.

## 3. Integration toggle roundtrip

```bash
spec-init customize --remove graphify
spec-init customize --remove obsidian
```

- [ ] Zero residual files (compare against `spec-init init` baseline with no integrations).

## 4. Ninety-minute new-user walkthrough (LLM required)

Open Claude Code in the acceptance project. Record the transcript.

- [ ] `/spec-requirements` - three-plus rounds of cross-questioning. Freezes `claude/srs.md` only after all five mandatory categories are filled.
- [ ] `/spec-design` - extracts a design system (with or without a supplied reference).
- [ ] `/spec-plan` - produces 8-10 step build plan, each ending in a standalone testable deliverable.
- [ ] `/spec-feature` - runs one complete feature cycle end-to-end. Memory update order: `context.md → features.md → design-decisions.md → learnings.md → CHANGELOG.md`.

Elapsed wall-clock time from `spec-init init` to a shipped first feature:

- [ ] **≤ 90 minutes**.

## 5. Cycle-5 token budget

Run four more `/spec-feature` cycles (any project, real work). Record the token cost of cycles 1 and 5.

- [ ] `tokens(cycle_5) / tokens(cycle_1) ≤ 1.20` (SRS §9 / NFR-PERF acceptance).

## 6. Website

- [ ] `throughspec.v-ai.org` returns 200 on: `/`, `/why/`, `/features/`, `/about/`, `/hire-the-developer/`, `/privacy/`, `/terms/`, `/changelog/`, `/docs/`, `/docs/install/`, `/docs/quickstart/`, `/docs/workflows/`, `/docs/design-prompt-library/`, `/docs/learning-map/`, `/docs/customization-recipes/`.
- [ ] Lighthouse: Performance **≥ 90**, Accessibility **≥ 95** on the landing page and on `/docs/quickstart/`.
- [ ] Pagefind search returns at least one result for `spec-init`.
- [ ] Copy-to-clipboard works on the hero, footer, and a docs code block.

## 7. Publish (release-only)

- [ ] Tag `vX.Y.Z` matches both packages' versions.
- [ ] `publish-npm` workflow: `npm publish --provenance --access public` completes.
- [ ] `publish-pypi` workflow: `uv publish` completes.
- [ ] `post-publish-smoke` workflow: green across 3 OS × npm + PyPI.

## 8. Telemetry

- [ ] `spec-init init` performed offline (airplane mode) still completes without network calls (NFR-SEC-02).
- [ ] No CLI subcommand phones home unless the user opted in explicitly.

---

## Filing evidence

For each item, capture one of:

- CI run URL (auto-populated by the workflow).
- Terminal transcript (paste into the release notes appendix).
- Screenshot (Lighthouse report, Pagefind results, doctor output).

A release ships once every checkbox is `[x]` with linked evidence.
