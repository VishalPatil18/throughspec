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

**Stage:** Stage 4 complete - Python Scaffolding CLI. Stage 5 (Initiation Skills) is next.

**Tech stack**

- Node CLI: TypeScript (ESM), Node ≥ 18, distributed via npm as `spec-init`.
- Python CLI: Python ≥ 3.10, packaged with `uv`, distributed via PyPI as `spec-init`.
- Package manager (monorepo): npm workspaces.
- Linting/formatting: Prettier + ESLint (JS/TS), Ruff (Python).
- Test runner: Vitest (parity harness lives in `tests/parity`).
- License: MIT.
- Deploy targets (later stages): Vercel free tier (website), npm + PyPI (packages).

**Repo layout**

- `packages/cli-node/` - Node CLI (Stage 3): `src/{index,args,payload,persona,checklist,three-way-merge}.ts` + `src/commands/{init,customize,add-skill,upgrade,doctor}.ts`. Ships `dist/templates/` alongside `dist/index.js`.
- `packages/cli-python/` - Python CLI (Stage 4): `src/spec_init/{cli,args,payload,persona,checklist,three_way_merge}.py` + `commands/{init,customize,add_skill,upgrade,doctor}.py`. Wheel packages `_payload/` via hatchling `force-include`. Runtime dep: `merge3`.
- `templates/` - single source-of-truth payload consumed by both CLIs.
- `tools/check-payload-parity.mjs` - SHA-256 manifest parity check across both build outputs.
- `tools/strip-personas.mjs` - Stage 2 persona-gate stripping utility (Node stdlib).
- `tools/count-tokens.mjs` - Stage 2 tiktoken (cl100k_base) token counter.
- `tests/` - flat repo-level Vitest suite (payload parity, persona snapshots, token budget, lint, CLI end-to-end, doctor, upgrade merge). See `tests/README.md` for the file map.
- `.markdownlint.jsonc` - lenient markdownlint config accepting HTML markers and template placeholders.
- `skills/`, `agents/`, `website/` - placeholders (READMEs only) for later stages.
- `srs.md`, `CLAUDE.md`, `claude/plan.md` - spec, behavior contract, build plan.

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

## Key Decisions

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

## Open Questions / TODOs

- [ ] Reconcile the schema mismatch between `claude/context.md` (Session-History style) and `templates/claude/context.md` (compressed-snapshot style) - pick one and align both.
- [ ] Should Windows CI be wired in Stage 1 or deferred to Stage 10?
- [x] Wire Stage 3 (`spec-init` Node CLI) to invoke `tools/strip-personas.mjs` during `init`. _Resolved 2026-06-30 via `packages/cli-node/src/persona.ts` (TS port with parity test)._
- [x] Wire Stage 4 (`spec-init` Python CLI) to invoke an equivalent Python strip function (mirror `strip-personas.mjs` behavior byte-for-byte). _Resolved 2026-07-01 via `packages/cli-python/src/spec_init/persona.py` with the Python↔mjs parity test in `packages/cli-python/tests/test_persona.py`._
- [ ] Extract the persona-marker convention into a shared JSON/YAML spec if a fourth implementation ever appears; three files are the current break-even.
- [x] `--version` as a top-level short-circuit. _Resolved 2026-07-01: Python CLI accepts `--version` before any command. Node CLI still requires a subcommand; consider aligning in Stage 10._
- [ ] Cross-language parity coverage for `customize` and `upgrade` outputs (currently only `init`).
- [ ] Verify `pipx install ./dist/spec-init-0.1.0a0-py3-none-any.whl` succeeds locally before Stage 10 publish.
- [ ] SRS §11 open questions carried as deferred work to Stage 10.
