# Changelog

All notable changes to Throughspec are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


---

## [1.2.0] - 2026-07-30

### Changed

- **spec.config.js is now the single ground-truth config.** Persona and active integrations live in a CLI-managed block inside it; `.spec-init/meta.json` is gone. The file is preserved verbatim across upgrades.
- **`spec-init upgrade` is now non-destructive by construction.** Files are classified: CLI-owned files are replaced, your data files (`claude/*.md`, `design/design.md`, `CHANGELOG.md`, `README.md`) are never overwritten, and `CLAUDE.md` has only its `throughspec:managed` regions refreshed - your product notes, environment, and custom instructions are untouched.
- **No more `.spec-init/` duplication.** The full base snapshot is gone; upgrade reads the shipped template directly, so scaffolds are ~half the files. Pre-1.2 projects auto-migrate on first `upgrade`.

### Added

- **Persona is now first-class**: prompted during scaffold (default `engineer`), stored in `spec.config.js`, printed with its guidance after scaffolding, and pinned in `CLAUDE.md`.
- **Integration auto-install + docs**: selecting an integration with a known installer (e.g. Caveman) runs it automatically; every integration prints its official docs link in the terminal and the docs site. `--no-install` skips auto-install.

### Migration

- Pre-1.2 projects: run `spec-init upgrade` once. It migrates `.spec-init/meta.json` into `spec.config.js` and removes the old `.spec-init/` snapshot. Your memory files and edits are preserved.

---

## [1.1.0] - 2026-07-27

### Added

- Create-app shorthand: `spec-init <name>` (and `npx spec-init my-project`) now implies `init`, so scaffolding no longer requires the explicit `init` subcommand. A leading flag or `-`-prefixed token is still rejected.
- The active persona is now surfaced in `spec.config.js` through a CLI-managed `// active-persona:` line, written and kept current by `init`, `reinit`, and `customize --persona`.

### Fixed

- `spec-init upgrade` no longer produces false conflicts on persona- or integration-gated files. The `.spec-init/base/` snapshot stays raw (so `customize` can still re-derive from its markers), but `base` and `theirs` are transformed through the recorded `meta.json` persona/integration settings before the three-way merge. The managed persona line in `spec.config.js` is normalized out of the merge and re-stamped afterward, so it can never conflict.

---

## [1.0.0] - 2026-07-26

First stable release. Throughspec is now production-ready and published to npm (`npx spec-init`) and PyPI (`pipx install spec-init`) from one source-of-truth template tree, verified byte-for-byte across both channels. From this release the public surface follows semantic versioning: breaking changes only on a major bump.

### Changed

- Promoted from beta to **Production/Stable**. Both CLIs are versioned at `1.0.0`; the Python trove classifier is now `Development Status :: 5 - Production/Stable` and the shipped template version is `1.0.0`.

### Added

- Full published-package polish: bundled `LICENSE` in both distributions, complete author/repository/homepage/issues metadata, and end-user READMEs with install, quickstart, the complete command surface, and all seven integrations.

### Migration

- Users on a pre-1.0 scaffold can run `spec-init upgrade` to pick up the finalized template payload. Local edits to `CLAUDE.md`, `README.md`, or the memory files surface as three-way merge conflicts for manual resolution - no silent overwrites.

---

## [0.1.0] - 2026-07-08

First beta release. Throughspec ships as a publishable scaffolding tool on npm and PyPI, distributing a spec-driven SDLC for Claude Code from one source-of-truth template tree. Under semver 0.x - the public surface may still shift in minor bumps before 1.0.

### Added

- **Scaffolding CLI** on npm (`npx spec-init`) and PyPI (`pipx install spec-init`). Same command surface across both channels: `init`, `customize`, `add-skill`, `upgrade`, `doctor`. Cold-start scaffold completes in under 5 seconds on macOS, Linux, and Windows (PowerShell + WSL).
- **Persona presets**: `vibe | student | engineer | team`, gating tone and verbosity in `CLAUDE.md` via HTML-comment marker fences that are consumed at scaffold time.
- **Twenty-four slash commands**: `/spec-init`, `/spec-requirements`, `/spec-design`, `/spec-plan`, `/spec-feature`, `/spec-refactor`, `/spec-bug`, `/spec-docs`, `/spec-sync`. Each ships as a `SKILL.md` under `.claude/skills/`.
- **Seven tool-scoped sub-agents**: `spec-interrogator`, `spec-architect`, `spec-planner`, `spec-coder`, `spec-refactorer`, `spec-doc-writer`, `spec-bug-hunter`. Each carries a frontmatter `tools:` allowlist enforced by Claude Code at dispatch time.
- **Append-only memory layer**: `claude/{srs,plan,context,features,design-decisions,learnings}.md`. Reading `CLAUDE.md` + `context.md` stays under 8,000 tokens on a mature project; `/spec-sync` compresses any memory file past 1,500 lines with a `compressed-from` audit trail.
- **Feature cycle**: `/spec-feature` orchestrates six ordered steps (Requirements → Architecting → Product Specs → Tech Specs → Planning → Writing Code) with a fixed memory-update order (`context.md → features.md → design-decisions.md → learnings.md → CHANGELOG.md`).
- **Diff-scoped refactor**: `/spec-refactor` touches only files in the current cycle's changed list and writes an audit log to `.claude/refactor-audits/` for review-time verification.
- **Isolated bug workflow**: `/spec-bug` refuses to proceed without a reproduction recipe, requires a failing-before / passing-after regression test, and lands a `CHANGELOG.md` entry - no refactors or scope creep.
- **Docs reconciler**: `/spec-docs` compares the memory layer against reality, proposes a diff for approval, refuses to modify source, and flags features no longer in the codebase.
- **Three-way upgrade merge**: `spec-init upgrade` uses the snapshot captured at init to produce a git-style conflict view - never silent overwrites.
- **Graphify + Obsidian integrations**: opt-in via `--integrations` at init or `spec-init customize --add/--remove` post-scaffold. Toggle-roundtrip leaves zero residual files - Obsidian toggles `claude/*.md` YAML front-matter, Graphify drops a `.graphify/config.yml` and prefer-graphify note.
- **Companion website** at [throughspec.dev](https://throughspec.dev): Next.js 15 static export with Install / Quickstart / Workflows / Design Prompt Library / Learning Map / Customization Recipes / Changelog. Pagefind-backed client-side search, self-hosted `@fontsource` typography, Playwright smoke + link tests.
- **Single source-of-truth template tree**: both channels' payloads are byte-verified by `tools/check-payload-parity.mjs` (SHA-256 manifest). One template edit ships to both registries.

### Changed

- Bumped both CLIs from `0.1.0-alpha` to `0.1.0`. Python trove classifier is now `Development Status :: 4 - Beta`.

### Migration notes

- **First beta release** - no prior beta or stable to migrate from.
- Users on `0.1.0-alpha.x` should re-scaffold or run `spec-init upgrade` to pick up the finalized template payload. Any local edits to `CLAUDE.md`, `README.md`, or the memory files surface as three-way merge conflicts for manual resolution; no silent overwrites.
- Template version is pinned at `0.1.0`. `spec-init doctor` verifies it after every upgrade.
- Under semver 0.x: minor bumps may still change the public surface before 1.0. Pin exact versions if that matters to you.

### Distribution

- **npm**: `spec-init` (Node ≥ 18, ESM).
- **PyPI**: `spec-init` (Python ≥ 3.10, pure Python wheel).
- **Website**: [throughspec.dev](https://throughspec.dev), deployed to Vercel free tier as a static export.
- **License**: MIT.

### Verification

- Cross-platform CI matrix: `{macOS, Linux, Windows} × {Node 18, 20} × {Python 3.10, 3.11, 3.12}` runs Vitest, pytest, cross-language init parity, and payload SHA-256 parity on every push.
- Post-publish smoke installs the published package from each registry on each OS and runs `spec-init doctor` against a fresh scaffold.
