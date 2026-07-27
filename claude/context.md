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

**Stage:** Stage 10 infrastructure complete - v1.0.0 shippable. Awaiting release-manager acceptance run (`tests/acceptance/runbook.md`) and tag push (`v1.0.0`) which fires the npm + PyPI publish workflows.

**Tech stack**

- Node CLI: TypeScript (ESM), Node ≥ 18, distributed via npm as `spec-init`.
- Python CLI: Python ≥ 3.10, packaged with `uv`, distributed via PyPI as `spec-init`.
- Website: Next.js 15 App Router with `output: 'export'` (static HTML/CSS/JS), Tailwind CSS 3, self-hosted `@fontsource/source-serif-4` + `@fontsource/jetbrains-mono`, Pagefind for client-side search, Playwright for e2e.
- Package manager (monorepo): npm workspaces (`packages/cli-node`, `website`).
- Linting/formatting: Prettier + ESLint (JS/TS), Ruff (Python).
- Test runner: Vitest (parity harness lives in `tests/parity`); Playwright for the website smoke + link tests.
- License: MIT.
- Deploy targets: Vercel free tier (website, Stage 9), npm + PyPI (packages, Stage 10).

**Repo layout**

- `packages/cli-node/` - Node CLI (Stage 3): `src/{index,args,payload,persona,checklist,three-way-merge}.ts` + `src/commands/{init,customize,add-skill,upgrade,doctor}.ts`. Ships `dist/templates/` alongside `dist/index.js`.
- `packages/cli-python/` - Python CLI (Stage 4): `src/spec_init/{cli,args,payload,persona,checklist,three_way_merge}.py` + `commands/{init,customize,add_skill,upgrade,doctor}.py`. Wheel packages `_payload/` via hatchling `force-include`. Runtime dep: `merge3`.
- `templates/` - single source-of-truth payload consumed by both CLIs. Stage 8 added `templates/_integrations/{graphify,obsidian}/` - optional per-integration file trees that init/customize copy conditionally and that walkPayload skips when producing the base tree.
- `tools/check-payload-parity.mjs` - SHA-256 manifest parity check across both build outputs.
- `tools/strip-personas.mjs` - Stage 2 persona-gate stripping utility (Node stdlib).
- `tools/strip-integrations.mjs` - Stage 8 integration-gate stripping utility (Node stdlib). Also strips `<!-- prettier-ignore-{start,end} -->` helpers used inside obsidian front-matter fences and normalizes leading/trailing/interior whitespace so kept YAML front-matter lands on line 1.
- `tools/count-tokens.mjs` - Stage 2 tiktoken (cl100k_base) token counter.
- `tests/` - flat repo-level Vitest suite (payload parity, persona snapshots, token budget, lint, CLI end-to-end, doctor, upgrade merge, cross-language init parity, skill structural validators). See `tests/README.md` for the file map.
- `templates/.claude/skills/` - canonical location for shipped skills. Stage 5 shipped `spec-requirements/`, `spec-design/`, `spec-plan/`. Stage 6 added `spec-feature/` and preliminary `spec-refactor/`. Stage 7 finalized `spec-refactor/` (audit trail) and added `spec-bug/`, `spec-docs/`, `spec-sync/`.
- `templates/.claude/agents/` - canonical location for shipped sub-agents. Stage 6 shipped six agents. Stage 7 added `spec-bug-hunter` (Read, Grep, Bash). All seven SRS §2.2.4 agents now present, each with a frontmatter `tools:` allowlist pinned to the spec.
- `packages/cli-node/src/integrations.ts` and `packages/cli-python/src/spec_init/integrations.py` - Stage 8 TS/Python ports of `stripIntegrations(source, active)`. Byte-parity with `tools/strip-integrations.mjs` guarded by `tests/integrations-parity.test.ts` and `packages/cli-python/tests/test_integrations.py`.
- `skills/` (repo root) - intentionally empty redirect; readers point here first, README sends them to `templates/.claude/skills/`.
- `agents/` (repo root) - intentionally empty redirect mirroring the `skills/` pattern.
- `.github/workflows/` - CI matrix (Stage 10). `ci.yml` runs 15 matrix cells + acceptance-verify. `publish-npm.yml`, `publish-pypi.yml` fire on `v*` tag; both verify tag matches package version before uploading. `post-publish-smoke.yml` installs from public registries on 3 OS after a GitHub release is published. `website.yml` builds + Playwright-smokes the site on `website/**` changes.
- `tools/verify-acceptance.mjs` - Stage 10 aggregator for programmatic SRS §9 checks (7/7 gates: parity, build, skills/agents present, token budget, full Vitest, template lint, integration roundtrip). Called by `ci.yml`'s final job. Uses `fileURLToPath` for Windows-safe path resolution.
- `tests/acceptance/runbook.md` - Stage 10 human-executed procedure for the §9 items no script can cover (90-min LLM walkthrough, cycle-5 token budget, live Lighthouse, publish flow).
- `website/` - Next.js 15 static-export site (Stage 9). `app/` holds the App Router pages (landing + why/features/about/privacy/terms/changelog + docs shell with 7 SRS §7.3 sections + 404). `components/` splits into shared (`Nav`, `Footer`, `AnnounceBar`, `BrandMark`, `RevealOnScroll`, `Search`), landing (`DataFlowSVG`, `PhaseCycler`, `NotFoundSVG`, `landing.module.css` for animation classes), and docs (`DocLayout`, `DocBlocks`). `lib/docs-content.ts` is the single source of truth for docs sidebar/prev-next/page bodies; `lib/changelog.ts` parses `../CHANGELOG.md` at build time. `scripts/build-search.mjs` runs Pagefind post-`next build` to emit `out/pagefind/`. `e2e/` holds Playwright smoke + link tests.
- `design/` - `.dc.html` design mocks that the Stage 9 website ports to Tailwind + CSS-module animation classes; still the visual source of truth.
- `.markdownlint.jsonc` - lenient markdownlint config accepting HTML markers and template placeholders.
- `skills/`, `agents/`, `website/` - placeholders (READMEs only) for later stages.
- `srs.md`, `CLAUDE.md`, `claude/beta.md` - spec, behavior contract, build plan (this project's own build plan; historically named `plan.md`, renamed to `beta.md` on 2026-07-08 to signal the pre-1.0 phase).

**Build / run / test**

- Node CLI build: `npm run build -w packages/cli-node` (runs `scripts/build.mjs`, copies `templates/` → `packages/cli-node/dist/templates/`).
- Node CLI usage: `node packages/cli-node/dist/index.js <init|customize|add-skill|upgrade|doctor> [flags]` or, after publish, `npx spec-init <command>`.
- Python CLI usage: `cd packages/cli-python && uv run python -m spec_init <command>` in dev, or `pipx install spec-init` after publish.
- Python tests: `cd packages/cli-python && uv run pytest tests/`.
- Python CLI build: `uv build packages/cli-python` (invokes `_build.py` to copy `templates/` → `packages/cli-python/_payload/`).
- Parity check: `node tools/check-payload-parity.mjs` - exits 0 when both payloads match SHA-256.
- Markdown lint: `npm run lint:md` (markdownlint-cli2 over `templates/**/*.md`).
- Persona strip: `node tools/strip-personas.mjs --persona <vibe|student|engineer|team> --in templates/CLAUDE.md`.
- Token count: `npm run stage2:tokens` (asserts CLAUDE.md + context.md under NFR-PERF-02 budget).
- Tests: `npx vitest run` from repo root.
- Node CLI lint: `npx eslint packages/cli-node/src`.

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

## 2026-06-30 - Stage 2: Canonical Project Payload

**Prompt / trigger:** `/feature-dev` for Stage 2 (plan.md).

**What was done:**

- Added persona-gated sections (`vibe | student | engineer | team`) to `templates/CLAUDE.md` fenced by HTML comments (`<!-- persona:NAME -->` ... `<!-- /persona:NAME -->`), including CSV multi-persona support.
- Wrote `tools/strip-personas.mjs` (Node stdlib) to keep only the block matching `--persona` and strip the rest verbatim. Exported `stripPersonas()` for direct test import.
- Wrote `tools/count-tokens.mjs` on `js-tiktoken` with the `cl100k_base` encoding as an Anthropic token-count proxy for the NFR-PERF-02 budget check.
- Added `.markdownlint.jsonc` with lenient rules (allow inline HTML for markers, compact tables, underscore emphasis) so template placeholder syntax passes.
- Reformatted the entire `templates/**/*.md` tree with `prettier --write` (blank lines around headings/lists) to satisfy the acceptance criterion "copied tree passes `prettier --check`."
- Added `text` language tags to two fenced code blocks in `templates/README.md` and `templates/CONTRIBUTING.md` (MD040).
- Added `tests/stage2/{personas,tokens,lint}.test.ts` covering: per-persona snapshot, NFR-PERF-02 budget (< 8,000 tokens), and lint pass on a temp copy of `templates/`.
- Added dev deps `js-tiktoken@^1.0.15`, `markdownlint-cli2@^0.15.0` and scripts `lint:md`, `stage2:strip`, `stage2:tokens`.
- Rebuilt both payloads (`packages/cli-node/dist/templates/`, `packages/cli-python/_payload/`) so `tools/check-payload-parity.mjs` passes with the new templates content.

**Files touched:**

- `templates/CLAUDE.md` - update - added `## 10. Persona Guidance` with four marker-gated blocks.
- `templates/README.md` - update - added `text` language tag to Quick Start tree block.
- `templates/CONTRIBUTING.md` - update - added `text` language tag to commit-message block.
- `templates/**/*.md` (12 files) - update - `prettier --write` reformatted whitespace only.
- `tools/strip-personas.mjs` - create - persona-strip utility.
- `tools/count-tokens.mjs` - create - `js-tiktoken` wrapper.
- `.markdownlint.jsonc` - create - lenient lint config.
- `tests/stage2/{README.md,personas.test.ts,tokens.test.ts,lint.test.ts}` - create - Stage 2 acceptance tests.
- `tests/stage2/__snapshots__/personas.test.ts.snap` - create - four persona snapshots.
- `package.json` - update - added devDeps and scripts.
- `packages/cli-node/dist/templates/**` and `packages/cli-python/_payload/**` - update - copied fresh from `templates/` because sandbox blocked `rm` on pre-existing outputs (rebuild-in-place kept parity green).

**Decisions made:**

- **Persona marker convention: HTML-comment fences with CSV names.** Chosen over front-matter, Handlebars, or Nunjucks because it is zero-dependency, grep-friendly, and renders as nothing in every markdown viewer. CSV multi-persona (`persona:student,engineer`) lets a single block target overlapping personas without duplication.
- **`cl100k_base` (js-tiktoken) as the token proxy.** Anthropic does not publish an open tokenizer; cl100k_base is close enough at the 8,000-token precision the budget requires and needs no network call, no key, no cost. Zero-cost policy holds (CLAUDE.md §7).
- **Lint test operates on a temp copy of `templates/`.** Matches the acceptance-criterion phrasing literally ("copying `templates/` into an empty directory ... passes ...") and keeps repo-level `.prettierignore` untouched.
- **Reformatted templates instead of loosening lint rules.** Stage 1 shipped without a lint gate; Stage 2 introduces one. Bringing templates into compliance is preferable to weakening the standard downstream users inherit.

**Open questions / follow-ups:**

- Sandbox blocked `rm -rf packages/cli-{node,python}/dist,_payload` because the previous outputs were created outside the container. `cp -R` overwrote the files in place and parity holds, but a fresh clone should run `npm run clean && npm run build && npm run build:python` before releasing.
- Persona-strip is ready to be consumed by the Stage 3 Node CLI and Stage 4 Python CLI - both must call it during `init` when `--persona` is passed.
- Consider adding CSV multi-persona coverage to the snapshot suite once a real multi-persona block exists.

---

## 2026-06-30 - Stage 3: Node Scaffolding CLI

**Prompt / trigger:** `/feature-dev` for Stage 3 (plan.md).

**What was done:**

- Built the `spec-init` Node CLI end-to-end with commands `init | customize | add-skill | upgrade | doctor` and flags `--persona | --integrations | --add | --remove | --force | --dry-run | --help | --version`.
- Modular src/ layout: `args.ts` (typed argv parser, ~140 lines, zero deps), `payload.ts` (resolves the shipped `dist/templates/`), `persona.ts` (TS port of `tools/strip-personas.mjs` with a whitespace-normalizer), `checklist.ts` (post-init next-step printer), `three-way-merge.ts` (`node-diff3` wrapper with git-style conflict output).
- Command modules under `src/commands/`: `init` snapshots the payload into `<project>/.spec-init/base/` for future upgrades; `customize` toggles integration checkboxes and swaps personas from the pristine snapshot; `add-skill` reports "no skills available" until Stage 5; `upgrade` three-way-merges `base` vs `ours` vs `theirs` and surfaces conflicts as `<<<<<<< ours` fences; `doctor` validates the SRS §6 required-file list, the template-version line, and the base snapshot.
- Added `tests/stage3/` (7 files, 28 assertions): CLI smoke, persona-strip TS/mjs byte-parity, init tree shape + personas + integrations + `--force` + `--dry-run` + perf (< 5s) + lint pass, doctor OK/corrupted, customize actions, add-skill refusals, upgrade merge behaviors.
- Updated `tools/strip-personas.mjs` and `packages/cli-node/src/persona.ts` in lockstep to collapse 3+ consecutive newlines (`\n{3,}→\n\n`) and normalize the trailing newline (`\n+$→\n`) - necessary so scaffolded CLAUDE.md passes markdownlint MD012 after removing three of four persona blocks.

**Files touched:**

- `packages/cli-node/src/args.ts` - create - argv → typed CliOptions, plus HELP_TEXT.
- `packages/cli-node/src/payload.ts` - create - resolvePayloadDir() via import.meta.url.
- `packages/cli-node/src/persona.ts` - create - TS strip port; kept byte-equivalent to the .mjs.
- `packages/cli-node/src/checklist.ts` - create - postInitChecklist().
- `packages/cli-node/src/three-way-merge.ts` - create - node-diff3 wrapper.
- `packages/cli-node/src/commands/init.ts` - create - scaffold, persona strip, integration flip, snapshot to .spec-init/base/.
- `packages/cli-node/src/commands/customize.ts` - create - integration flip + persona swap.
- `packages/cli-node/src/commands/add-skill.ts` - create - copy from skills catalog.
- `packages/cli-node/src/commands/upgrade.ts` - create - three-way merge command.
- `packages/cli-node/src/commands/doctor.ts` - create - project health check.
- `packages/cli-node/src/index.ts` - update - replaced Stage-1 stub with the dispatcher.
- `packages/cli-node/package.json` - update - added `node-diff3` dep, bumped version to 0.1.0-alpha.0, added `test` script.
- `packages/cli-node/README.md` - update - documented the shipped command surface and the .spec-init/base/ snapshot.
- `tools/strip-personas.mjs` - update - added `\n{3,}→\n\n` and `\n+$→\n` post-processing.
- `tests/stage3/{README.md,cli.test.ts,parity.test.ts,init.test.ts,doctor.test.ts,customize.test.ts,add-skill.test.ts,upgrade.test.ts}` - create - Stage 3 acceptance tests.
- `tests/stage2/__snapshots__/personas.test.ts.snap` - update - regenerated to match the whitespace-normalized strip output.
- `packages/cli-node/dist/**` and both payloads - update - rebuilt; parity script exits 0 with 16 files matching SHA-256.
- `claude/plan.md` - update - Stage 3 checkbox flipped to [x].

**Decisions made:**

- **Hand-roll argv parsing** instead of pulling in commander/yargs. The CLI surface has five commands and eight flags; a ~140-line parser is smaller than the dep's typings alone and honors CLAUDE.md §2 (Simplicity First).
- **`node-diff3` for the three-way merge.** SRS explicitly permits "a small, audited library" here. `node-diff3` is pure JS, MIT, zero-dep, and passes NFR-PORT-02 (no native binary).
- **`.spec-init/base/` snapshot at init time.** Without this cache, `upgrade` has no common ancestor and degenerates to a two-way overwrite. The cache is ~30 KB per project, well worth the disk cost.
- **TS port of the persona regex** instead of importing `tools/strip-personas.mjs` from the built package. `tools/` is not shipped to npm; the CLI must own its copy. Parity test proves byte-equivalence.
- **Post-strip whitespace normalizer** (`\n{3,}→\n\n`, `\n+$→\n`). Removing a persona block leaves surrounding blank lines that markdownlint (MD012) rejects. Normalizing in-place keeps the source template readable while making downstream scaffolds lint-clean.
- **Refuse on non-empty dir without `--force`** (FR-INIT-03) - definition of "non-empty" excludes dotfiles so hidden state (`.git`, `.spec-init`) does not accidentally trip the guard when re-initializing in place.

**Open questions / follow-ups:**

- Once Stage 4 ships the Python CLI, consider factoring the persona regex + whitespace normalizer into a shared JSON contract (e.g. a `spec.json` describing the marker convention) so future changes only need to update one file. For now, the parity test guards the TS↔mjs pair.
- Sandbox blocked `rm -rf dist/` again during rebuild; used tsc-in-place + `cp -R` to overwrite. Fresh clones should run `npm run clean && npm run build && npm run build:python` before publishing.
- The `--version` flag is currently ignored unless a command is also present. Consider treating `--version` as a top-level short-circuit before command validation for user-friendliness.
- `add-skill` currently has no `--dry-run` coverage in tests; add once Stage 5 fills the catalog.

---

## 2026-07-01 - Stage 4: Python Scaffolding CLI

**Prompt / trigger:** `/feature-dev` for Stage 4 (plan.md).

**What was done:**

- Ported the Stage 3 Node CLI to Python, module-for-module: `packages/cli-python/src/spec_init/{cli,args,payload,persona,checklist,three_way_merge}.py` plus one file per verb under `commands/`.
- Chose stdlib `argparse` over typer/click. Same UsageError contract as Node so error text matches.
- `merge3` (PyPI, pure-Python, MIT) is the Python analog of `node-diff3`. Wrapped in `three_way_merge.py` to emit identical `<<<<<<< ours` / `>>>>>>> theirs` fences so users see the same conflict markers regardless of which CLI they installed.
- Persona strip ported to Python `re`; identical regex, identical whitespace normalizer (`\n{3,}→\n\n`, trailing `\n+→\n`). `test_persona.py` runs both the Python function and `tools/strip-personas.mjs` on the same input and asserts byte-equivalence (skipped when node isn't installed).
- Wrote 32 pytest cases (`packages/cli-python/tests/`) mirroring the Node Vitest suite: args, persona parity, init (tree shape, personas, integrations, `--force`, `--dry-run`, perf), doctor, customize, add-skill, upgrade.
- Added cross-language parity test `tests/cli-parity.test.ts`: scaffolds via both CLIs into two tmp dirs and diffs file-by-file with SHA-256 for every persona plus one integration-flip case. Enforces SRS §2.3 byte-identical requirement.
- Bumped `pyproject.toml` version to `0.1.0a0`; added `merge3>=0.0.8` runtime dep and `[dependency-groups] dev = ["pytest>=8"]`; updated `packages/cli-python/src/spec_init/__init__.py` version constant.
- Replaced `packages/cli-python/src/spec_init/__main__.py` and Stage-1 stub with the real dispatcher.
- Refreshed `packages/cli-python/_payload/` and `packages/cli-node/dist/templates/` in place; `tools/check-payload-parity.mjs` exits 0 (16 files matching SHA-256).
- Rewrote `packages/cli-python/README.md` to document the shipped command surface with a link to the Node CLI as the canonical reference.

**Files touched:**

- `packages/cli-python/src/spec_init/args.py` - create - argparse config + typed CliOptions + HELP_TEXT.
- `packages/cli-python/src/spec_init/payload.py` - create - resolve_payload_dir().
- `packages/cli-python/src/spec_init/persona.py` - create - Python strip port with parity guarantee.
- `packages/cli-python/src/spec_init/checklist.py` - create - post_init_checklist().
- `packages/cli-python/src/spec_init/three_way_merge.py` - create - merge3 wrapper with git-style markers.
- `packages/cli-python/src/spec_init/cli.py` - create - dispatcher + main().
- `packages/cli-python/src/spec_init/commands/__init__.py` - create - package marker.
- `packages/cli-python/src/spec_init/commands/init.py` - create - scaffold + snapshot.
- `packages/cli-python/src/spec_init/commands/customize.py` - create - integration flip + persona swap.
- `packages/cli-python/src/spec_init/commands/add_skill.py` - create - copy from catalog.
- `packages/cli-python/src/spec_init/commands/upgrade.py` - create - three-way merge command.
- `packages/cli-python/src/spec_init/commands/doctor.py` - create - project health check.
- `packages/cli-python/src/spec_init/__init__.py` - update - version bumped to 0.1.0a0.
- `packages/cli-python/src/spec_init/__main__.py` - update - delegates to cli.main().
- `packages/cli-python/pyproject.toml` - update - version, runtime dep, dev group.
- `packages/cli-python/README.md` - update - shipped command surface.
- `packages/cli-python/tests/{__init__,conftest,test_args,test_persona,test_init,test_doctor,test_customize,test_add_skill,test_upgrade}.py` - create - 32 pytest cases.
- `tests/cli-parity.test.ts` - create - cross-language SHA-256 diff of scaffolded trees.
- `claude/plan.md` - update - Stage 4 checkbox to [x].
- `packages/cli-node/dist/templates/**` and `packages/cli-python/_payload/**` - update - copy-in-place refresh; parity script exits 0.

**Decisions made:**

- **argparse (stdlib) over typer/click.** Same reasoning as Stage 3 chose a hand-rolled Node parser: the surface is small enough that a framework costs more than it saves. Also keeps the Python CLI dep-count symmetrical with Node (one runtime dep each).
- **`merge3` as the three-way engine.** Pure-Python, MIT, ~2 KB, actively used by breezy/bzr. Zero-cost. Its native output uses different markers than git; we wrap it to emit identical `<<<<<<< ours` / `>>>>>>> theirs` fences so user-facing conflict output matches the Node CLI.
- **Persona parity via three implementations, not a shared spec.** The strip regex lives in three files (`tools/strip-personas.mjs`, `packages/cli-node/src/persona.ts`, `packages/cli-python/src/spec_init/persona.py`). Two parity tests (`tests/persona-parity.test.ts` for TS↔mjs, `packages/cli-python/tests/test_persona.py` for Python↔mjs) guarantee no drift. Considered extracting to a JSON spec but the regex is short enough that duplication + tests is simpler than a spec loader in three languages.
- **`dirs_exist_ok=True` on the snapshot copy.** Python's `shutil.copytree` refuses to overwrite by default; the flag makes `--force` re-init work. Node's `cpSync` has this behavior implicitly.
- **Binary file I/O consideration deferred.** Currently using `write_text(..., encoding="utf-8", newline="")` which preserves `\n` verbatim across OSes. Cross-language parity confirmed on Linux; Windows CI (Stage 10) will double-check.
- **Snapshot refresh in upgrade uses `rmtree + copytree`.** Node uses `cpSync` with recursive overwrite; Python's simpler approach avoids `copytree(dirs_exist_ok=True)`'s edge cases when deep structure changes.

**Open questions / follow-ups:**

- The `merge3` package's exact output format (line splitting, trailing newlines) may differ from `node-diff3` on edge cases; Stage 10 should add a cross-language conflict-marker equivalence test if we care about byte-identical `upgrade` output.
- Publishing flow: `python -m spec_init._build && uv build` produces the wheel; verify `pipx install ./dist/spec-init-0.1.0a0-py3-none-any.whl` succeeds before publishing to PyPI.
- `packages/cli-python/src/spec_init/_payload/` may need to exist for editable installs to find the payload - resolved for now via the two-candidate lookup in `payload.py`.
- Cross-language parity test currently only covers `init`. Add coverage for `customize` and `upgrade` outputs in Stage 10.

---

## 2026-07-01 - Stage 5: Initiation Skills

**Prompt / trigger:** `/feature-dev` for Stage 5 (plan.md).

**What was done:**

- Wrote three Claude Code skills as `SKILL.md` prompts under `templates/.claude/skills/`: `spec-requirements/`, `spec-design/`, `spec-plan/`. Each has YAML frontmatter (`name`, `description`) and a prose body encoding the FR-* directives from the SRS.
- `spec-requirements/SKILL.md` encodes FR-REQ-01..05: mandates ≥3 cross-questioning rounds, lists the five mandatory categories (target users, jobs-to-be-done, primary success metric, hard constraints, explicit non-goals), specifies a refusal clause when any category is empty, prescribes the canonical `srs.md` section list, and requires open questions be tracked as a checklist.
- `spec-design/SKILL.md` encodes FR-DESIGN-01..05: reference-driven first, inferred fallback, canonical output sections (Tokens - Colors / Typography / Spacing & Shape, Components, Do's and Don'ts, Surfaces), preview assets under `design/preview/`, and a hard refusal against fabricating brand colors when a reference is supplied.
- `spec-plan/SKILL.md` encodes FR-PLAN-01..05: 8-10 stages, each with standalone-testable-runnable deliverable, per-stage fields (goal / scope-in / scope-out / acceptance / test plan / effort band), checklist Claude flips during execution, and refusal to run while `srs.md` has unresolved load-bearing open questions.
- All three carry a one-line completion summary + next-step hint (NFR-USE-01) and a Student-persona "Why this step?" annotation (NFR-USE-03).
- Wrote `tests/skills.test.ts` (24 assertions): validates YAML frontmatter, mandatory section headings, refusal clauses, category coverage, persona annotations, and next-step handoff. Treats SKILL.md files as prompts to be verified structurally, not executed.
- Extended `tests/init.test.ts` REQUIRED list to assert the three scaffolded `.claude/skills/<name>/SKILL.md` paths exist after `init`.
- Rewrote `skills/README.md` (repo root) as a redirect to `templates/.claude/skills/` with the placement rationale.
- Refreshed all three payload copies (`packages/cli-node/dist/templates/`, `packages/cli-python/_payload/`, `packages/cli-python/src/spec_init/_payload/`) via `cp -R` so `tools/check-payload-parity.mjs` exits 0 with 19 files matching SHA-256.
- Reordered `resolve_payload_dir()` candidates in `packages/cli-python/src/spec_init/payload.py` so `packages/cli-python/_payload/` (the dev-time build target) wins over `spec_init/_payload/` (site-packages copy). This makes `_build.py` rebuilds land immediately in editable-mode without touching site-packages.

**Files touched:**

- `templates/.claude/skills/spec-requirements/SKILL.md` - create - encodes FR-REQ-01..05.
- `templates/.claude/skills/spec-design/SKILL.md` - create - encodes FR-DESIGN-01..05.
- `templates/.claude/skills/spec-plan/SKILL.md` - create - encodes FR-PLAN-01..05.
- `tests/skills.test.ts` - create - 24 structural/content assertions across the three skills.
- `tests/init.test.ts` - update - REQUIRED list now includes the three scaffolded SKILL.md paths.
- `skills/README.md` - update - rewritten as a redirect to `templates/.claude/skills/`.
- `packages/cli-python/src/spec_init/payload.py` - update - candidate order reversed so dev-time source wins.
- `packages/cli-node/dist/templates/**`, `packages/cli-python/_payload/**`, `packages/cli-python/src/spec_init/_payload/**` - update - copy-in-place refresh; parity script exits 0 (19 files).
- `claude/plan.md` - update - Stage 5 checkbox to [x].

**Decisions made:**

- **Skills placed at `templates/.claude/skills/`, not `skills/` at repo root.** NFR-MAINT-02 requires a single source-of-truth directory for skills. Reading the intent as "no duplication" (not "must be at repo root literally") lets skills flow through the existing `templates/` → payload → scaffold pipeline with zero build wiring, zero parity-check changes, and zero test rework. The repo-root `skills/` is left as a signposted redirect so readers do not get confused.
- **Structural testing of SKILL.md prompts.** Skills are not deterministic code; they are LLM prompts. Live LLM tests are expensive and non-deterministic. Instead, `tests/skills.test.ts` grep each SKILL.md for the specific FR-* directives (round count, category names, refusal clauses, section headings, persona annotations). If a future edit accidentally removes a load-bearing directive, the test fires red before the change ships.
- **`resolve_payload_dir()` candidate order.** The wheel-installed location (`site-packages/spec_init/_payload/`) was winning over the editable-mode source (`packages/cli-python/_payload/`), so dev-time rebuilds silently landed nowhere the CLI would look. Reordering the candidates so the dev-time source wins fixes this without breaking the installed-wheel path (which does not have the outer `_payload/`).

**Open questions / follow-ups:**

- Publishing flow needs to keep `packages/cli-python/src/spec_init/_payload/` in sync during editable installs; look at pinning it via `hatch.build.hooks` in Stage 10 rather than relying on manual `cp -R`.
- Stage 6 skills (`/spec-feature` and the six agents) belong at `templates/.claude/skills/` and `templates/.claude/agents/` respectively. Reuse the placement pattern established here.
- Consider a lint rule that fails if a SKILL.md drops below N lines - a Claude Code prompt that gets accidentally truncated during merge would still parse but no longer encode the FR-* rules.

---

## 2026-07-01 - Stage 6: 6-Phase Feature Cycle + agents

**Prompt / trigger:** `/feature-dev` for Stage 6 (plan.md).

**What was done:**

- Shipped the `/spec-feature` orchestrator skill at `templates/.claude/skills/spec-feature/SKILL.md`. It walks all six SRS §3.5 phases in order, refuses to skip without an explicit `--skip <phase>` flag AND a written `claude/design-decisions.md` entry (FR-FEATURE), delegates each phase to the corresponding sub-agent, and enforces the FR-CODE-05 memory-update ordering (`context.md → features.md → design-decisions.md → learnings.md → CHANGELOG.md`).
- Shipped the preliminary `/spec-refactor` skill at `templates/.claude/skills/spec-refactor/SKILL.md`. It refuses to proceed without the current cycle's changed-files list, dispatches the `spec-refactorer` sub-agent with that scope, and verifies no out-of-scope files were touched. Stage 7 will finalize the audit/isolation contract.
- Shipped six sub-agents under `templates/.claude/agents/`. Each has YAML frontmatter (`name`, `description`, `tools`) and a prose body with a "MUST NOT" boundary section. Tool allowlists match SRS §2.2.4 exactly:
  - `spec-interrogator.md` - `tools: Read`
  - `spec-architect.md` - `tools: Read, Grep, Glob`
  - `spec-planner.md` - `tools: Read, Grep`
  - `spec-coder.md` - `tools: Read, Write, Edit, Bash`
  - `spec-refactorer.md` - `tools: Read, Edit`
  - `spec-doc-writer.md` - `tools: Read, Write, Edit`
- Wrote `tests/agents.test.ts` (24 assertions). For each of the six agents: valid frontmatter, exact tool-allowlist match against SRS §2.2.4, and presence of the "MUST NOT" boundary section. Plus three cross-cutting invariants: spec-interrogator has no write tools; spec-refactorer cannot Write new files; spec-doc-writer has no Bash.
- Extended `tests/skills.test.ts` with 12 new assertions across the two new skills: names every phase in order, refusal + design-decisions.md logging, delegates to all six sub-agents by name, FR-CODE-05 memory update order (checked structurally by scanning the fenced-order block, not scattered filename references elsewhere in the prose), re-reads memory before code (FR-CODE-01), diff-scoped refactor refusal (FR-CODE-04).
- Extended `tests/init.test.ts` REQUIRED list with 8 new scaffolded paths (2 skills + 6 agents).
- Rewrote `agents/README.md` at the repo root as a redirect to `templates/.claude/agents/`, mirroring the pattern used for `skills/README.md` in Stage 5.
- Refreshed all three payload copies via `cp -R`; `tools/check-payload-parity.mjs` exits 0 with 27 files matching SHA-256 (up from 19 in Stage 5).
- Post-lint fix: added `text` language tags to fenced output blocks in every new agent/skill file (MD040) via a one-shot awk pass, then ran `prettier --write` on `templates/.claude/**/*.md` to normalize a heading-adjacent blank line.

**Files touched:**

- `templates/.claude/agents/spec-interrogator.md` - create - Read-only cross-questioner (FR-REQ, Phase 1).
- `templates/.claude/agents/spec-architect.md` - create - ≥2-option architect (Phase 2).
- `templates/.claude/agents/spec-planner.md` - create - stage decomposer (Phase 5).
- `templates/.claude/agents/spec-coder.md` - create - single-stage implementer (Phase 6, FR-CODE-01..03).
- `templates/.claude/agents/spec-refactorer.md` - create - diff-scoped cleaner (FR-CODE-04).
- `templates/.claude/agents/spec-doc-writer.md` - create - memory-layer maintainer (FR-CODE-05).
- `templates/.claude/skills/spec-feature/SKILL.md` - create - 6-phase orchestrator.
- `templates/.claude/skills/spec-refactor/SKILL.md` - create - preliminary diff-scoped refactor.
- `tests/agents.test.ts` - create - 24 structural assertions with SRS §2.2.4 allowlist enforcement.
- `tests/skills.test.ts` - update - added 12 assertions across spec-feature and spec-refactor.
- `tests/init.test.ts` - update - REQUIRED list grew by 8 scaffolded paths.
- `agents/README.md` - update - rewritten as redirect to `templates/.claude/agents/`.
- Payload copies (`packages/cli-node/dist/templates/**`, `packages/cli-python/_payload/**`, `packages/cli-python/src/spec_init/_payload/**`) - update - copy-in-place refresh; parity script exits 0 (27 files).
- `claude/plan.md` - update - Stage 6 checkbox to [x] with note that the SRS §9 live end-to-end feature-cycle verification is deferred to Stage 10 acceptance.

**Decisions made:**

- **Skill-orchestrator + tool-bounded-agents split.** `/spec-feature` is the sequencing + policy layer (which phase runs when, when to refuse, in what order to write memory). The six agents are the tool-bounded actors (each with an explicit `tools:` allowlist matching SRS §2.2.4). A rogue prompt inside `spec-interrogator` cannot escape the `Read`-only allowlist because Claude Code enforces the frontmatter at dispatch time. That is stronger than any prose "do not write" instruction.
- **Structural test of FR-CODE-05 memory ordering via fenced-block scan.** The prescribed order (`context.md → features.md → design-decisions.md → learnings.md → CHANGELOG.md`) appears in a fenced code block inside `spec-feature/SKILL.md`. Naive `body.indexOf(name)` finds the earliest mention anywhere in the prose (many of these filenames appear multiple times in the skill), which makes the test flakey. Instead, extract the fenced-order block via regex and check ordering inside it. Deterministic and drift-catching.
- **End-to-end LLM-run acceptance deferred to Stage 10.** The plan's acceptance criterion ("scripted feature completes all six phases on a sample app") requires a real Claude session and is expensive to run in CI. Stage 6 provides everything a Stage 10 human acceptance run needs: the skill, the six agents, structural tests that guarantee the definitions still encode the FR-* rules. The 90-minute acceptance run happens once at Stage 10 with a real user.
- **Repo-root `agents/` follows the same redirect pattern as `skills/`.** No new source-of-truth location; the placement decision from Stage 5 (skills live under `templates/.claude/`) generalizes to agents. Cross-language parity, payload check, and CLI code all remain unchanged.

**Open questions / follow-ups:**

- Token-budget regression test (cycle 5 ≤ 120% of cycle 1) belongs to Stage 10 - it needs real LLM runs to measure.
- Consider a lint rule that flags a SKILL.md or agent .md dropping below N lines, so accidental truncation during future edits does not silently strip a phase or refusal clause.
- The `spec-refactor` skill defers the "audit trail of tool calls" isolation contract to Stage 7. Track that as a Stage 7 responsibility.
- The `spec-doc-writer` agent currently checks for Student persona by looking for the "For the Student" block in `CLAUDE.md`. If a user manually deletes that block after scaffold, learnings.md updates silently stop. Consider a stronger detection mechanism in Stage 7.

---

## 2026-07-02 - Stage 7: Maintenance Skills

**Prompt / trigger:** `/feature-dev` for Stage 7 (plan.md).

**What was done:**

- Shipped three new maintenance skills at `templates/.claude/skills/`:
  - `spec-bug/SKILL.md` - isolated bug workflow. Refuses without a reproduction recipe (FR-BUG-01), delegates isolation to `spec-bug-hunter`, requires failing-before/passing-after regression test (FR-BUG-03), delegates the smallest possible diff (FR-BUG-02) to `spec-coder` with explicit no-refactor scope (FR-BUG-04), and appends a single line under `### Fixed` in `CHANGELOG.md` (FR-BUG-05). No memory-layer updates from this skill - bug fixes are a separate track from feature cycles.
  - `spec-docs/SKILL.md` - isolated docs reconciliation. Reads repo state and cross-checks against `claude/context.md`, `claude/features.md`, `README.md` (FR-DOCS-01), produces a unified-diff-style proposal (FR-DOCS-02), refuses to modify anything under a source path (FR-DOCS-03), and flags features documented but no longer present in the code (FR-DOCS-04).
  - `spec-sync/SKILL.md` - drift check + memory compression. Cross-checks `claude/context.md`'s Current State against actual repo, compresses any memory file over 1,500 lines (NFR-PERF-03), and writes a `compressed-from` audit block preserving reversibility from git. Refuses to compress a file with uncommitted changes.
- Finalized `spec-refactor/SKILL.md` (Stage 6 shipped preliminary) by adding Step 4: write an audit log to `.claude/refactor-audits/refactor-audit-{ISO}.md` after every pass. Audit is append-only even on rollback so tool-call verification has a permanent trail.
- Shipped the seventh and final agent `spec-bug-hunter.md` at `templates/.claude/agents/` with `tools: Read, Grep, Bash` per SRS §2.2.4. Deliberately no Write/Edit - the "patches" language in the SRS is reconciled by having spec-bug-hunter isolate and produce a draft regression test, then hand the fix off to `spec-coder` for the actual edit + tests-and-verify pass.
- Extended `tests/agents.test.ts` (26 assertions now) with `spec-bug-hunter` allowlist enforcement plus the cross-cutting "spec-bug-hunter cannot Write or Edit - patches route through spec-coder" invariant.
- Extended `tests/skills.test.ts` (58 assertions now) with `describe` blocks for `spec-bug`, `spec-docs`, `spec-sync`, plus the audit-trail assertion for `spec-refactor`. Skill count went from 5 to 8 shipped skills (all seven SRS §2.2.3 skills plus the one-off refactor pass).
- Extended `tests/init.test.ts` REQUIRED list by 4 paths (3 skills + 1 agent).
- Refreshed all three payload copies via `cp -R`; parity script exits 0 with 31 files matching SHA-256 (up from 27 in Stage 6).
- Post-lint fix: original `spec-bug-hunter.md` had a nested fenced code block inside a bullet list (regression-test placeholder), which triggered MD007/MD032/MD031/MD040 in a cascade. Rewrote the REGRESSION TEST section to prose form. Ran `prettier --write` on `templates/.claude/**/*.md` to normalize whitespace on the two edited skill files.

**Files touched:**

- `templates/.claude/agents/spec-bug-hunter.md` - create - Read+Grep+Bash allowlist; produces isolation report + draft regression test; delegates the fix to spec-coder.
- `templates/.claude/skills/spec-bug/SKILL.md` - create - encodes FR-BUG-01..05.
- `templates/.claude/skills/spec-docs/SKILL.md` - create - encodes FR-DOCS-01..04.
- `templates/.claude/skills/spec-sync/SKILL.md` - create - encodes NFR-PERF-03 + drift check + compressed-from audit.
- `templates/.claude/skills/spec-refactor/SKILL.md` - update - added Step 4 audit trail (FR-CODE-04 finalized), reworded Stage-6 preliminary note into the isolation contract summary.
- `tests/agents.test.ts` - update - added spec-bug-hunter allowlist + cross-cutting invariant.
- `tests/skills.test.ts` - update - added 28 assertions across spec-bug/docs/sync + spec-refactor audit assertion.
- `tests/init.test.ts` - update - REQUIRED list grew by 4 scaffolded paths.
- Payload copies (`packages/cli-node/dist/templates/**`, `packages/cli-python/_payload/**`, `packages/cli-python/src/spec_init/src/spec_init/_payload/**` (via `packages/cli-python/src/spec_init/_payload/**`)) - update - copy-in-place refresh; parity script exits 0 (31 files).
- `claude/plan.md` - update - Stage 7 checkbox to [x].

**Decisions made:**

- **`spec-bug-hunter` follows SRS §2.2.4 literally: `Read, Grep, Bash`, no `Edit`.** The spec's "patches bugs" phrasing seems to imply Edit, but the tool allowlist as written does not include it. Reconciled by scoping spec-bug-hunter to isolation + draft-regression-test production, and routing the actual patch through spec-coder. This preserves the invariant that only one agent (`spec-coder`) has write authority to project source code, which is what makes bug-fix scope enforceable.
- **Isolation-by-audit-log.** Claude Code cannot enforce tool-call auditing at dispatch time - the harness does not currently expose "which files did this agent read?" as an inspectable artifact. `spec-refactor` compensates by requiring the skill itself to write an on-disk audit log recording the file list. A later reviewer (or a Stage 10 CI check) can compare the log's "reported changing" list against the "scope handed" list. It is compensating control, not preventive - but it makes drift observable at review time instead of production time.
- **Bug fixes are a separate track from feature cycles.** `spec-bug` writes only to `CHANGELOG.md` and does not touch `claude/context.md`, `claude/features.md`, `claude/design-decisions.md`, or `claude/learnings.md`. That mirrors how bug fixes work in most healthy repositories: they get a CHANGELOG entry and a regression test, not a feature-log entry, because "we fixed a defect" is different history from "we shipped a capability."
- **`spec-sync` compression retains recency verbatim.** Older Session History and Feature entries get folded into a summary block; the most recent 2-3 stay untouched. The `compressed-from` block plus git history means a rollback is a single `git checkout` away. Never delete, never rewrite in place.
- **Nested fenced code blocks in agent .md files are avoided.** The original spec-bug-hunter regression-test placeholder used ` ```{lang} ` inside an outer ` ```text ` block. Markdown parsers stop the outer fence at the first inner three-backtick, cascading multiple lint errors. Solution: describe the test content in prose instead of nesting a fence.

**Open questions / follow-ups:**

- The `.claude/refactor-audits/` directory does not exist in scaffolded projects at init time. The first `/spec-refactor` run creates it. Consider adding an empty placeholder + README to the scaffold in Stage 10 so a user browsing a fresh project sees the audit-log location intended.
- `spec-docs` currently defines "source path" prose-style (`src/`, `packages/`, `lib/`). Consider a `.claude/config.yml` in Stage 10 that lets projects declare their source paths explicitly, so the refusal gate is data-driven instead of hardcoded.
- Live end-to-end acceptance runs for all four maintenance skills belong to Stage 10 alongside the initiation/feature-cycle acceptance.
- All seven SRS §2.2.4 agents are now shipped. §2.2.3 lists nine skills; we have shipped all nine (3 initiation + spec-feature + spec-refactor + spec-bug + spec-docs + spec-sync).

---

## 2026-07-08 - Stage 8: Integrations (Graphify, Obsidian)

**Prompt / trigger:** `/feature-dev` for Stage 8 (plan.md).

**What was done:**

- Introduced integration-marker fences (`<!-- integration:NAME -->` ... `<!-- /integration:NAME -->`) that mirror the persona-marker pattern from Stage 2. Wrapped `- [x]` list entries in `templates/CLAUDE.md` §8 and the `### Graphify` / `### Obsidian` sub-sections in `templates/README.md`. Prepended obsidian-fenced YAML front-matter (`tags`, `aliases`) to all six `templates/claude/*.md` files and `templates/design/design.md`.
- Wrapped the YAML fence lines inside each obsidian block with `<!-- prettier-ignore-start -->` / `<!-- prettier-ignore-end -->` so prettier does not reformat `---` into thematic breaks (which would break Obsidian's line-1 front-matter requirement after strip).
- Added a per-integration payload subtree under `templates/_integrations/`: `graphify/.graphify/config.yml` (with sensible defaults + include/exclude globs) and `obsidian/.obsidian/workspace.json` (with the memory files pinned in `lastOpenFiles`).
- Wrote `tools/strip-integrations.mjs` (Node stdlib), `packages/cli-node/src/integrations.ts`, and `packages/cli-python/src/spec_init/integrations.py` - three-way byte-parity implementation of `stripIntegrations(source, active)`. All three keep a block's body when its NAME is in `active`, strip whole blocks otherwise, drop `<!-- prettier-ignore-{start,end} -->` helpers, and normalize whitespace so a kept front-matter block ends at line 1.
- Rewrote both CLIs' `init` commands to skip the `_integrations/` payload prefix when producing the base tree, apply `stripIntegrations` to every `.md` file, then copy each active integration's file tree from `_integrations/<name>/` into the project root. The snapshot in `.spec-init/base/` still receives the full raw payload (including `_integrations/`) so `upgrade` and `customize` can re-derive.
- Rewrote both CLIs' `customize` commands (removing the old `flipIntegration()` code path entirely). `--add` / `--remove` load `.spec-init/meta.json`, compute the next active set, re-derive **only** files whose snapshot content contains `<!-- integration:<target> -->` (with the new active set + current persona), and either copy the `_integrations/<target>/` file tree into the project or delete it and prune emptied directories. `--persona` re-derives only files containing `<!-- persona:` (currently `CLAUDE.md`).
- Extended `.markdownlint.jsonc` with `MD003: false` and `MD022: false` because both rules misread the `---` fence line right below `tags:` as a setext H2. Alternatives (per-file HTML disable directives) required threading their removal through strip - the config flip was less invasive.
- Wrote `tests/integrations.test.ts` (Stage 8 acceptance: three toggle-roundtrip cases + external-link check), `tests/integrations-parity.test.ts` (TS ↔ mjs strip parity across four fixture files × four active sets = 16 cases), and `packages/cli-python/tests/test_integrations.py` (Python ↔ mjs parity + a Python-CLI-driven roundtrip + meta.json state assertion). Rewrote `tests/customize.test.ts` for the marker-based flow. Extended `tests/init.test.ts` with integrations-on / integrations-off assertions on file trees and front-matter placement. Extended `tests/cli-parity.test.ts` to do full-tree byte parity across CLIs when integrations are on.
- Regenerated persona snapshots (`tests/stage2/__snapshots__/personas.test.ts.snap`) because the CLAUDE.md §8 rewrite changed the persona strip output.
- Rebuilt Node CLI (`npm run build -w packages/cli-node`) and refreshed both Python payload copies via `cp -R`. `tools/check-payload-parity.mjs` exits 0 with 33 files matching SHA-256 (up from 31 in Stage 7).
- Full Vitest suite: 149 passed / 1 skipped / 0 failed. ESLint on `packages/cli-node/src` clean. Python tests not run locally (`uv` not installed on the dev machine); ad-hoc Python ↔ mjs parity check on `templates/claude/srs.md` matches for all four active sets. Python `py_compile` on all changed files exits clean.

**Files touched:**

- `templates/CLAUDE.md` - update - §8 checkbox lines wrapped in integration:graphify / integration:obsidian fences.
- `templates/README.md` - update - `### Graphify` / `### Obsidian` sub-sections wrapped in integration fences.
- `templates/claude/{srs,plan,context,features,learnings,design-decisions}.md` - update - obsidian-fenced YAML front-matter prepended with inner prettier-ignore fences.
- `templates/design/design.md` - update - obsidian-fenced YAML front-matter prepended.
- `templates/_integrations/graphify/.graphify/config.yml` - create - Graphify integration config.
- `templates/_integrations/obsidian/.obsidian/workspace.json` - create - Obsidian workspace layout.
- `tools/strip-integrations.mjs` - create - integration-marker strip utility (stdlib).
- `packages/cli-node/src/integrations.ts` - create - TS port of stripIntegrations().
- `packages/cli-python/src/spec_init/integrations.py` - create - Python port of stripIntegrations().
- `packages/cli-node/src/commands/init.ts` - update - skip `_integrations/`, apply stripIntegrations to every .md, copy per-integration file trees for active names. Removed `flipIntegration()`.
- `packages/cli-node/src/commands/customize.ts` - rewrite - snapshot-driven re-derive by marker match; add/remove copy or delete integration file trees; prune emptied directories.
- `packages/cli-python/src/spec_init/commands/init.py` - update - Python mirror of the Node init changes.
- `packages/cli-python/src/spec_init/commands/customize.py` - rewrite - Python mirror of the Node customize rewrite.
- `.markdownlint.jsonc` - update - disabled MD003 and MD022 so the YAML front-matter fence isn't misread as a setext H2.
- `tests/integrations.test.ts` - create - Stage 8 toggle-roundtrip acceptance.
- `tests/integrations-parity.test.ts` - create - TS ↔ mjs strip parity across four fixtures × four active sets.
- `tests/customize.test.ts` - rewrite - assertions against the new marker-based flow.
- `tests/init.test.ts` - update - integrations-on / integrations-off tree assertions + front-matter placement check.
- `tests/cli-parity.test.ts` - update - full-tree byte parity across CLIs when integrations are on.
- `packages/cli-python/tests/test_integrations.py` - create - Python ↔ mjs parity + Python-CLI roundtrip.
- `tests/stage2/__snapshots__/personas.test.ts.snap` - update - regenerated snapshots after CLAUDE.md §8 rewrite.
- `packages/cli-node/dist/**` and both Python payload copies - update - copy-in-place refresh; parity script exits 0 (33 files).
- `claude/plan.md` - update - Stage 8 checkbox to [x].

**Decisions made:**

- **Marker fences over a template engine.** The Stage 2 persona pattern generalizes: `<!-- integration:NAME -->` ... `<!-- /integration:NAME -->` is zero-dep, grep-friendly, renders as nothing in any markdown viewer, and lets a single source-of-truth template file describe both the on-state and the off-state.
- **Per-integration payload subtree.** `templates/_integrations/<name>/` keeps the unified `templates/` source-of-truth intact while giving init/customize a bounded list of files to copy or delete. `walkPayload()` filters by prefix; no new build wiring, no new parity edge cases.
- **Snapshot-driven re-derive on customize.** Adding an integration post-init requires content the project's live files no longer have (the marker fences were consumed at init time). The `.spec-init/base/` snapshot already exists to support `upgrade`; reusing it for `customize` avoids new on-disk state.
- **Surgical re-derive by marker match.** Rather than blanket-overwriting every templated file on customize, both CLIs scan the snapshot for files containing `<!-- integration:<target> -->` (or `<!-- persona:` for --persona) and only rewrite those. Preserves user edits to memory files that don't host the marker.
- **`<!-- prettier-ignore-start/-end -->` inside each obsidian block.** Prettier reformats standalone `---` into a thematic break with blank lines around, which breaks Obsidian's line-1 front-matter requirement. Prettier-ignore keeps the template lint-clean; the strip utility drops the helper comments so scaffolded output has YAML on line 1.
- **Markdownlint MD003 + MD022 turned off (not per-block disable).** Both rules misread the `---` fence line right below `tags:` as a setext H2. Disabling globally is one edit vs threading `<!-- markdownlint-disable -->` / `<!-- markdownlint-enable -->` (plus stripping their comments) through every affected file.
- **`flipIntegration()` deleted, not deprecated.** The old checkbox-flipper is fundamentally incompatible with the marker-fence model (there are no `- [ ]` lines to flip anymore - an inactive integration produces no content at all). Keeping it around as a no-op would confuse future readers.
- **Three-implementation parity, matching persona.** `tools/strip-integrations.mjs` is the reference; the TS and Python ports are byte-parity-tested against it. Same pattern as persona; four implementations would be the break-even point for extracting a shared spec.

**Open questions / follow-ups:**

- `uv` is not installed on this dev machine, so the Python pytest suite for Stage 8 was not run locally. Ad-hoc Python ↔ mjs strip parity confirmed on `srs.md`; full suite runs at CI/Stage 10.
- `spec-init doctor` does not yet cross-check `meta.json.integrations` against on-disk artifacts (e.g. verify `.graphify/config.yml` exists iff `graphify` is in meta). Optional Stage 10 polish.
- Customize's snapshot-driven re-derive will replay CLAUDE.md §8 and README.md's Integrations section from the snapshot - user edits to those sections after init are lost when toggling. This is the same trade-off `--persona` has always had for CLAUDE.md; document it in the website's Customization Recipes (Stage 9) so users know to make integration decisions before manually editing those files.
- The `_integrations/` payload prefix is a naming convention. If more optional payloads appear (e.g. Stage 10 might add a `.claude/refactor-audits/` placeholder), consider hoisting the "conditional payload subtree" idea into a formal manifest instead of relying on the prefix.

---

## 2026-07-08 - Stage 9: Companion Website

**Prompt / trigger:** `/feature-dev` for Stage 9 (plan.md).

**What was done:**

- Stood up the Throughspec companion site under `website/` as a Next.js 15 App Router project with `output: 'export'` (fully static HTML/CSS/JS - no server runtime). Uses Tailwind CSS 3 for utilities, self-hosted `@fontsource/source-serif-4` + `@fontsource/jetbrains-mono` for typography, and Pagefind for client-side search over the built HTML.
- Ported all eleven `design/*.dc.html` mocks to production pages, keeping the pixel-level layout, colors, and animations while replacing every inline `style` attribute with Tailwind utility classes or a scoped CSS module. Landing page includes the full animated Spec-Engine SVG (cogs, pistons, scanner, stamp press, gearbox, build drum, conveyor with running token squares, PSI gauge with swinging needle, steam plumes, mint tick lights) plus a 6-phase auto-cycler and IntersectionObserver-driven reveal animation. 404 uses its own broken-throughline SVG and a one-shot `rise` stagger.
- Built the 7 SRS §7.3 sections (Install, Quickstart, Workflows, Design Prompt Library, Learning Map, Customization Recipes) as real prose grounded in the SRS + skills we shipped in Stages 3-8; Changelog is a top-level page that parses `../CHANGELOG.md` at build time via a server-only reader in `lib/changelog.ts`.
- Docs shell (`components/docs/DocLayout.tsx`) unifies sidebar + breadcrumb + content column + on-page TOC + prev/next navigation. All docs content lives as typed `DocBlock[]` in `lib/docs-content.ts`; each `app/docs/*/page.tsx` is a thin two-line wrapper (`<DocLayout page={PAGES[key]} />`). `DocBlocks.tsx` renders seven block variants (h2, p, code, callout, list, defs, steps) with tone-mapped callout backgrounds (note = cloud, tip = mint-soft, warn = peach).
- Search is a lazy-loaded client component (`components/Search.tsx`) with a Tailwind-styled modal, `⌘K` binding, and dynamic `import('/pagefind/pagefind.js')` so the ~40 KB Pagefind runtime only loads when the modal opens. `scripts/build-search.mjs` runs Pagefind after `next build` (16 pages, 1,151 words indexed).
- Wired Playwright: `e2e/smoke.spec.ts` walks all 14 top-level routes plus the 404 asserting 200 + heading text; `e2e/links.spec.ts` crawls every route, collects every same-origin `href`, and asserts each resolves via `request` HEAD. `playwright.config.ts` spins up `serve out -p 4173` automatically so tests run against the static export.
- Root `package.json` now declares `website` as a second workspace and exposes `dev:site` / `build:site` / `test:site` scripts; `vercel.json` in the website workspace points Vercel at `npm run build` and serves `out/`.
- Verified: `next build` produces 17 static routes cleanly, `tsc --noEmit` passes, `scripts/build-search.mjs` writes `out/pagefind/` (fragment, index, pagefind-ui.js, etc.), and the total static export sits at 3.3 MB.

**Files touched:**

- `website/package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`, `vercel.json`, `README.md` - create - project scaffold and deploy config.
- `website/app/layout.tsx`, `fonts.ts`, `globals.css` - create - root layout, self-hosted font loader, Tailwind directives + 15 keyframe animations extracted from the mocks + `.reveal` staggered utilities.
- `website/app/page.tsx` - create - Landing page (hero, DataFlowSVG, personas, three beliefs, initiation steps, PhaseCycler, memory-layer card, skills grid, integrations, FAQ, final CTA).
- `website/app/why/page.tsx`, `features/page.tsx`, `about/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `changelog/page.tsx`, `not-found.tsx` - create - marketing + legal + 404 pages.
- `website/app/docs/page.tsx`, `install/`, `quickstart/`, `workflows/`, `design-prompt-library/`, `learning-map/`, `customization-recipes/` - create - thin per-route wrappers delegating to `<DocLayout>`.
- `website/components/BrandMark.tsx`, `AnnounceBar.tsx`, `Nav.tsx`, `Footer.tsx`, `RevealOnScroll.tsx`, `Search.tsx` - create - shared layout components.
- `website/components/landing/DataFlowSVG.tsx`, `PhaseCycler.tsx`, `NotFoundSVG.tsx`, `landing.module.css` - create - landing hero + 404 SVG animations.
- `website/components/docs/DocLayout.tsx`, `DocBlocks.tsx` - create - docs shell + block renderer.
- `website/lib/docs-content.ts`, `changelog.ts` - create - typed docs content model + build-time CHANGELOG parser.
- `website/scripts/build-search.mjs` - create - post-build Pagefind indexer.
- `website/e2e/smoke.spec.ts`, `links.spec.ts`, `playwright.config.ts` - create - e2e coverage.
- `package.json` (root) - update - added `website` to workspaces + three helper scripts.

**Decisions made:**

- **Next.js 15 App Router with `output: 'export'`.** User picked Next over Astro during Phase 3. Static export gives us the zero-cost, zero-server deployment target (Vercel free tier) while keeping App Router ergonomics for server components (docs shell + changelog parser render server-side; only Nav, AnnounceBar, RevealOnScroll, PhaseCycler, and Search are client components).
- **Pixel-faithful design port via Tailwind utilities + CSS modules; zero `style={…}` in JSX.** User asked for a 100% replica of the design mocks; CLAUDE.md §8 forbids inline CSS. Reconciled by mapping every design token to Tailwind's `theme.extend` (custom color names, letter-spacing, radius, max-width) and putting the animation shorthands that Tailwind can't express into `landing.module.css` and `globals.css` keyframes. `text-[74px]` / `px-[26px]` / `rounded-[40px]` arbitrary values cover the pixel values that don't fit the scale.
- **Docs content as typed data, not MDX.** `lib/docs-content.ts` exports `PAGES: Record<slug, DocPage>` + `GROUPS: DocGroup[]`. Sidebar order, prev/next navigation, on-page TOC, and page bodies all derive from one source and can't drift out of sync. Trade-off: no ad-hoc Markdown-in-content, but adding a page = one entry in `GROUPS` + one in `PAGES` + a two-line `page.tsx`.
- **Self-hosted fonts via `@fontsource/*`.** User approved during Phase 3. No third-party CDN, no privacy leak, no runtime dependency on Google Fonts; the WOFF2 assets ship in the npm install and load from the same origin as the HTML.
- **Pagefind for search.** Zero-cost, no backend, index built at deploy time. Ships as a small static bundle in `out/pagefind/`; the modal lazy-imports the runtime on first `⌘K` so docs pages stay JS-light for Lighthouse.
- **Nav is a client component; everything else that can be server-rendered, is.** `usePathname()` powers the active-link highlight without prop-drilling. Landing hero, marketing pages, docs pages, and changelog all render server-side.
- **Server-only CHANGELOG parsing.** `lib/changelog.ts` uses `node:fs` to read `../CHANGELOG.md` at RSC render time. The file never ships to the client; the rendered releases become part of the static HTML.
- **JSDoc `/** */` blocks are dangerous around paths.** Learned via a failed build: `/docs/*/page.tsx` inside a JSDoc closed the comment early. Line comments (`//`) are safer for annotating file paths.
- **Site map = design mocks + SRS §7.3.** Landing, Why, Features, About, Privacy, Terms, 404, Changelog come from `design/*.dc.html`. The 7 SRS §7.3 sections live under `/docs/*`, which uses the `Docs.dc.html` shell. Changelog serves double duty (top-level marketing page AND SRS §7.3 Changelog).

**Open questions / follow-ups:**

- Lighthouse ≥90 Performance / ≥95 Accessibility targets from Stage 9 acceptance are unverified locally - Lighthouse doesn't run in this sandbox. Given zero-JS-by-default server components, self-hosted fonts, no unoptimized images, and Tailwind's tree-shaken CSS, the targets should hit on the deployed URL; verify as part of Stage 10.
- Playwright smoke + link suites are wired but not executed here (would need `playwright install chromium` in CI). `next build` and `tsc --noEmit` both pass clean.
- Vercel deploy not exercised. `vercel.json` declares the config; Stage 10 should publish once and confirm the stable URL + build time (<2 minutes was the plan's target).
- `PhaseCycler` uses a `setInterval`; `RevealOnScroll` and `Search` respect `prefers-reduced-motion`, but `PhaseCycler` bails out entirely on reduced-motion - the six cards then all sit in their idle state. Consider a static "first card highlighted" fallback if that's too flat.
- Search relies on Pagefind's `pagefind.js` living at `/pagefind/pagefind.js` in the deployed site. Local `next dev` won't have it (Pagefind only runs post-build); the modal's soft-fail returns no results in dev. Stage 10 should add a dev-mode notice or wire Pagefind to also run against `.next/`.
- `lib/changelog.ts` uses `resolve(process.cwd(), '..', 'CHANGELOG.md')` - works from `website/` and from repo root. If someone runs `next build` from an unexpected working directory the path would miss; the acceptance test in `e2e/smoke.spec.ts` catches this indirectly (Changelog page 200 check).

---

## 2026-07-08 - Stage 9 follow-on: framer-motion + CopyableCommand + Hire page + SEO

**Prompt / trigger:** `/feature-dev` follow-on batch on Stage 9 - 8 requested features on the shipped website.

**What was done:**

- Added `framer-motion` (MIT) as the only new runtime dep. Built `components/motion/FadeIn.tsx` - single `whileInView` + `viewport={{ once: true }}` component with `delay` / `y` / `duration` / `as` props. Replaces the `.reveal` / `.revealed` IntersectionObserver flow site-wide.
- Deleted `components/RevealOnScroll.tsx` and the `.reveal` CSS block from `app/globals.css`. Kept the landing-page keyframes (`flow`, `glowPulse`, etc.) - SVG diagrams still use them via `landing.module.css`. Kept `rise` for the 404 stagger.
- Swept every marketing/docs/changelog page swapping `<div className="reveal ...">` for `<FadeIn>`: `app/page.tsx`, `app/why/page.tsx`, `app/features/page.tsx`, `app/about/page.tsx`, `app/changelog/page.tsx`.
- Built `components/CopyableCommand.tsx` - client component that renders a `<code>`-style button with a hover overlay (centered copy icon, 60% opacity) and pops a framer-motion `AnimatePresence` toast ("Copied to clipboard") right below the trigger, auto-dismissing at 3 s. Uses `navigator.clipboard.writeText` with a `document.execCommand('copy')` fallback for older browsers. Supports `tone="dark"` for the final CTA on the dark card.
- Swapped every command surface site-wide to `CopyableCommand`: landing hero pill, landing initiation-steps codes, landing integrations flags, landing final-CTA npm + pipx pills, `Footer.tsx` npm + pipx pills, `components/docs/DocBlocks.tsx` `code` block variant (retains the outer white box, wraps the `<pre>` in the copy overlay).
- New page at `app/hire-the-developer/page.tsx` - hero (open-to-work pill · US & Europe), maintainer narrative, six-skill grid (Spec-Driven Development / Full-stack Next.js · TypeScript / RAG & GenAI / Multi-provider LLM systems / Security & GDPR-by-design / Postgres), portfolio cards (VAi, Throughspec), dark CTA with GitHub / LinkedIn / email links.
- Added a "Maintainer" section to `app/about/page.tsx` linking to `/hire-the-developer/`.
- Added `Upcoming Features` section to `app/changelog/page.tsx` above the shipped releases: in-development items (Stage 10 CI matrix, v1.0 npm+PyPI publish, 90-min acceptance run), planned v1.1 items, under-consideration items. Shipped releases still parsed from `../CHANGELOG.md` via `lib/changelog.ts`.
- SEO pass on `app/layout.tsx`: enriched root metadata with keywords, author, `alternates.canonical`, `openGraph` (siteName, locale), `twitter` summary_large_image, `robots.googleBot`. Added `description` to per-page metadata on why / features / about / changelog / hire.
- File-based icons: `app/icon.tsx` (32×32) and `app/apple-icon.tsx` (180×180) rendering the BrandMark shape via `next/og` ImageResponse. `app/opengraph-image.tsx` (1200×630) shows brand mark + SPEC-DRIVEN badge + hero copy + npm/pipx pills. All three carry `export const dynamic = 'force-static'` (required by `output: 'export'`).
- `app/sitemap.ts` enumerates all 15 real routes with weekly cadence on `/docs/*` and monthly elsewhere. `app/robots.ts` allows all + points at the sitemap. Both marked `force-static`.
- Build verified: `next build` produces 23 static routes clean (up from 17 - added /hire-the-developer, /icon, /apple-icon, /opengraph-image, /robots.txt, /sitemap.xml). `tsc --noEmit` passes. Pagefind indexes 17 pages / 1,289 words (up from 16 / 1,151).

**Files touched:**

- `website/package.json` - update - added `framer-motion ^11.11.17`.
- `website/components/motion/FadeIn.tsx` - create - framer-motion scroll-reveal wrapper.
- `website/components/CopyableCommand.tsx` - create - hover copy target + toast.
- `website/components/RevealOnScroll.tsx` - delete - replaced by FadeIn.
- `website/app/globals.css` - update - removed `.reveal` / `.revealed` / `.d-*` block; kept keyframes and `rise` utility.
- `website/app/page.tsx` - update - full sweep from `.reveal` to `<FadeIn>`; landing hero + initiation steps + final CTA use `<CopyableCommand>`.
- `website/app/why/page.tsx`, `features/page.tsx`, `about/page.tsx`, `changelog/page.tsx` - update - `.reveal` → `<FadeIn>`; description metadata added.
- `website/app/about/page.tsx` - update - new "Maintainer" section + `/hire-the-developer/` link.
- `website/app/changelog/page.tsx` - update - "Upcoming Features" section above releases; three groups (in development / planned v1.1 / under consideration).
- `website/app/hire-the-developer/page.tsx` - create - hire-me page (hero, narrative, skills grid, portfolio cards, dark CTA).
- `website/components/Footer.tsx` - update - swapped npm + pipx `<code>` pills to `<CopyableCommand>`.
- `website/components/docs/DocBlocks.tsx` - update - `code` block variant now wraps its `<pre>` in `<CopyableCommand>` so every docs code snippet is copyable.
- `website/app/layout.tsx` - update - enriched root metadata (keywords, canonical, openGraph, twitter, googleBot).
- `website/app/icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx` - create - file-based icons + OG card via ImageResponse; all marked `force-static`.
- `website/app/sitemap.ts`, `robots.ts` - create - MetadataRoute sitemap + robots; both marked `force-static`.

**Decisions made:**

- **framer-motion over hand-rolled IntersectionObserver.** Deliberate trade of ~30 kB gz client JS for cleaner ergonomics (`<FadeIn delay={0.05}>` beats CSS-class stagger + observer wiring). User requested framer explicitly. Reduced-motion respected by framer defaults.
- **`.reveal` CSS deleted, not archived.** Once the sweep landed, keeping the old class around would just be dead code with silent conflict potential (both systems fighting over opacity). Kept only the SVG keyframes because `landing.module.css` still references them.
- **CopyableCommand wraps the existing markup rather than replacing it.** DocBlocks' `code` block keeps its outer white box + border; CopyableCommand adds the hover overlay + toast inside. Landing / footer flip from `<code>` to `<CopyableCommand>` entirely because those were single-line snippets with no inner structure worth preserving.
- **Toast lives inside CopyableCommand.** Considered a portal-based site-wide toast layer; rejected because the copy interaction is bounded to one trigger and framer's `AnimatePresence` handles the enter/exit cleanly. Simpler than the alternative, ships less JS.
- **Hire route named `/hire-the-developer/`, not `/hire/`.** Footer + About consistently link here; matches the deliberate footer copy already in place ("Hire the Developer").
- **File-based icons via ImageResponse.** Zero binary assets in the repo. All three icons + OG card generate at build time using the BrandMark SVG. Every one needs `export const dynamic = 'force-static'` because `output: 'export'` refuses dynamic route handlers.
- **`Upcoming Features` section is data-driven, not parsed from CHANGELOG.md.** CHANGELOG follows Keep-a-Changelog for shipped releases; upcoming items belong to project state not release history. Keeping them separate avoids polluting the release file.
- **SEO: fields, not JSON-LD.** Enriched `metadata` covers OG / Twitter / robots / canonical. Left structured data (Article / BreadcrumbList) unshipped - marginal Lighthouse gain, not currently justified. Sitemap + robots + descriptions are the load-bearing SEO win.

**Open questions / follow-ups:**

- Framer-motion adds ~30 kB gz to the shared JS budget - previously docs pages were near-zero. Lighthouse re-check needed at Stage 10 to confirm ≥ 90 Performance still holds.
- OG image `@fontsource/*` fonts NOT used by Satori (needs explicit `fonts` array in ImageResponse). Currently uses system serif fallback - fine for /og but not brand-perfect. Consider passing WOFF2 bytes if brand fidelity matters more.
- Hire page portfolio links are hardcoded GitHub / LinkedIn URLs. Move to a `content/hire.ts` if the CV / links start changing frequently.
- `CopyableCommand` fallback uses `document.execCommand('copy')` which is deprecated but still works in every current browser. If deprecated in future, switch to an inline `<textarea>` selection with keyboard-shortcut hint.
- Playwright smoke suite still passes route-level; toast + copy interactions are not covered. Add hover + click assertions in `e2e/copy.spec.ts` if regressions surface.

---

## 2026-07-08 - Stage 10: Cross-Platform Verification & v1.0.0 Release infrastructure

**Prompt / trigger:** `/feature-dev` for Stage 10 (plan.md).

**What was done:**

- Bumped both CLIs from `0.1.0-alpha` to `1.0.0`. `packages/cli-node/package.json`, `packages/cli-python/pyproject.toml` (also flipped trove classifier to `Development Status :: 5 - Production/Stable`), and `packages/cli-python/src/spec_init/__init__.py` version constant.
- Wrote the release entry in `CHANGELOG.md`: replaced `[Unreleased]` with `[1.0.0] - 2026-07-08` covering shipped features (nine skills, seven agents, memory layer, feature cycle, diff-scoped refactor, bug + docs workflows, three-way upgrade, integrations, website, single-payload parity), a `Changed` line for the version bump, migration notes (first stable release; alpha users upgrade via three-way merge), a distribution block naming the two channels + website + MIT license, and a `Verification` block naming the CI matrix + post-publish smoke. Fresh `[Unreleased]` placeholder above.
- Shipped the CI matrix workflow at `.github/workflows/ci.yml`. Four jobs: `node-tests` (3 OS × Node 18/20 = 6 cells, builds Node CLI + Vitest + payload parity), `python-tests` (3 OS × Python 3.10/3.11/3.12 = 9 cells, `uv sync` + `pytest`), `cross-lang-parity` (both runtimes on the same box, runs `tests/cli-parity.test.ts`), and `acceptance-verify` (depends on the first three, runs `tools/verify-acceptance.mjs`). Fail-fast off so one cell does not mask another. Concurrency group cancels stale runs per branch.
- Shipped tag-triggered publish workflows. `publish-npm.yml` verifies the `v*` tag matches `packages/cli-node/package.json` version, then `npm publish --workspace packages/cli-node --provenance --access public` under `id-token: write` so consumers can verify the artifact's origin. `publish-pypi.yml` mirrors the shape - `uv build` + `uv publish` with OIDC trusted-publisher (auto-detected in Actions with `id-token: write`), falling back to `PYPI_TOKEN` if that secret is set. Both workflows run in gated environments (`npm-publish`, `pypi-publish`).
- Shipped `post-publish-smoke.yml` for the post-release channel. Triggered on `release: published` or manual dispatch with a version input. Two jobs: `npm-smoke` runs `npx spec-init@<v> init throughspec-smoke && doctor` on 3 OS; `pypi-smoke` runs `pipx install spec-init==<v>` then the same scaffold + doctor on 3 OS × Python 3.10/3.12. Catches "the registry served a broken artifact" without waiting for users.
- Shipped `website.yml`. Path-filtered on `website/**`, `design/**`, `CHANGELOG.md`. Builds the site (which re-generates the Pagefind index), installs Chromium via `test:e2e:install`, runs Playwright smoke + link tests, uploads the report artifact on failure. Vercel handles the deploy separately.
- Wrote `tools/verify-acceptance.mjs` - the SRS §9 programmatic gate. Seven checks: payload parity, Node CLI build, all 9 skills + 7 agents present in the template payload, NFR-PERF-02 token budget, full Vitest, template lint pass on a fresh copy, integration toggle roundtrip. Colored `[OK]` / `[FAIL]` per line, `exit 1` on any failure. Prints the three human-only §9 items (90-min walkthrough, cycle-5 token budget, live Lighthouse) with pointers to the runbook. Uses `fileURLToPath` + `dirname` for the REPO path so Windows drive letters resolve correctly.
- Wrote `tests/acceptance/runbook.md` - eight sections covering pre-flight, install-from-local-build, scaffold+doctor per OS, integration roundtrip, 90-min LLM walkthrough, cycle-5 token budget, website verification, and publish + telemetry checks. Each item has a `[ ]` for the release manager and a note about the evidence to file.
- Wrote `claude/design-decisions.md` (new file) with the four SRS §11 open-question resolutions: `D-2026-07-08-01` (`/spec-sync` stays manual), `-02` (test runner stays stack-agnostic), `-03` (single template-version, no per-skill versioning), `-04` (single Obsidian vault, `learnings.md` stays alongside the other memory files). Each entry follows a fixed template (Question / Decision / Considered / Rationale) and includes that template at the bottom for future decisions.
- Trimmed `website/app/changelog/page.tsx`'s `UPCOMING` array. Dropped the "In development" group (its Stage-10 items are shipped in this session). "Planned - v1.1" now carries the deferred technical work (Student-persona detection, `.claude/config.yml`, customize/upgrade parity, editable-install refresh hook, `spec-init doctor` integration cross-check, independent skill versioning). "Under consideration" holds the three real open product questions from SRS §11 that are not just deferred technical work.
- Refreshed both Python payload copies, rebuilt the Node CLI, ran the full acceptance verifier locally: **7/7 passed**. Vitest: **149 passed / 1 skipped**. Payload parity: 33 files matching SHA-256.

**Files touched:**

- `packages/cli-node/package.json` - update - version `1.0.0`.
- `packages/cli-python/pyproject.toml` - update - version `1.0.0` + trove classifier `Development Status :: 5 - Production/Stable`.
- `packages/cli-python/src/spec_init/__init__.py` - update - `__version__ = "1.0.0"`.
- `CHANGELOG.md` - update - `[1.0.0] - 2026-07-08` release entry + fresh `[Unreleased]` placeholder.
- `.github/workflows/ci.yml` - create - 15-cell matrix + acceptance-verify job.
- `.github/workflows/publish-npm.yml` - create - tag-gated `npm publish --provenance`.
- `.github/workflows/publish-pypi.yml` - create - tag-gated `uv publish` (OIDC + token fallback).
- `.github/workflows/post-publish-smoke.yml` - create - install-from-registry smoke across 3 OS × 2 channels.
- `.github/workflows/website.yml` - create - website build + Playwright smoke + link tests.
- `tools/verify-acceptance.mjs` - create - seven-check SRS §9 aggregator (Windows-safe paths).
- `tests/acceptance/runbook.md` - create - human procedure for LLM-required + live-URL items.
- `claude/design-decisions.md` - create - SRS §11 resolutions D-2026-07-08-01..04 + entry template.
- `website/app/changelog/page.tsx` - update - `UPCOMING` array trimmed of shipped items; regrouped Planned / Under consideration.
- `claude/plan.md` - update - Stage 10 checkbox `[x]` with completion note.

**Decisions made:**

- **Publish infrastructure ships in v1.0.0; the actual tag push is a release-manager step, not a session artifact.** Infrastructure landing separately from the tag lets us iterate on the workflows without accidentally publishing broken bytes. First real publish is manual: `git tag v1.0.0 && git push origin v1.0.0`.
- **Tag verification before publish is a hard gate in both publish workflows.** Prevents the "tag one version, publish another" class of mistake that npm and PyPI cannot take back. If the tag does not match the file version, the workflow exits before touching the registry.
- **npm provenance on, PyPI trusted-publisher preferred.** Public repo → free provenance for npm. PyPI OIDC requires a one-time console-side setup after the first upload proves account ownership - `PYPI_TOKEN` fallback is left in place until the release manager configures it.
- **Fail-fast off in every matrix.** SRS §NFR-PORT-01 makes cross-platform a load-bearing invariant. If macOS Node 20 breaks but Ubuntu Python 3.11 also breaks, we want both signals in one CI run, not one at a time.
- **Payload refresh baked into every CI job that touches the payload.** `rm -rf packages/cli-python/{_payload,src/spec_init/_payload} && cp -R templates …` runs before parity checks and pytest. Alternative was to require the developer to keep them in sync locally; rejected because CI failing on stale local checkouts is a footgun the workflow can trivially prevent.
- **Human-only vs script-only split explicit.** SRS §9.4 (90-min walkthrough) and §9.5 cycle-5 token budget need a real Claude session and cannot run in CI. Instead of pretending they can, they live in `runbook.md` with explicit `[ ]` checkboxes and evidence requirements. Verifier prints them so the release manager sees them next to the passing programmatic checks.
- **Windows-safe path resolution in the verifier.** `new URL('..', import.meta.url).pathname` returns `/C:/…` on Windows and breaks `existsSync` + child-process cwd. `fileURLToPath` + `dirname` is the standard fix and required for the acceptance-verify job to run in the `windows-latest` matrix cell.
- **SRS §11 resolutions default to "manual / stack-agnostic / single-config" for v1.0.** Common thread: v1.0 keeps the least-magical, most-inspectable behavior; automation and per-project config layer on later once real users tell us where the friction is. Each resolution names its rejected alternatives so a v1.1 revisit inherits the constraint.

**Open questions / follow-ups:**

- PyPI trusted publisher setup is manual (console-side) - `PYPI_TOKEN` fallback is wired but the release manager should configure OIDC after the first successful publish so subsequent releases stop touching a long-lived secret.
- Windows minutes cost 2× Linux on GitHub Actions. Repo is expected to be public (unlimited minutes); if it goes private, `windows-latest` cells burn the free tier fast - consider running the Windows matrix only on `main` pushes and tag events.
- `spec-init doctor` still does not cross-check `.spec-init/meta.json` integrations against on-disk artifacts. Deferred to v1.1 (`Upcoming` on the website).
- `uv publish` OIDC detection depends on the action version and workflow trigger - if the trusted-publisher path ever silently falls back to the token, the release manager should notice from `npm/pypi provenance` badges on the published version.
- Post-publish smoke expects the new version to be resolvable via `npx spec-init@X` and `pipx install spec-init==X` within minutes of publish. If a registry propagation lag exceeds the workflow's default timeout, retry with `workflow_dispatch`.
- Live-URL Lighthouse (SRS §9.7 - Performance ≥ 90, Accessibility ≥ 95) is captured in `runbook.md` but not automated. Adding a Lighthouse CI job against the deployed Vercel URL is a v1.1 candidate.

---

## 2026-07-24 - Caveman integration + interactive integration picker

**Prompt / trigger:** `/feature-dev` then `/caveman` - add Caveman (https://github.com/JuliusBrussee/caveman) as a token-saving integration users can opt into at install time; then generalize the interactive offer so graphify/obsidian/caveman all get an in-terminal picker.

**What was done:**

- Added `caveman` as a third integration alongside `graphify`/`obsidian`. Because Caveman is an externally-installed agent skill (`npx skills add JuliusBrussee/caveman`), not a config file the project owns, its payload is one guidance doc plus marker blocks and a post-init install nudge - **no vendoring** of Caveman's code (honors §7 zero-cost and avoids version drift).
- Added an interactive integration picker to `init`: when run on a TTY with no explicit `--integrations`, it prompts `Integrations to include? 1) all 2) let me select 3) none`. "let me select" prints a numbered list; space/comma-separated numbers + Enter submit the subset. Gated off for dry-run, non-TTY (CI/tests), and explicit `--integrations`, so the existing spawn-based suite is unaffected. Chose a dependency-free numbered picker over a raw-mode checkbox TUI (would need ~150 lines/language, fragile cross-platform) - deliberate simplification.
- Prompt logic factored behind injectable deps (`isTty`/`ask`) so gating + selection parsing is unit-tested without a pty; the raw stdin read is thin glue.

**Files touched:**

- `packages/cli-node/src/args.ts`, `packages/cli-node/src/integrations.ts`, `tools/strip-integrations.mjs`, `packages/cli-python/src/spec_init/args.py`, `packages/cli-python/src/spec_init/integrations.py` - update - add `caveman` to every integration-name list / Literal / help text (the 5-spot parity surface).
- `templates/CLAUDE.md`, `templates/README.md` - update - new `<!-- integration:caveman -->` marker blocks (§8 + Integrations section).
- `templates/_integrations/caveman/claude/caveman.md` - create - guidance doc (install command, `/caveman` modes, session note); copied only when caveman active.
- `packages/cli-node/src/checklist.ts`, `packages/cli-python/src/spec_init/checklist.py` - update - accept `integrations`, print Caveman install nudge when active.
- `packages/cli-node/src/commands/init.ts`, `packages/cli-python/src/spec_init/commands/init.py` - update - `promptIntegrations`/`prompt_integrations` picker; effective (post-prompt) set drives strip/apply, `meta.json`, and checklist.
- `tests/integrations-parity.test.ts`, `tests/integrations.test.ts`, `packages/cli-python/tests/test_integrations.py`, `packages/cli-python/tests/test_init.py` - update - caveman parity sets, add/remove roundtrip, README-host assertion, picker gating tests.
- `tests/__snapshots__/personas.test.ts.snap` - update - CLAUDE.md gained the caveman block (regenerated via `vitest -u`).

**Decisions made:**

- Picker is numbered-list, dependency-free, synchronous - rejected raw-mode checkbox TUI and pulling `@inquirer`/`questionary` (§7 zero-cost, no-new-dep).
- Caveman is opt-in (off unless selected/named); not vendored - install nudged via checklist + README.
- Prompt gated on TTY + empty `--integrations` + not dry-run; explicit flags always win, keeping scripted/CI runs prompt-free.

**Open questions / follow-ups:**

- pytest not run in this environment (`uv` absent, system python 3.9 without pytest); Python verified via direct runtime import checks mirroring the pytest assertions. Run `uv run pytest` before merge.
- `spec-init doctor` cross-check of `meta.json` integrations vs on-disk artifacts should include `claude/caveman.md` (folds into the existing Stage 10 doctor TODO).
- If a real arrow/space checkbox TUI is later wanted, it needs a raw-mode helper per language - revisit the dependency tradeoff then.

---

## 2026-07-24 - Kit default: suggest a commit message each turn

**Prompt / trigger:** `/feature-dev` - add an instruction to the kit's CLAUDE.md so scaffolded projects get a short commit-message suggestion at the end of file-changing responses by default.

**What was done:**

- Added invariant **6. Suggest a commit.** to §2 of `templates/CLAUDE.md`: end any response that changed files with a Conventional Commits message (`<type>: <description>`, imperative subject <= 50 chars, `type` from the same set as CONTRIBUTING.md). Placed in §2 (the standing contract, unmarked prose) rather than §7 (reserved for the user's own rules) so it survives every persona strip and applies by default.
- No section renumbering - a new invariant inside the existing §2 list keeps `## 9. Quick links` (asserted by `tests/personas.test.ts`) and all section numbers stable.

**Files touched:**

- `templates/CLAUDE.md` - update - new §2 invariant 6.
- `tests/__snapshots__/personas.test.ts.snap` - update - all four persona snapshots gain the invariant line (regenerated via `vitest -u`).

**Decisions made:**

- Scoped to responses that changed files (not every turn) - a commit suggestion with nothing to commit is noise.
- Aligned wording to `templates/CONTRIBUTING.md` §Commit Messages so the kit stays internally consistent; references it instead of duplicating the full spec.

**Open questions / follow-ups:**

- If users want a suggestion on every turn regardless of file changes, widen the invariant wording - trivial one-line change.
- Consider whether `/spec-feature` and `/spec-bug` skills should emit the commit suggestion themselves (belt-and-suspenders) or rely solely on the CLAUDE.md contract.

---

## 2026-07-24 - Supporting-skills catalog (15 new skills) + spec/docs wiring

**Prompt / trigger:** `/feature-dev` - add ~22 requested skills to the kit (inspired by uploaded reference skills, not cloned), spec-driven and token-lean; user chose all-at-once, consolidate overlaps, and wire spec+docs.

**What was done:**

- Added **15 new supporting skills** under `templates/.claude/skills/`, consolidating the 22 requests: review family (code/pr/frontend/backend/comments) merged into `spec-review` (modes); db-review folded into `spec-db-design`; simplify folded into `spec-code-quality`; knowledge+market merged into `spec-research` (modes). Full list: spec-architect, spec-db-design, spec-review, spec-code-quality, spec-security, spec-performance, spec-test, spec-ux, spec-cicd, spec-launch, spec-git, spec-brainstorm, spec-suggest, spec-research, spec-resume.
- Each skill written in the kit's tight, FR-anchored voice (~90-140 dense lines): trigger-phrase frontmatter, "read first" from the memory layer, numbered workflow, refusal/guardrail clauses, writes findings/decisions back to memory, checklist, red flags. `spec-resume` uses an AliceBot-inspired file-based **resumption brief** at `claude/resume.md` (no DB - zero-cost).
- Wired the catalog: SRS §2.2.3, `templates/README.md` skills table, `templates/CLAUDE.md` §3 supporting-skills sub-table (inside §3, no renumber so the `## 9` snapshot anchor holds), and the website (`features/page.tsx` commands grid + a full "Supporting Skills" docs page/group in `lib/docs-content.ts`).

**Files touched:**

- `templates/.claude/skills/<15 names>/SKILL.md` - create - the new skills.
- `claude/srs-beta.md` - update - §2.2.3 supporting-skills table.
- `templates/README.md`, `templates/CLAUDE.md` - update - skill listings (CLAUDE.md §3 sub-table -> persona snapshot regen).
- `website/app/features/page.tsx` - update - 15 commands added to the grid.
- `website/lib/docs-content.ts` - update - new `supporting-skills` DocGroup + DocPage (full narrative).
- `tests/__snapshots__/personas.test.ts.snap` - update - CLAUDE.md §3 sub-table (regenerated).

**Decisions made:**

- Consolidated 22 -> 15 to avoid near-duplicate review skills; overlap-heavy requests became modes of one skill (`spec-review`, `spec-research`).
- New skills cite the memory layer and SDD principles but **not** invented FR-IDs (dangling refs would be dishonest); `skills.test.ts` validates only the named legacy skills, so new skills only had to pass markdownlint + prettier + parity.
- `spec-architect` is a skill distinct from the pre-existing `spec-architect` **agent** (agent proposes options in a dispatch; skill drives the interactive design + ADRs).

**Open questions / follow-ups:**

- SRS acceptance line "All 9 skills in §2.2.3" is now historical; the catalog is larger. Reconcile the acceptance count in a future SRS pass.
- No automated test asserts the new skills' shape - consider a generic "every skill dir has valid frontmatter + required sections" validator so future skills stay consistent.
- pytest still unrun locally (`uv` absent) - unaffected here (no Python source changed), but note it stays a standing gap.

---

## 2026-07-24 - agentmemory + openwiki integrations

**Prompt / trigger:** `/feature-dev` - add agentmemory (memory/context) and openwiki (agent documentation) as opt-in integrations, following the graphify/obsidian/caveman pattern.

**What was done:**

- Added `agentmemory` and `openwiki` as the 4th and 5th integrations. Both are externally-installed CLI tools (like caveman), so each ships a guidance doc + CLAUDE.md/README marker blocks + an entry in the 5 name-lists - no vendoring, no fabricated config file.
- `agentmemory` (rohitg00): persistent cross-session memory, local SQLite, MCP server on port 3111, installed via `npx @agentmemory/agentmemory` + `agentmemory connect claude-code`. Doc notes the zero-cost path (`EMBEDDING_PROVIDER=local`, reuse existing LLM key) and that it augments - does not replace - the memory-file layer.
- `openwiki` (langchain-ai): generates an agent-facing wiki into `openwiki/`, installed via `npm install -g openwiki`. Doc flags two gotchas: it writes prompting into the repo-root `CLAUDE.md`/`AGENTS.md` (could clobber the behavior contract - review the diff, commit first) and telemetry is on by default (`OPENWIKI_TELEMETRY_DISABLED=1`).

**Files touched:**

- `packages/cli-node/src/args.ts`, `packages/cli-node/src/integrations.ts`, `tools/strip-integrations.mjs`, `packages/cli-python/src/spec_init/args.py`, `packages/cli-python/src/spec_init/integrations.py` - update - add both names to every list/Literal/help text.
- `templates/CLAUDE.md` §8, `templates/README.md` - update - integration marker blocks (CLAUDE.md -> persona snapshot regen).
- `templates/_integrations/agentmemory/claude/agentmemory.md`, `templates/_integrations/openwiki/claude/openwiki.md` - create - guidance docs.
- `tests/integrations-parity.test.ts`, `tests/integrations.test.ts`, `packages/cli-python/tests/test_integrations.py` - update - parity sets, marker map, roundtrips, README-host assertions, and the Node `all`-picker test (hardcoded set -> now 5).
- `tests/__snapshots__/personas.test.ts.snap` - update - CLAUDE.md §8 grew.

**Decisions made:**

- Mirrored the caveman scope exactly (name-lists + template blocks + doc + tests); did not touch the interactive picker (enumerates `INTEGRATIONS` dynamically) or the Python prompt tests (reference `INTEGRATIONS` dynamically) - both auto-absorb new integrations. The one hardcoded spot was the Node `all`-picker assertion.
- Post-init checklist stays caveman-only; install steps for the new two live in the README blocks + docs.
- openwiki's CLAUDE.md-overwrite conflict is handled by documentation (review-the-diff guidance), not code - the scaffolder cannot police what an external tool writes.

**Open questions / follow-ups:**

- The `--integrations` help line now lists 5 names and is getting long; if a 6th arrives, consider pointing to docs instead of inlining the full list.
- Consider generalizing the post-init checklist to nudge external installs for any active integration (agentmemory/openwiki also need a one-time install), instead of the caveman special-case.

---

## 2026-07-24 - ponytail integration (code-minimalism)

**Prompt / trigger:** `/feature-dev` - add ponytail (DietrichGebert/ponytail) as an integration for agent minimalism / workflow discipline.

**What was done:**

- Added `ponytail` as the 6th integration via the established external-tool pattern (name in 5 lists + CLAUDE.md/README blocks + guidance doc; no vendoring). ponytail is a Claude Code plugin installed via `/plugin marketplace add DietrichGebert/ponytail` then `/plugin install ponytail@ponytail` (two separate prompts).
- Framed it honestly as a **code-minimalism discipline** (YAGNI ladder, shortest working diff, "lazy about the solution, never about reading"), not literal orchestration. Doc positions it as the code-generation-time complement to `/spec-refactor`, `/spec-code-quality`, `/spec-simplify`, and notes the SRS wins when scope and minimalism disagree.

**Files touched:**

- `packages/cli-node/src/args.ts`, `packages/cli-node/src/integrations.ts`, `tools/strip-integrations.mjs`, `packages/cli-python/src/spec_init/args.py`, `packages/cli-python/src/spec_init/integrations.py` - update - add `ponytail` to every list/Literal/help text.
- `templates/CLAUDE.md` §8, `templates/README.md` - update - integration marker blocks (CLAUDE.md -> persona snapshot regen).
- `templates/_integrations/ponytail/claude/ponytail.md` - create - guidance doc.
- `tests/integrations-parity.test.ts`, `tests/integrations.test.ts`, `packages/cli-python/tests/test_integrations.py` - update - parity sets, marker map + roundtrip params, add/remove roundtrip, README-host assertion, and the Node `all`-picker test (hardcoded set -> now 6).
- `tests/__snapshots__/personas.test.ts.snap` - update.

**Decisions made:**

- Same caveman-pattern scope; picker + Python prompt tests untouched (dynamic over `INTEGRATIONS`). The only hardcoded spot remains the Node `all`-picker assertion (now 6).
- Kept the `--integrations` help line inline at 6 names but shortened the trailing hint to `(comma-separated)` to keep it readable; the "point to docs" idea stays a follow-up for a 7th.

**Open questions / follow-ups:**

- 6 integrations now: the earlier follow-up to move the help-text list to a docs pointer is now due if a 7th lands.
- Integrations catalog (graphify, obsidian, caveman, agentmemory, openwiki, ponytail) is not enumerated in SRS/website docs; if a per-integration catalog page is ever wanted, that is a separate docs task.

---

## 2026-07-24 - spec-init reinit (adopt Throughspec in an existing project)

**Prompt / trigger:** `/feature-dev` - add a `reinit` command for installing Throughspec into an already-existing project; it checks for existing spec files and lets the user keep them or create new ones.

**What was done:**

- Added `reinit` as a 6th CLI subcommand (`spec-init reinit [dir]`, default `.`). It adopts Throughspec **in place** in a brownfield repo: writes only the missing payload/spec files, **keeps** existing spec files by default (non-destructive), and writes the `.spec-init/base/` snapshot + `meta.json` so `upgrade` works afterward. Never touches non-template (source) files.
- Existing-file handling = a global binary: **keep** (default, safe) vs **replace**. `--force` = replace without asking; on a TTY with existing spec files it prompts `keep/replace`; non-interactive/dry-run defaults to keep. Guard: if `.spec-init/base` already exists, it refuses and points to `upgrade`/`customize`.
- Reused init's helpers rather than duplicating: exported `walkPayload`, `maybeTransform`, `readLineSync` from init.ts (and imported `_walk_payload`, `_maybe_transform`, `integration_files_for`, `prompt_integrations` in Python). Added a `verb` param to `postInitChecklist`/`post_init_checklist` so reinit reuses the whole next-steps/persona/caveman output with an "Initialized" header.

**Files touched:**

- `packages/cli-node/src/args.ts`, `packages/cli-python/src/spec_init/args.py` - update - `reinit` in `COMMANDS`/Literal + HELP_TEXT.
- `packages/cli-node/src/checklist.ts`, `packages/cli-python/src/spec_init/checklist.py` - update - optional `verb` param (default `Scaffolded`).
- `packages/cli-node/src/commands/init.ts` - update - export `walkPayload`, `maybeTransform`, `readLineSync` (no logic change).
- `packages/cli-node/src/commands/reinit.ts`, `packages/cli-python/src/spec_init/commands/reinit.py` - create - `run_reinit` + `resolve_reinit_mode`.
- `packages/cli-node/src/index.ts`, `packages/cli-python/src/spec_init/cli.py` - update - dispatch `reinit`.
- `tests/reinit.test.ts`, `packages/cli-python/tests/test_reinit.py` - create; `tests/cli.test.ts` - update (help-command loop).
- `claude/srs-beta.md` §2.2.1 (Commands + Idempotency rows), `README.md` ("Already have a project?"), `website/lib/docs-content.ts` (quickstart "Already have a project?" section).

**Decisions made:**

- Keep vs replace is a **global binary** (not per-file) - matches the user's "use them or create new ones" and stays simple; per-file granularity is a possible follow-up.
- `reinit` is a CLI subcommand (scaffolding is the CLI's job), not a Claude skill; positional `dir` is optional (`.`), unlike `init`'s required name.
- Reused init helpers via targeted exports instead of refactoring init or duplicating the walk/transform logic.

**Open questions / follow-ups:**

- pytest still not runnable locally (no `uv`; the CLI import chain needs `merge3`). Verified via Node vitest + calling `run_reinit`/`resolve_reinit_mode` directly under system Python 3.9. Run `uv run pytest` before merge.
- reinit keep-mode sets `.spec-init/base` = pristine payload while a kept file differs, so the first `upgrade` treats kept files as user edits (three-way merge, possible conflicts) - inherent to brownfield adoption; documented behavior, not a bug.
- Per-file keep/replace selection could be added later if the global binary proves too coarse.

---

## 2026-07-24 - spec.config.js (advisory, Claude-read project config)

**Prompt / trigger:** `/feature-dev` - add a `spec.config.js` in the scaffolded project holding all Throughspec config (skills, workflow, settings), easy to read and modify.

**What was done:**

- Added `templates/spec.config.js` - a top-level, comment-rich `module.exports` object with `skills.disabled[]`, `workflow.{phases, allowSkip}`, and `settings.{commitSuggestions, customInstructions[]}`. Ships in every scaffold (init/reinit copy it automatically; no CLI change needed).
- Added CLAUDE.md §2 invariant 7: read `spec.config.js` if present and honor it; the mandatory invariants (spec before code, memory sacred) still win. This makes **Claude the consumer** - the config is real in a Claude-driven kit without the CLI parsing it.
- Deliberately **advisory + Claude-read**, chosen over a CLI-consumed machine config: keeps the `.js` extension, avoids the dual-CLI parity problem (the Python CLI can't execute JS), and does not duplicate CLI-owned state. Persona/integrations stay in `.spec-init/meta.json` + CLAUDE.md §8, managed by `spec-init customize`; spec.config holds the user-facing knobs only.

**Files touched:**

- `templates/spec.config.js` - create - the config file.
- `templates/CLAUDE.md` §2 - update - invariant 7 (persona snapshot regen).
- `tests/init.test.ts` - update - `spec.config.js` in `REQUIRED` + a `require()` well-formedness test (exports skills/workflow/settings).
- `packages/cli-python/tests/test_init.py` - update - `spec.config.js` in `REQUIRED`.
- `tests/__snapshots__/personas.test.ts.snap` - update.
- `claude/srs-beta.md` §6.1 canonical tree, `README.md` (scaffold tree + note), `website/lib/docs-content.ts` (customization-recipes "Edit spec.config.js" section) - update.

**Decisions made:**

- Advisory `.js` read by Claude, not a CLI-parsed config - the CLI never touches it, so it cannot break a scaffold and stays cross-language safe. It is functional because CLAUDE.md instructs Claude to honor it every session.
- Not a `doctor` REQUIRED_FILE: it is advisory, and a project runs fine without it (Claude falls back to defaults), so health should not fail on its absence. init tests still assert init ships it.
- No duplication of persona/integrations - avoids a second source of truth that would drift from meta.json.

**Open questions / follow-ups:**

- `module.exports` is CJS; in a scaffolded project whose package.json is `"type":"module"`, the file is technically ESM-mismatched - but it is never executed (Claude reads it as text; the CLI never parses it), so this is cosmetic. The require-based test validates well-formedness in the no-package.json scaffold context.
- If users later want mechanical enforcement (e.g. actually removing disabled skills from `.claude/skills/`), that would need a CLI-consumed config in a cross-parseable format - a separate, larger change.
- pytest still not runnable locally (no `uv`); Python `REQUIRED` addition is covered by parity (both payloads ship spec.config.js -> 53 files) and the Node init test.

---

## 2026-07-25 - Interactive welcome TUI (bare `spec-init`, @clack/prompts, Node-only)

**Prompt / trigger:** `/feature-dev` - a Claude-style terminal UI shown when you run the tool bare, guiding first-time setup with a neat, non-plain interface.

**What was done:**

- Bare `spec-init` **on a TTY** now launches an interactive welcome built on `@clack/prompts` (rounded intro/outro, arrow-key select, space-toggle multiselect, spinner). Flow: detect already-managed -> else new-vs-current -> project name (new) -> persona -> integrations -> confirm -> scaffold -> next-steps note.
- **TTY-gated** via a pure `shouldLaunchWelcome(opts, isTty)`: non-TTY (CI, pipes, the test suite) keeps the prior help+exit-2 behavior, so no existing contract broke.
- The welcome owns all interaction and delegates writing to `runInit`/`runReinit` in a new **quiet** mode (skips their own prompts + summary prints), then renders next-steps via the reused `postInitChecklist` - single source of truth for scaffolding.
- **Node-only** (the `npx` channel); the Python CLI is unchanged. **One new dependency**: `@clack/prompts`, dynamic-imported only on the interactive path so normal commands never load it.

**Files touched:**

- `packages/cli-node/package.json` - update - add `@clack/prompts`.
- `packages/cli-node/src/commands/welcome.ts` - create - `runWelcome()` + pure `buildWelcomeOptions()`.
- `packages/cli-node/src/index.ts` - update - `main` is now async; exported pure `shouldLaunchWelcome`; dynamic-imports welcome on the TTY path; bin wrapper `main(...).then(process.exit)`.
- `packages/cli-node/src/commands/init.ts`, `reinit.ts` - update - `quiet` param (skip prompts + summary; caller owns I/O).
- `tests/cli.test.ts` - update - unit tests for `shouldLaunchWelcome` + `buildWelcomeOptions`.
- `README.md`, `website/lib/docs-content.ts` (quickstart), `claude/srs-beta.md` §2.2.1 (Interactive row) - update - document the welcome.

**Decisions made:**

- Chose `@clack/prompts` over a zero-dep numbered flow (genuine arrow-key polish, matches "not the normal terminal UI") and over Ink (too heavy). Node-only to avoid a second interactive surface drifting in Python.
- TTY gate is the whole safety mechanism: it preserves every non-interactive test/contract and means scripts/CI are unaffected.
- `quiet` on runInit/runReinit lets the TUI reuse the exact scaffolding + next-steps code instead of duplicating it; current-directory setup defaults to keep (non-destructive) - replacing stays an explicit `reinit --force`.

**Open questions / follow-ups:**

- The live @clack flow can't be auto-tested without a pseudo-terminal; covered by unit-testing the gate + option mapping and reusing `runInit`/`runReinit` tests. A pty-driven e2e is a future option.
- No payload/template change -> parity stays 53, no snapshot/token impact. `@clack` is a Node-CLI runtime dep (not payload), so it does not affect the byte-parity guarantee.

---

## 2026-07-25 - Spec-format, BDD, review, and guardrail conventions

**Prompt / trigger:** `/feature-dev` - tighten the kit toward faster, more token-efficient, more rigorously spec-driven output.

**What was done:**

- **Token-lean spec format (CLAUDE.md invariant 8):** narrative stays Markdown, but structured data - config and schemas nested > 3 levels - is rendered as flat fenced YAML. YAML parses more reliably and costs fewer tokens than deep JSON/prose, so specs are cheaper for Claude to read and act on every turn.
- **BDD acceptance scenarios:** `/spec-requirements` and the `srs.md` template now capture Given/When/Then (State -> Action -> Outcome) scenarios for each load-bearing FR, each requiring at least one edge/failure scenario, not just the happy path. These become the acceptance criteria `/spec-plan` stages against and the failing tests `/spec-feature` and `/spec-bug` write first. New `srs.md` section 5 "Acceptance Scenarios" (renumbered 5->10).
- **Guardrails (CLAUDE.md invariants 9-10):** pin every library version and verify against current docs (model version knowledge is stale by definition); never hardcode secrets/PII/live URLs into specs, prompts, or memory - reference env/config so an agent cannot reuse stray literals.
- **PR Risk & Impact section:** the PR template now asks for what changed / could break / security notes, so human review targets architecture and blast radius rather than line counts.

**Files touched:**

- `templates/CLAUDE.md` - update - §2 invariants 8, 9, 10 (persona snapshot regen).
- `templates/.claude/skills/spec-requirements/SKILL.md` - update - Acceptance Scenarios step + YAML-schema note + canonical section list (now 10; the 8 names `skills.test.ts` checks are unchanged).
- `templates/claude/srs.md` - update - new §5 Acceptance Scenarios (Gherkin) + YAML note under FRs; §5-9 renumbered to §6-10.
- `templates/.github/pull_request_template.md` - update - Risk & Impact block.

**Decisions made:**

- Kept all changes as scaffolded-project **conventions** (templates/skills/contract), not runtime code. Explicitly did **not** build policy servers, sandboxes, eval services, or MCP-server code - those are application runtime infrastructure, out of scope for a zero-cost scaffolding kit and against the simplicity/zero-cost constraints.
- Invariants added inside §2 (no new top-level section) so the `## 9 Quick links` snapshot anchor holds.
- SRS section renumber is safe: no test asserts section numbers; `skills.test.ts` matches section names.

**Open questions / follow-ups:**

- `/spec-plan` and `/spec-feature` could explicitly stage against the new Acceptance Scenarios (they reference them in prose now; a hard gate is a future option).
- The YAML-for-deep-nesting convention is guidance, not enforced; a lint that flags deep prose-nested config in specs could enforce it later.

---

## 2026-07-25 - Open Code Review integration (7th)

**Prompt / trigger:** `/feature-dev` - add alibaba/open-code-review as an integration.

**What was done:**

- Added `opencodereview` as the 7th integration via the established external-tool pattern (name in 5 lists + CLAUDE.md/README blocks + guidance doc; no vendoring). It is Alibaba's AI code-review CLI (`ocr`, Apache-2.0): `npm install -g @alibaba-group/open-code-review`, then `ocr review` / `ocr scan`. Positioned as the CLI/CI complement to the in-session `/spec-review` skill.
- **Naming:** the repo is `open-code-review` (hyphens), but integration keys must match the strip regex `[a-z]+`, so the key is `opencodereview` (display name "Open Code Review", CLI `ocr`).
- **Help text:** at 7 integrations, the `--integrations` help line no longer inlines the full CSV list (it grew unwieldy) - it now says "comma-separated integration names (see README for the full list)". The dynamic validation error still lists valid values, and the README/CLAUDE.md blocks enumerate them.
- **Zero-cost note:** doc + README highlight `ocr delegate preview`, which reuses the existing coding-agent LLM instead of a separate paid API key.

**Files touched:**

- `packages/cli-node/src/args.ts` (+ shortened HELP), `packages/cli-node/src/integrations.ts`, `tools/strip-integrations.mjs`, `packages/cli-python/src/spec_init/args.py` (+ shortened help), `packages/cli-python/src/spec_init/integrations.py` - update - add `opencodereview`.
- `templates/CLAUDE.md` §8, `templates/README.md` - update - integration blocks (CLAUDE.md -> persona snapshot regen).
- `templates/_integrations/opencodereview/claude/opencodereview.md` - create - guidance doc.
- `tests/integrations-parity.test.ts`, `tests/integrations.test.ts`, `packages/cli-python/tests/test_integrations.py` - update - parity sets, marker map + roundtrip params, add/remove roundtrip, README-host assertion, Node `all`-picker (now 7).
- `tests/__snapshots__/personas.test.ts.snap` - update.

**Decisions made:**

- Hyphenless key `opencodereview` to satisfy the `[a-z]+` marker regex without touching the strip parity surface.
- Shortened the `--integrations` help to a README pointer now that the list has grown; the follow-up flagged at 6 integrations is now resolved.

**Open questions / follow-ups:**

- Integration count is 7; the picker/welcome/prompt tests remain dynamic over `INTEGRATIONS` (only the Node `all`-picker assertion is hardcoded).
- If a per-integration catalog page is ever wanted in the website docs, that stays a separate task (integrations are not enumerated there).

---

## 2026-07-25 - Website: markdown changelog notes + copy-button tooltip

**Prompt / trigger:** `/feature-dev` - two UI updates: render changelog notes with markdown styling, and replace the copy button's click toast with a hover "Copy" / click "Copied" tooltip.

**What was done:**

- **Inline markdown in the changelog.** Changelog item strings were rendered as literal text (`<span>{it}</span>`), so `**bold**`, `` `code` ``, `_italic_`, `[text](url)` showed raw. Added a zero-dependency inline tokenizer + renderer and wired it into both the Upcoming and Shipped lists. No markdown lib was added - the site ships none by design, and a one-line-snippet tokenizer is far lighter than remark/rehype.
- **Copy-button tooltip.** Both copy components (`CopyableCommand` marketing hover-copy, `DocCodeBlock` docs button) showed a "Copied to clipboard" toast on click. Replaced it with a tooltip reading **Copy** on hover and **Copied** for ~1.8s after click, plus an `sr-only` `role="status"` live region and a dynamic `aria-label` for accessibility. Dropped the now-unused `framer-motion` import from both files (the dep stays; used elsewhere).

**Files touched:**

- `website/lib/inline-markdown.ts` - create - pure `parseInline(text): InlineToken[]` (code/link/bold/italic, matched in that priority).
- `website/components/InlineMarkdown.tsx` - create - server-safe renderer of the tokens to `<code>/<a>/<strong>/<em>`.
- `website/app/changelog/page.tsx` - update - render Upcoming + release items via `<InlineMarkdown>`.
- `website/components/CopyableCommand.tsx`, `website/components/docs/DocCodeBlock.tsx` - update - Copy/Copied tooltip; removed toast + framer-motion + native `title`.

**Decisions made:**

- Zero-dep inline tokenizer over a markdown library - consistent with the site's dep-light rendering and cheaper for short strings. Scope: inline `code`/bold/italic/links (the markdown CHANGELOG bullets actually use); fenced blocks are not used in bullets.
- Updated **both** copy components for consistent UX (they shared the same toast).
- Tooltip parser lives in `lib/` as a pure function (unit-checkable) separate from the JSX component.

**Open questions / follow-ups:**

- Playwright e2e could not run here (needs `chromium`); validated via `tsc`, a node sanity check of the tokenizer, and a successful `next build` (changelog renders server-side, components compile). The existing e2e only checks page load + heading, both unaffected.
- If changelog bullets ever need fenced code blocks or nested markdown, the tokenizer would need extending (currently single-level inline).

---

## 2026-07-25 - Landing: integrations grid, skills count/CTA, full skills docs page

**Prompt / trigger:** User request - surface the new integrations (with GitHub links) on the landing page; update the skills section to mention the count, show only 6, and add a "Check all skills" button to a full skills docs page.

**What was done:**

- **Landing integrations** (`website/app/page.tsx`): `INTEGRATIONS` grew 2 -> 7 (added caveman, agentmemory, openwiki, ponytail, Open Code Review), each with a glyph, one-line desc, `--integrations` flag, and a link (GitHub for the five new tools; product sites for Graphify/Obsidian). Each card renders a "{label} ↗" external link; added an "Integrations" eyebrow + heading.
- **Landing skills section**: heading now reads "Twenty-four skills…" (9 core + 15 supporting); renders only the first 6 core skills (`SKILLS.slice(0, 6)`); added a "Check all skills →" pill linking to `/docs/supporting-skills/`.
- **Full skills docs page** (`website/lib/docs-content.ts`): the `supporting-skills` page is now the complete catalog - retitled "Skills" (page + sidebar group, slug kept), intro updated to 24 total, and a new "Core workflow" section added at the top listing the 9 core skills with usecase/when; each `/command` term is the "how to use."
- **Fixed a pre-existing 404 (important):** the docs route is one directory per page (`app/docs/<slug>/page.tsx`), not a dynamic `[slug]`. When the `supporting-skills` page was added to `PAGES`/`GROUPS` earlier, the route file was never created, so `/docs/supporting-skills/` (and the sidebar link) 404'd on the static export. Created `website/app/docs/supporting-skills/page.tsx` and added the slug to the hand-maintained `sitemap.ts` ROUTES and `e2e/links.spec.ts` START_PATHS.

**Files touched:**

- `website/app/page.tsx` - update - integrations array + render (links, eyebrow); skills heading/slice/button.
- `website/lib/docs-content.ts` - update - `supporting-skills` page retitle + intro + Core-workflow section; GROUPS title "Supporting Skills" -> "Skills".
- `website/app/docs/supporting-skills/page.tsx` - create - the missing route file.
- `website/app/sitemap.ts`, `website/e2e/links.spec.ts` - update - add `/docs/supporting-skills/` to the enumerated route lists.

**Decisions made:**

- Skill count surfaced as **24** (9 core + 15 supporting); landing shows the first 6 core, button reveals the rest.
- "All skills" means the docs page now includes the core skills too (renamed "Skills"); slug stayed `supporting-skills` so the button URL is exact.

**Open questions / follow-ups:**

- The docs system requires a per-page route file **and** a PAGES/GROUPS entry - adding one without the other silently 404s on static export. A generated catch-all `[slug]` route (with `generateStaticParams` over PAGES) would remove this footgun; deferred.
- `sitemap.ts` ROUTES and `e2e/links.spec.ts` START_PATHS are hand-maintained copies of the docs slug set - candidates to derive from GROUPS later.

---

## 2026-07-26 - Comment cleanup (CLI source, tools, website)

**Prompt / trigger:** User request - tidy comments across the codebase: one line, <=15 words each; drop redundant/dead comments; add meaningful ones where missing.

**What was done:**

- Condensed multi-line file-header blocks and verbose inline comments to single <=15-word lines across `packages/cli-node/src/**`, `packages/cli-python/src/spec_init/**`, `tools/*.mjs`, and `website/{app,components,lib}/**`. Also condensed multi-line Python module docstrings and a few multi-line JSDoc blocks; single-line docstrings kept per the project convention.
- Removed nothing functional: no commented-out/dead code existed (the survey's one hit was a real why-comment).

**Scope + preservation (explicit):**

- **Excluded `templates/**` entirely** - its HTML-comment markers (`<!-- integration:x -->`, `<!-- persona:x -->`, prettier-ignore) are load-bearing for the strip machinery + parity, and its SKILL.md / spec.config.js comments are user-facing docs.
- **Excluded tests** (per the scope choice) - their header comments document each suite.
- **Preserved verbatim** all directive comments: `// @ts-expect-error` and `# type: ignore[...]`.

**Verification:** cli-node build (tsc) OK; payload parity 54/54; vitest 190 passed; website tsc + next build clean; all Python source AST-parses and the merge3-free modules import. Comments are non-functional, so builds/tests are the proof no directive comment was lost.

---

## 2026-07-26 - Docs expansion: 8 new pages, interactive cards/callouts, landing 4-card slice, search dev notice

**Prompt / trigger:** User request - build an Integrations docs page; landing shows only 4 integration cards + a centered "Check all integrations" button; make docs extensive/beginner-friendly; fix docs search; add more spec-driven-development knowledge; add a Help section (FAQ + Contact); make docs interactive with card/callout elements (per attached screenshots).

**What was done:**

- Extended the `DocBlock` union with a `cards` variant (`{ icon, title, desc, href? }[]`) and made the `callout` `label` optional, so callouts can be icon-only.
- Added `website/components/docs/DocIcon.tsx` - a zero-dep inline-SVG line-icon set (14 icons, `stroke=currentColor`) used by cards and callouts; unknown names fall back to a dot.
- Updated `DocBlocks.tsx`: callouts now render a variant icon (note->info, tip->lightbulb, warn->warning) plus optional label and `<InlineMarkdown>` body; added the `cards` renderer (2-col grid, optional `<a href>` with hover border).
- Restructured `GROUPS` into Get Started / Concepts / Skills / Integrations / Reference / Recipes / Help, and added 8 new pages to `PAGES`: `spec-driven-development`, `memory-layer`, `integrations`, `cli-reference`, `glossary`, `faq`, `troubleshooting`, `contact-us` (rich blocks: cards, callouts, steps, defs, code).
- Created the 8 matching route files under `website/app/docs/<slug>/page.tsx` (two-line `<DocLayout page={PAGES[key]} />` delegations) - required alongside the PAGES/GROUPS entry or the route 404s on static export.
- Enriched Get Started: added "Where to go next" / "What's next" card grids to the Introduction and Quickstart pages; fixed the `workflows` page `group` from the stale `'Workflows'` to `'Concepts'` so its breadcrumb matches GROUPS.
- Landing (`app/page.tsx`): integrations grid now renders `INTEGRATIONS.slice(0, 4)` with a centered "Check all integrations" pill linking to `/docs/integrations/`, mirroring the existing skills CTA.
- Search (`components/Search.tsx`): added an `unavailable` state - when the Pagefind runtime can't load (e.g. `next dev`, no index), the modal shows a clear "index generated at build time, run npm run build" message instead of a silent "No results."
- Wired the 8 new routes into `app/sitemap.ts` (`ROUTES`) and `e2e/links.spec.ts` (`START_PATHS`).

**Files touched:**

- `website/lib/docs-content.ts` - update - `cards` block type, optional callout label, GROUPS restructure, 8 new PAGES, card grids on intro/quickstart, workflows group fix, unwrapped two bold-wrapped links.
- `website/components/docs/DocIcon.tsx` - create - inline-SVG icon set.
- `website/components/docs/DocBlocks.tsx` - update - callout icons + InlineMarkdown, cards renderer.
- `website/app/docs/{spec-driven-development,memory-layer,integrations,cli-reference,glossary,faq,troubleshooting,contact-us}/page.tsx` - create - route files.
- `website/app/page.tsx` - update - landing 4-card slice + "Check all integrations" CTA.
- `website/components/Search.tsx` - update - unavailable-state messaging.
- `website/app/sitemap.ts`, `website/e2e/links.spec.ts` - update - add the 8 new `/docs/*` routes.

**Decisions made:**

- Callout markdown must not wrap a link in bold (`**[x](y)**`) - the inline tokenizer's bold alternative matches first and swallows the link as literal text. Fixed by using bare `[x](y)`; logged in Key Decisions.

**Verification:** website `tsc --noEmit` clean; `next build` generated 32 pages incl. all 8 new `/docs/*` routes; `scripts/build-search.mjs` reindexed 26 pages / 1757 words (was 18 / 1599).

**Open questions / follow-ups:**

- Internal doc links inside callouts route through `InlineMarkdown`, which forces `target="_blank"` - they open in a new tab. Acceptable for now; a same-tab variant would need a component change.

---

## 2026-07-26 - Docs pages get a minimal one-line footer

**Prompt / trigger:** User request - on all docs pages, replace the full sitemap footer with only the copyright/hire/tagline line.

**What was done:**

- Converted `website/components/Footer.tsx` to a client component using `usePathname()`; when the path starts with `/docs` it renders only the bottom meta strip (© line + "Hire the Developer" + tagline), else the full footer.
- Extracted that strip into a `FooterMeta()` helper reused by both variants (the full footer's old inline bottom strip now calls it - no duplication).
- No layout change: the global `<Footer/>` in `app/layout.tsx` stays; the branch happens inside it. Static export prerenders the correct variant per route.

**Files touched:**

- `website/components/Footer.tsx` - update - `'use client'` + `usePathname` branch, `FooterMeta` helper.

**Verification:** website `tsc` + `next build` clean (32 pages); exported `out/docs/faq/index.html` has the minimal strip and none of the full-footer columns, `out/index.html` keeps the full footer.

---

## 2026-07-26 - Docs sidebars pinned + aesthetic scrollbars site-wide

**Prompt / trigger:** User request - docs left/right sidebars should not scroll with the page; make scrollbars site-wide aesthetic (thin, rounded, gray at 40% opacity, no track background).

**What was done:**

- `components/docs/DocLayout.tsx`: both asides changed from `max-h-screen` to `h-screen` and gained `overscroll-contain`. With the existing `sticky top-0` they are now fixed full-height panes that stay put while the main column scrolls; internal sidebar scroll no longer chains into the page.
- `app/globals.css`: global scrollbar styling on `*` - `scrollbar-width: thin` + `scrollbar-color` (Firefox), and `::-webkit-scrollbar*` (8px, transparent track, `rgba(128,128,128,0.4)` pill thumb, 0.6 on hover).

**Files touched:**

- `website/components/docs/DocLayout.tsx` - update - `h-screen` + `overscroll-contain` on both sidebars.
- `website/app/globals.css` - update - site-wide thin/rounded/gray-40% scrollbars.

**Verification:** website `tsc` + `next build` clean (32 pages).

---

## 2026-07-27 - CLI fixes: create-app shorthand, conflict-free upgrade, persona surfaced in spec.config.js

**Prompt / trigger:** User reported three issues in the published npm CLI: (1) `npx spec-init my-project` did not scaffold (required explicit `init`); (2) confusion about the `.spec-init/base/` folder; (3) the selected persona was nowhere visible in `spec.config.js`. Brainstormed → spec → plan → subagent-driven execution.

**What was done:**
- **Create-app shorthand** (both CLIs): first bare non-command token now implies `init <name>`; a leading `-`/flag still errors.
- **Conflict-free upgrade** (both CLIs): `.spec-init/base/` stays RAW on disk (needed by `customize`'s marker re-derive), but `upgrade` now reads `.spec-init/meta.json` and transforms `base` and `theirs` through the recorded persona/integration settings before the three-way merge, and skips `_integrations/`. This removes false conflicts on persona/integration-gated files (root cause: the old code merged a raw base against a stripped working tree).
- **Persona surfaced in `spec.config.js`**: a CLI-managed `// active-persona: <value>   // managed by spec-init - change via ` + "`spec-init customize --persona`" + ` line, added to the template payload and written/updated by `init`/`reinit`/`customize --persona` via a shared `stampPersona`/`stamp_persona` helper. `upgrade` normalizes that line to `<none>` on all three merge sides then re-stamps from meta, so it can never conflict.

**Files touched:**
- `templates/spec.config.js` - update - added the managed `active-persona` line (single source of truth; `packages/cli-python/_payload/` is generated from it by `_build.py` and stays gitignored).
- `packages/cli-node/src/args.ts` - update - implied-init parsing; removed orphaned `takeCommand`.
- `packages/cli-node/src/persona.ts` - update - `stampPersona`.
- `packages/cli-node/src/commands/{init,reinit,customize,upgrade}.ts` - update - stamp wiring + transform-on-read upgrade.
- `packages/cli-python/src/spec_init/args.py` - update - implied-init parsing.
- `packages/cli-python/src/spec_init/persona.py` - update - `stamp_persona`.
- `packages/cli-python/src/spec_init/commands/{init,reinit,customize,upgrade}.py` - update - mirror of the Node changes.
- `packages/cli-node/tests/{args,persona}.test.ts`, `packages/cli-python/tests/{test_args,test_init,test_upgrade}.py` - update/create - regression tests.
- `CHANGELOG.md` - update - Unreleased Added/Fixed entries.

**Decisions made:**
- Base snapshot stays raw; upgrade transforms on read rather than storing a stripped base - a stripped base would break `customize`'s marker re-derive. (Also logged conceptually in the design doc `docs/superpowers/specs/2026-07-26-spec-init-cli-fixes-design.md`.)
- Persona visibility via a merge-normalized managed comment line rather than a parsed config field, so `spec.config.js` remains "the CLI never parses it" while still showing the active persona.

**Open questions / follow-ups:**
- Pre-existing (out of scope, flag to maintainer): 3 Python tests fail on the untouched repo too - `test_init.py::test_integrations_flip`, `test_customize.py::test_add_graphify_flips_checkbox`, `test_customize.py::test_remove_obsidian_restores_checkbox` (integration-checkbox assertion vs current `templates/CLAUDE.md` §8). Not caused by this work.
- Node CLI still has no built-payload e2e harness; the upgrade fix is covered by line-by-line review, a manual divergence repro, and the identical-logic Python regression test.

---

## Key Decisions

- **2026-07-26** - Docs interactivity is a data-model extension, not new page infra: a `cards` `DocBlock` variant + optional callout `label` + variant icons (rendered by `DocIcon.tsx`, a zero-dep inline-SVG set). Callout bodies flow through the existing `InlineMarkdown` tokenizer, whose bold alternative greedily swallows a bold-wrapped link (`**[x](y)**`) - so callout links stay bare `[x](y)`. Landing mirrors the skills pattern: `slice(0, 4)` preview + a centered "Check all integrations" CTA to `/docs/integrations/`. Search modal now surfaces an explicit "index built at build time" notice when Pagefind can't load (dev/no-index) instead of a silent "No results."
- **2026-07-25** - Docs pages need both a `PAGES`/`GROUPS` entry and a matching `app/docs/<slug>/page.tsx` route file (the route is not a dynamic `[slug]`); a mismatch 404s on static export. Landing surfaces a 24-skill count with a 6-item preview + "Check all skills" CTA to the full `/docs/supporting-skills/` catalog.
- **2026-07-25** - Changelog notes render inline markdown via a zero-dependency tokenizer (`website/lib/inline-markdown.ts`), not a markdown library - consistent with the site's dep-light approach. Copy buttons use a hover "Copy" / click "Copied" tooltip (with an `sr-only` status) instead of a click toast.
- **2026-07-25** - Open Code Review added as the 7th opt-in integration (CLI/CI code reviewer, complements `/spec-review`); key `opencodereview` (hyphenless for the `[a-z]+` marker regex). At 7 integrations the `--integrations` help line points to the README instead of inlining the list.
- **2026-07-25** - Kit conventions bias toward token-lean specs (Markdown narrative + flat YAML for deep structure), BDD Given/When/Then acceptance scenarios with mandatory edge cases, version-pinning + verification, no hardcoded secrets/PII in specs, and a PR Risk & Impact section. All as templates/skills conventions - no runtime infra (policy server/sandbox/eval/MCP-server explicitly out of scope for a scaffolding kit).
- **2026-07-25** - Bare `spec-init` on a TTY launches a `@clack/prompts` welcome (Node-only); TTY-gated so non-interactive behavior is unchanged. The TUI reuses `runInit`/`runReinit` via a new `quiet` mode; `@clack` is dynamic-imported only on the interactive path.
- **2026-07-24** - `spec.config.js` is an advisory, Claude-read project config (skills/workflow/settings), honored via CLAUDE.md §2 invariant 7. The CLI never parses it (keeps `.js`, avoids the dual-CLI JS-parse problem); persona/integrations stay CLI-owned in meta.json - no duplication.
- **2026-07-24** - `reinit` adopts Throughspec into existing projects in place, non-destructive by default (keep existing spec files; `--force`/prompt to replace), writing `.spec-init/base` so `upgrade` works after. Reuses init helpers via exports; keep/replace is a global binary.
- **2026-07-24** - ponytail added as the 6th opt-in integration (code-minimalism discipline), same external-tool pattern; described honestly as minimalism, not orchestration.
- **2026-07-24** - agentmemory + openwiki added as opt-in integrations following the caveman pattern (external tool -> doc + marker blocks + name-lists, no vendoring). openwiki's root-CLAUDE.md overwrite is mitigated by documentation, not code.
- **2026-07-24** - Kit ships a 15-skill supporting catalog (design/review/delivery/ideation/continuity) consolidating overlapping requests into moded skills (`spec-review`, `spec-research`). Skills are self-contained memory-integrated prompts; they do not invent FR-IDs. `spec-resume` persists a file-based resumption brief (`claude/resume.md`), no database.
- **2026-07-24** - Kit CLAUDE.md defaults to suggesting a Conventional Commits message at the end of file-changing responses (§2 invariant 6). Placed in the standing-contract section, not the user-overrides section, so it is persona-agnostic and on by default.
- **2026-07-24** - Interactive integration picker in `init` is a dependency-free numbered list (all / let me select / none), gated on TTY + no explicit `--integrations`. Rejected raw-mode checkbox TUI and inquirer/questionary deps (zero-cost, no-new-dep). Caveman added as a non-vendored, opt-in integration (install nudged, not bundled).
- **2026-06-29** - Single `templates/` tree consumed by both packagers; parity enforced by SHA-256 manifest. Prevents npm/PyPI drift (SRS Risk row 6).
- **2026-06-29** - npm workspaces + uv as the two package managers.
- **2026-06-29** - MIT license.
- **2026-06-30** - Project's own `claude/context.md` and `claude/learnings.md` follow CLAUDE.md §9/§10 schema, not the `templates/claude/` shape. Needs reconciliation before Stage 2.
- **2026-06-30** - Persona gating in `templates/CLAUDE.md` uses HTML-comment fences with CSV names. Zero-dep, grep-friendly, renders invisibly.
- **2026-06-30** - `js-tiktoken` cl100k_base encoding is the token-count proxy for Anthropic budgeting until a first-party tokenizer ships.
- **2026-06-30** - Stage 2 reformatted all `templates/**/*.md` with prettier (whitespace only) rather than weakening lint rules, so downstream users inherit a lint-clean tree.
- **2026-06-30** - Node CLI parses argv by hand (no commander/yargs); the surface is small enough that a dep costs more than a 140-line parser.
- **2026-06-30** - `node-diff3` is the single production dep of `packages/cli-node/` (three-way merge for `spec-init upgrade`); every other command uses Node stdlib only.
- **2026-06-30** - Init snapshots the raw payload into `<project>/.spec-init/base/` so `upgrade` has a common ancestor for three-way merge.
- **2026-06-30** - Persona strip normalizes whitespace (`\n{3,}→\n\n`, trailing `\n+→\n`) so scaffolded outputs pass MD012 after block removal.
- **2026-07-01** - Python CLI uses stdlib argparse; `merge3` is the sole runtime dep, mirroring Node's `node-diff3` choice.
- **2026-07-01** - Persona regex lives in three files (mjs source of truth, TS port, Python port). Two byte-equivalence parity tests guard against drift instead of extracting a shared spec.
- **2026-07-01** - Cross-language `init` parity enforced by `tests/cli-parity.test.ts`: SHA-256 of every scaffolded file must match between Node and Python CLIs for every persona.
- **2026-07-01** - Skill source of truth lives at `templates/.claude/skills/`, not `skills/` at repo root. Reinterpretation of NFR-MAINT-02 "single directory" as "no duplication," so skills flow through the templates payload pipeline with zero build magic.
- **2026-07-01** - SKILL.md prompts are tested structurally (grep for FR-* directives) rather than by LLM invocation. Deterministic, cheap, and catches directive removal at PR time.
- **2026-07-01** - Skill/agent split: skills are sequencing + refusal-gate policy; agents are tool-bounded execution actors. The `tools:` allowlist in each agent's YAML frontmatter is enforced by Claude Code at dispatch time, which is stronger than any prose instruction.
- **2026-07-01** - Ordering assertions on load-bearing fenced blocks (like FR-CODE-05's memory update order) scan the block itself, not the whole file - many of the same filenames appear elsewhere in the prose.
- **2026-07-01** - Live 6-phase-cycle acceptance run (SRS §9's "90-minute new-user walkthrough") is deferred to Stage 10 and executed once with a real Claude session, not in CI.
- **2026-07-02** - `spec-bug-hunter` follows SRS §2.2.4 literally with `Read, Grep, Bash` and no `Edit`; the patch step routes through `spec-coder`, preserving "only spec-coder writes to source" as a hard invariant.
- **2026-07-02** - `spec-refactor` writes an on-disk audit log per pass. This is compensating control (drift becomes observable at review time) rather than preventive (Claude Code doesn't yet expose tool-call scope enforcement at dispatch time).
- **2026-07-02** - Bug fixes are a separate track from feature cycles: `spec-bug` writes only `CHANGELOG.md`, never the memory layer.
- **2026-07-02** - `spec-sync` compression retains recency verbatim and folds older material into a summary, with `compressed-from` block + git history making rollback trivial.
- **2026-07-08** - Integration gating uses HTML-comment fences (`<!-- integration:NAME -->`) mirroring the Stage 2 persona pattern. Per-integration files live in `templates/_integrations/<name>/` and are copied/deleted conditionally; the `_integrations/` prefix is skipped by walkPayload when producing the base tree.
- **2026-07-08** - `spec-init customize --add/--remove` re-derives affected files from the `.spec-init/base/` snapshot, not from the current live files (the current files no longer contain the marker fences after init consumes them). The re-derive is surgical: only files whose snapshot content contains the target integration's marker are rewritten, preserving user edits to memory files that don't host it.
- **2026-07-08** - Obsidian YAML front-matter blocks in the templates are wrapped in `<!-- prettier-ignore-start -->` / `<!-- prettier-ignore-end -->` fences, and the strip utility drops those helper comments. This is the smallest change that keeps prettier from reformatting `---` into a thematic break while still landing YAML on line 1 in the scaffolded output.
- **2026-07-08** - Website ships as a Next.js 15 App Router static export (`output: 'export'`) served from Vercel free tier. Chosen over Astro (per user's Phase-3 pick during Stage 9) after weighing zero-JS-by-default vs App Router ergonomics.
- **2026-07-08** - Design mocks (`design/*.dc.html`) are the visual source of truth. Production pages match them pixel-for-pixel while implementing every declared style through Tailwind utilities (custom tokens in `tailwind.config.ts` for the design's specific colors/letter-spacing) or a scoped CSS module for animation shorthands. No `style={…}` attributes appear in the website's JSX.
- **2026-07-08** - Website docs content lives as typed `DocBlock[]` in `lib/docs-content.ts`, not MDX. Sidebar, prev/next, and TOC all derive from that single source; per-route `page.tsx` files are two-line delegations to `<DocLayout page={PAGES[key]} />`.
- **2026-07-08** - Search is Pagefind, indexed post-`next build` by `scripts/build-search.mjs`. Fully static, zero-cost, no backend; the modal lazy-imports the runtime so docs pages stay JS-light.
- **2026-07-08** - v1.0.0 is the first stable release. Both CLIs versioned at `1.0.0`; Python trove classifier flipped to `Production/Stable`. Alpha users upgrade via `spec-init upgrade` (three-way merge); no silent overwrites.
- **2026-07-08** - Cross-platform CI matrix: `{macos, ubuntu, windows} × {node 18/20}` (6 cells) + `{macos, ubuntu, windows} × {python 3.10/3.11/3.12}` (9 cells) + cross-lang-parity (3 cells) + acceptance-verify. Fail-fast off. Payload copies refreshed inside every job that touches them.
- **2026-07-08** - Publish workflows are tag-gated. `v*` tag push fires `publish-npm.yml` + `publish-pypi.yml`; both verify tag matches file version before uploading. npm uses provenance (`id-token: write`); PyPI prefers OIDC trusted publisher with `PYPI_TOKEN` fallback.
- **2026-07-08** - SRS §9 acceptance splits into programmatic (`tools/verify-acceptance.mjs`, 7 gates, exits 1 on any failure) and human (`tests/acceptance/runbook.md`, 90-min walkthrough + cycle-5 token budget + live Lighthouse). Both are named next to each other in the verifier output so the release manager cannot forget the human items.
- **2026-07-08** - SRS §11 open questions resolved for v1.0 in `claude/design-decisions.md`. Common posture: least-magical default, layer automation on later. `/spec-sync` manual; runner stack-agnostic; single template-version; single Obsidian vault.
- **2026-07-08** - First public release is a **beta at `0.1.0`**, not `1.0.0`. Reverted the earlier version bump: `packages/cli-node/package.json`, `packages/cli-python/pyproject.toml` (trove classifier back to `Development Status :: 4 - Beta`), `packages/cli-python/src/spec_init/__init__.py`, `templates/CLAUDE.md` template-version, `CHANGELOG.md` release header + migration notes, `tests/acceptance/runbook.md` install snippets, `website/components/Footer.tsx` all synced to `0.1.0`. Under semver 0.x the public surface may still shift on minor bumps before 1.0 - documented in the release notes and Migration section. SemVer 0.x→1.0 learnings entry in `claude/learnings.md` still applies as the eventual promise; 1.0 is deferred until beta feedback lands.
- **2026-07-08** - Renamed the project's internal build plan from `claude/plan.md` to `claude/beta.md`. Signal: the plan describes work through the beta cycle, not a hypothetical stable-1.0 roadmap. Only the Current-State reference in `context.md` moved; Session-History entries remain historically accurate (`plan.md` was the file's name at write time; append-only per CLAUDE.md §9). Template-side `claude/plan.md` (what `/spec-plan` writes in scaffolded downstream projects) is unchanged - it is a separate contract for user projects, not this repo's own build log.
- **2026-07-08** - Scroll-reveal uses framer-motion `<FadeIn>` (`whileInView` + `viewport={{ once: true }}`); replaces the old `.reveal` class + `RevealOnScroll` observer site-wide. `.reveal` CSS deleted to avoid dual-system conflicts.
- **2026-07-08** - Command surfaces (npm / pipx / spec-init flags / docs code blocks) use `<CopyableCommand>` - hover shows a centered copy icon at 60% opacity; click writes to clipboard and pops a framer-motion toast under the trigger for 3 s. Applied in Landing, Footer, and DocBlocks.
- **2026-07-08** - Hire page lives at `/hire-the-developer/` (matches the deliberate Footer copy). About page's Maintainer section links to it. Content is data-driven inside the page module; portfolio + skills lists are inline arrays.
- **2026-07-08** - SEO via Next.js `metadata` (enriched root openGraph / twitter / robots + per-page descriptions), file-based icons (`icon.tsx`, `apple-icon.tsx`), `opengraph-image.tsx` via `next/og` ImageResponse, plus `sitemap.ts` + `robots.ts`. Every ImageResponse route + sitemap + robots requires `export const dynamic = 'force-static'` under `output: 'export'`.

## Open Questions / TODOs

- [ ] Reconcile the schema mismatch between `claude/context.md` (Session-History style) and `templates/claude/context.md` (compressed-snapshot style) - pick one and align both.
- [x] Should Windows CI be wired in Stage 1 or deferred to Stage 10? _Resolved 2026-07-08 - deferred to Stage 10; `windows-latest` now runs in every matrix cell of `.github/workflows/ci.yml`._
- [x] Wire Stage 3 (`spec-init` Node CLI) to invoke `tools/strip-personas.mjs` during `init`. _Resolved 2026-06-30 via `packages/cli-node/src/persona.ts` (TS port with parity test)._
- [x] Wire Stage 4 (`spec-init` Python CLI) to invoke an equivalent Python strip function (mirror `strip-personas.mjs` behavior byte-for-byte). _Resolved 2026-07-01 via `packages/cli-python/src/spec_init/persona.py` with the Python↔mjs parity test in `packages/cli-python/tests/test_persona.py`._
- [ ] Extract the persona-marker convention into a shared JSON/YAML spec if a fourth implementation ever appears; three files are the current break-even.
- [x] `--version` as a top-level short-circuit. _Resolved 2026-07-01: Python CLI accepts `--version` before any command. Node CLI still requires a subcommand; consider aligning in Stage 10._
- [ ] Cross-language parity coverage for `customize` and `upgrade` outputs (currently only `init`; Stage 8 extended `init` parity to cover integrations).
- [ ] Extend `spec-init doctor` to cross-check `.spec-init/meta.json` integrations against on-disk artifacts (`.graphify/`, `.obsidian/`) - Stage 10 polish.
- [x] Document the customize-replays-templated-files trade-off in the Stage 9 website's Customization Recipes so users understand `--add`/`--remove` will replay CLAUDE.md §8 and README.md's Integrations section from the snapshot. _Resolved 2026-07-08 - covered in the Customization Recipes docs page under `/docs/customization-recipes/`._
- [ ] Verify Lighthouse Performance ≥ 90 and Accessibility ≥ 95 on the deployed Vercel URL (Stage 10 acceptance).
- [ ] Run Playwright e2e (`test:site`) in CI - suite is wired but has not been executed locally (needs `playwright install chromium`).
- [ ] Publish website to Vercel and confirm the build finishes in < 2 minutes on their infra (Stage 10).
- [x] Add a `next dev`-mode notice to the Search modal that surfaces "index not built" (Pagefind only runs post-`next build`). _Resolved 2026-07-26 - `components/Search.tsx` shows an "index generated at build time, run npm run build" message when the Pagefind runtime fails to load._
- [ ] Consider a static "first card highlighted" fallback for `PhaseCycler` under `prefers-reduced-motion` instead of bailing out entirely.
- [x] Verify `pipx install ./dist/spec-init-<version>-py3-none-any.whl` succeeds locally before publish. _Resolved 2026-07-08 - `tests/acceptance/runbook.md` §1 requires this check on macOS, Linux, and Windows before the tag push; `post-publish-smoke.yml` re-verifies from the public registry after publish._
- [ ] Wire a hatch build hook so editable installs auto-refresh `packages/cli-python/src/spec_init/_payload/` from the outer `_payload/` (Stage 10).
- [ ] Consider a minimum-length lint rule on SKILL.md files to catch accidental truncation.
- [x] Stage 7 `/spec-refactor` finalizes the audit-trail / tool-call verification for diff-scope isolation. _Resolved 2026-07-02 via the `.claude/refactor-audits/refactor-audit-{ISO}.md` write step in `spec-refactor/SKILL.md`._
- [ ] Stronger Student-persona detection than "grep for the For the Student block" - deferred to Stage 10 UX polish.
- [ ] Seed `.claude/refactor-audits/` in the scaffolded project so users see where audit logs land before the first refactor.
- [ ] Data-driven source-path definition for `spec-docs` refusal gate (via `.claude/config.yml`) - Stage 10.
- [x] Token-budget regression assertion (cycle 5 ≤ 120% of cycle 1) at Stage 10. _Resolved 2026-07-08 as human-executed - lives in `tests/acceptance/runbook.md` §5. Requires 5 real feature cycles against a Claude session; automation is a v1.1 candidate._
- [x] SRS §11 open questions carried as deferred work to Stage 10. _Resolved 2026-07-08 - all four documented in `claude/design-decisions.md` (`D-2026-07-08-01..04`) with rejected alternatives and rationale. Each is deferred to v1.1 with its constraint recorded._
