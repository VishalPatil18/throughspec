<p align="center">
  <img src="./assets/logo.png" alt="Throughspec logo" width="80" height="80">
</p>

<h1 align="center">Throughspec</h1>

<p align="center">
  <strong>Spec-driven. Drift-proof. Token-lean.</strong><br>
  A scaffolding kit that turns Claude Code into a deterministic, spec-first SDLC.
</p>

<p align="center">
  <a href="https://throughspec.v-ai.org/"><strong>Website</strong></a> ·
  <a href="https://throughspec.v-ai.org/docs"><strong>Docs</strong></a> ·
  <a href="https://www.npmjs.com/package/throughspec"><strong>npm</strong></a> ·
  <a href="https://pypi.org/project/throughspec/"><strong>PyPI</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
  <img src="https://img.shields.io/badge/Node-%E2%89%A518-339933?logo=nodedotjs&logoColor=white" alt="Node 18+">
  <img src="https://img.shields.io/badge/Python-%E2%89%A53.10-3776AB?logo=python&logoColor=white" alt="Python 3.10+">
  <img src="https://img.shields.io/npm/v/throughspec.svg?label=npm" alt="throughspec npm package">
  <img src="https://img.shields.io/pypi/v/throughspec.svg?label=PyPI" alt="throughspec PyPI package">
  <img src="https://img.shields.io/badge/Claude%20Code-ready-7c3aed" alt="Claude Code ready">
</p>

---

Throughspec is a **free, open-source** scaffolding kit that bootstraps a Claude Code project around a deterministic, spec-first Software Development Life Cycle. You provide the decisions, Claude does the heavy lifting, and Throughspec enforces the structure so the work compounds rather than drifts.

It ships as a single CLI - `spec-init` - distributed identically on **npm** and **PyPI**. Pick the package manager you already have, scaffold a project, open it in Claude Code, and the kit's slash commands carry you from cross-questioned requirements to shipped feature without you ever hand-crafting prompts or wrangling context.

## Why Throughspec

- **Spec-driven beats vibe-driven.** `/spec-requirements` cross-questions you before writing a single file. The kit refuses to proceed until target users, jobs-to-be-done, success metric, hard constraints, and explicit non-goals are answered.
- **Memory beats re-derivation.** Append-only `claude/context.md`, `features.md`, `design-decisions.md`, and `learnings.md` keep Claude's context window small and its answers consistent across long projects.
- **Structure compounds.** A predictable file layout means skills, agents, and humans all know where to look. The kit refuses to ship freeform.

## What you get

Run `spec-init my-project` and you scaffold this:

```
my-project/
├── CLAUDE.md                 # behavior contract Claude reads before every prompt
├── claude/
│   ├── srs.md                # frozen requirements (output of /spec-requirements)
│   ├── plan.md               # 8-10 stage build plan with checkbox state
│   ├── context.md            # compressed snapshot of current project state
│   ├── features.md           # append-only feature log
│   ├── design-decisions.md   # append-only decisions log with rationale
│   └── learnings.md          # append-only learning trail (Student persona)
├── design/
│   └── design.md             # tokens, components, do's and don'ts
├── spec.config.js           # advisory config Claude reads: skills, workflow, settings
├── README.md, CHANGELOG.md, SECURITY.md, CONTRIBUTING.md
└── .github/                  # issue and PR templates
```

Edit `spec.config.js` to customize your experience - disable skills, tune the workflow, add project-wide instructions. Claude reads it every session; there is no build step. (Persona and integrations are managed by `spec-init customize`.)

Then in Claude Code:

| Phase          | Slash command                                                 |
| -------------- | ------------------------------------------------------------- |
| Requirements   | `/spec-requirements`                                          |
| Design system  | `/spec-design`                                                |
| Build plan     | `/spec-plan`                                                  |
| Feature cycle  | `/spec-feature` (runs the full 6-phase Feature Cycle)         |
| Bug resolution | `/spec-bug` (reproduce first, regression test, smallest diff) |
| Doc rewrite    | `/spec-docs` (reconciles docs against current repo state)     |
| Memory sync    | `/spec-sync` (compresses + reconciles `claude/context.md`)    |
| Diff refactor  | `/spec-refactor` (scoped to the current cycle's diff only)    |

Optional integrations toggle on at scaffold time: **Graphify** for code-graph queries, **Obsidian** for navigating `claude/` as a markdown graph.

## Install

Pick one. Both publish the same payload, verified byte-for-byte on every release.

### npm

```bash
# one-off
npx spec-init my-project

# or globally
npm install -g spec-init
spec-init my-project
```

Requires Node ≥ 18.

### PyPI

```bash
# recommended
pipx install spec-init
spec-init my-project

# or via pip
pip install spec-init
spec-init my-project
```

Requires Python ≥ 3.10.

## Get started

Run `spec-init` with no arguments in a terminal for a guided, interactive setup - it walks you through new-vs-existing, persona, and integrations, then scaffolds:

```bash
npx spec-init
```

Or go straight to it with flags:

```bash
# 1. scaffold
npx spec-init my-project
cd my-project

# 2. open in Claude Code, then drive the kit through slash commands:
#    /spec-requirements    -> writes claude/srs.md
#    /spec-design          -> writes design/design.md
#    /spec-plan            -> writes claude/plan.md
#    /spec-feature         -> ships your first feature through 6 phases
```

The kit prints the next step after each command so you never have to remember what comes next.

### Already have a project?

Adopt Throughspec in place - it writes only the missing spec/memory files and keeps everything you already have:

```bash
cd my-existing-project
npx spec-init reinit          # keeps existing files; add --force to replace them
```

`reinit` never touches your source code, and it writes the `.spec-init/base/` snapshot so `spec-init upgrade` works from then on.

## Built spec-first

This repository builds Throughspec the same way Throughspec builds your project. You can read the contract:

- [`srs.md`](./srs.md) - frozen requirements for the kit itself.
- [`claude/plan.md`](./claude/plan.md) - the 10-stage build plan.
- [`CLAUDE.md`](./CLAUDE.md) - the behavior contract Claude reads before every prompt.

Every PR traces to a stage in [`claude/plan.md`](./claude/plan.md). No commit lands without spec backing.

## Personas

`spec-init` accepts `--persona` to tune verbosity and tone:

| Persona    | Profile                                                 |
| ---------- | ------------------------------------------------------- |
| `vibe`     | Non-developer building real products through prompting  |
| `student`  | Learning software engineering via real projects         |
| `engineer` | Solo developer using Claude Code for velocity (default) |
| `team`     | Small team adopting AI-first engineering                |

The Student persona adds a "Why this step?" annotation after each phase and accumulates a durable learning trail in `claude/learnings.md`.

## Repository layout

```
throughspec/
├── packages/
│   ├── cli-node/      # spec-init for npm (TypeScript)
│   └── cli-python/    # spec-init for PyPI (Python + uv)
├── templates/         # single source-of-truth payload (both CLIs copy this)
├── tools/             # build and parity scripts
├── skills/            # Claude Code slash-command sources
├── agents/            # Claude Code sub-agent sources
├── website/           # docs site (Vercel)
├── tests/             # cross-package tests (Vitest)
├── claude/            # this project's own working memory
├── design/            # this project's own design mockups
└── srs.md             # frozen requirements
```

`templates/` is the **single source of truth** for the payload both CLIs ship. A parity check in [`tools/check-payload-parity.mjs`](./tools/check-payload-parity.mjs) prevents drift between the npm and PyPI channels.

## Contributing

PRs welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Please don't open public issues for vulnerabilities - see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
