# spec-init CLI fixes — design

**Date:** 2026-07-26
**Status:** Approved (pending spec review)
**Scope:** `packages/cli-node`, `packages/cli-python`, and the shared `templates/` + `packages/cli-python/_payload/` payloads.

## Problem

Three issues reported against the published `spec-init` npm package:

1. `npx spec-init my-project` does not scaffold a folder. The user must run the explicit `spec-init init my-project`.
2. The scaffolded project contains a `.spec-init/base/` folder duplicating the project files, with no explanation of what it is.
3. The chosen persona (`student`) is recorded nowhere the user can see it — not in `spec.config.js`.

## Root-cause analysis

**Issue 1.** `parseArgs` treats the first non-flag token as a command. `packages/cli-node/src/args.ts:69-70` sends `my-project` to `takeCommand`, which throws `unknown command: my-project` because there is no implied `init`. Nothing is scaffolded.

**Issue 2.** `.spec-init/base/` is the pristine template-payload snapshot written by `init` (`init.ts:76-77`). It is the baseline that `upgrade` (three-way merge) and `customize` (marker re-derive) read later — the same role `.git` plays holding originals. It is intentional and correct that it exists. **However**, it stores the *raw* payload (full `_integrations/`, persona/integration markers un-stripped), while the working tree is *stripped*. On `upgrade`, the three-way merge compares `base` (raw) against `ours` (stripped), so the strip transforms read as user edits and produce false conflicts. This is a latent correctness bug, not yet hit by the user.

**Issue 3.** Persona is written to `.spec-init/meta.json` only (`init.ts:78-81`). By design per the `spec.config.js` header comment, but there is no human-friendly surface. (It is *indirectly* visible: `CLAUDE.md` §10 keeps only the matching persona block.)

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Add create-app shorthand: first bare token that is not a known command implies `init <name>`. | Matches `create-react-app` / `npm init` convention. |
| 2 | Keep `.spec-init/base/` raw; transform-on-read in `upgrade`. | Storing a stripped base would break `customize`, which needs the markers. Transforming both `base` and `theirs` through the recorded `meta.json` before merge yields the same clean-upgrade result without that cost. |
| 3 | Echo the active persona into `spec.config.js` via one CLI-managed line, with a merge-safe sync mechanism. | Explicit visibility, without letting the line cause upgrade conflicts. |
| 4 | Full parity: fix Node CLI, Python CLI, and both payload copies. | The two CLIs and two payloads must not diverge. |

## Design

### Fix 1 — create-app shorthand

In `parseArgs`, change the `opts.command === null` branch: if the token is a known command, set it; otherwise set `command = 'init'` and push the token as the project name (the `init` runner reads `positional[0]`).

- `spec-init my-project` → `command='init'`, `positional=['my-project']` → scaffolds `my-project/`.
- `spec-init init my-project` → unchanged (token `init` sets the command).
- Bare `spec-init` with no positional on a TTY → still opens the welcome TUI (`command` stays `null`).
- Accepted tradeoff: a mistyped command becomes a project-name argument to `init` rather than an error. This is the create-app convention.

Mirror in `packages/cli-python/src/spec_init/args.py`.

### Fix 2 — clean upgrade (transform-on-read)

`.spec-init/base/` stays a raw payload snapshot (unchanged writer in `init`/`reinit`, unchanged refresh in `upgrade`). In `runUpgrade`:

1. Read `.spec-init/meta.json` for `persona` and `integrations`.
2. For each walked file, exclude the `_integrations/` prefix (consistent with `init`, which never writes those to the project root).
3. Apply `maybeTransform(rel, content, persona, integrations)` to both `base` and `theirs` before the equality checks and `threeWayMerge`.

Effect: for an unedited file, `base'` equals `ours`, so the merge is a clean no-op or clean take; only genuine template changes and genuine user edits surface. Markers remain intact in `base/` for `customize`.

Mirror in `packages/cli-python/src/spec_init/commands/upgrade.py`.

### Fix 3 — persona line in spec.config.js

**Template change** (both `templates/spec.config.js` and `packages/cli-python/_payload/spec.config.js`): add one managed line beneath the header comment:

```js
// active-persona: <none>   // managed by spec-init — edit via `spec-init customize --persona`
```

**Writers.** `init`, `reinit`, and `customize --persona` replace `<none>` (or the previous value) with the active persona after writing/updating `spec.config.js`. A single helper `stampPersona(configText, persona)` performs the line replacement via a fixed sentinel regex (`^// active-persona: .*$`), so all three call sites share one implementation.

**Merge safety in upgrade.** `spec.config.js` is special-cased: before the three-way merge, reset the `active-persona:` line to `<none>` in both `ours` and `base`; after the merge, re-stamp from `meta.json`. The managed line is therefore invisible to the merge and can never conflict.

Mirror the helper and the upgrade special-case in the Python CLI.

## Components touched

**Node** (`packages/cli-node/src`):
- `args.ts` — implied-init parsing.
- `commands/upgrade.ts` — meta-driven transform-on-read; `spec.config.js` persona-line special-case.
- `commands/init.ts`, `commands/reinit.ts`, `commands/customize.ts` — stamp persona into `spec.config.js`.
- new shared helper for `stampPersona` (co-locate in `persona.ts` or a small module).

**Python** (`packages/cli-python/src/spec_init`): the matching files (`args.py`, `commands/upgrade.py`, `commands/init.py`, `commands/reinit.py`, `commands/customize.py`, `persona.py`).

**Payloads:** `templates/spec.config.js`, `packages/cli-python/_payload/spec.config.js`.

## Testing

- **args:** `spec-init my-project` yields `command=init`, `positional=['my-project']`; `spec-init init x` unchanged; bare `spec-init` yields `command=null`.
- **init:** scaffolds `spec.config.js` with `active-persona: student` when `--persona student`.
- **upgrade:** an unedited persona/integration-marked file (e.g. `CLAUDE.md`) produces no conflict and no spurious change across an upgrade; `spec.config.js` with a stamped persona does not conflict and retains the persona after upgrade.
- **customize:** `--persona` re-stamps `spec.config.js`; marker re-derive still works (base still has markers).
- Node CLI currently has no test suite — add a minimal `vitest` file covering the above. Python CLI has an existing suite (`tests/test_args.py`, `test_init.py`, `test_upgrade.py`, `test_customize.py`) to extend.

## Out of scope

- Rewriting the `.spec-init/base/` storage model.
- Any change to the welcome TUI, doctor checks, or integration file contents.
- Docs/README updates beyond what the persona-line change requires.
