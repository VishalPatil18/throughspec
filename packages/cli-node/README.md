# spec-init

[![npm version](https://img.shields.io/npm/v/spec-init.svg)](https://www.npmjs.com/package/spec-init)
[![node](https://img.shields.io/node/v/spec-init.svg)](https://www.npmjs.com/package/spec-init)
[![license](https://img.shields.io/npm/l/spec-init.svg)](./LICENSE)

**Throughspec** - spec-driven, drift-proof, token-lean scaffolding for [Claude Code](https://docs.claude.com/en/docs/claude-code). `spec-init` bootstraps a project around a deterministic, spec-first SDLC: you make the decisions, Claude does the heavy lifting, and a fixed structure keeps the work from drifting.

The same CLI ships on npm (this package) and [PyPI](https://pypi.org/project/spec-init/) from one source-of-truth template tree, verified byte-for-byte.

## Install

```bash
# one-off
npx spec-init my-project

# or globally
npm install -g spec-init
spec-init my-project
```

Requires Node ≥ 18.

## Quickstart

```bash
# scaffold, then open in Claude Code and run /spec-requirements
npx spec-init my-project
cd my-project
```

Run with **no arguments** in a terminal for an interactive welcome (arrow-key selects for new-vs-existing, persona, and integrations). In a non-interactive shell (CI, pipes) it prints help instead, so scripts are unaffected.

`spec-init <name>` scaffolds the canonical Throughspec tree:

```
my-project/
├── CLAUDE.md
├── README.md
├── CHANGELOG.md
├── SECURITY.md
├── CONTRIBUTING.md
├── claude/
│   ├── srs.md
│   ├── plan.md
│   ├── context.md
│   ├── features.md
│   ├── design-decisions.md
│   └── learnings.md
├── design/
│   └── design.md
├── .claude/
│   ├── skills/
│   └── agents/
└── .spec-init/base/    # pristine snapshot for upgrade
```

## Commands

| Command                                       | Purpose                                                             |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `spec-init`                                   | With no args on a terminal, launch the interactive welcome          |
| `spec-init init <name>`                       | Scaffold a new project into `<name>/`                               |
| `spec-init reinit [dir]`                      | Adopt Throughspec in an existing project in place (non-destructive) |
| `spec-init customize --add / --remove <name>` | Toggle an integration in an existing project                        |
| `spec-init customize --persona <name>`        | Swap the CLAUDE.md persona block                                    |
| `spec-init add-skill <name>`                  | Copy one skill from the payload catalog into `.claude/skills/`      |
| `spec-init upgrade`                           | Three-way-merge a newer template payload into an existing project   |
| `spec-init doctor`                            | Verify a scaffolded project's shape                                 |

### Flags

- `--persona vibe\|student\|engineer\|team` - which CLAUDE.md persona block to keep.
- `--integrations <csv>` - activate integrations at scaffold time (see below).
- `--force` - overwrite an existing directory (`init`) or replace existing spec files (`reinit`).
- `--dry-run` - print the plan without writing files.
- `-h, --help` / `-v, --version`.

### Integrations

Opt-in, free/open-source tools layered in without touching your source. Add at scaffold time (`--integrations graphify,caveman`) or later (`spec-init customize --add obsidian`); remove with `customize --remove <name>`.

`graphify`, `obsidian`, `caveman`, `agentmemory`, `openwiki`, `ponytail`, `opencodereview`.

See the [Integrations docs](https://throughspec.v-ai.org/docs/integrations/) for what each does.

### The `.spec-init/base/` snapshot

`init` writes a pristine copy of the payload into `<project>/.spec-init/base/`. `upgrade` uses it as the common ancestor for its three-way merge against the newer shipped payload; `doctor` checks it exists. Don't edit files under `.spec-init/` - they are the CLI's private state.

## Links

- **Docs:** https://throughspec.v-ai.org/docs/
- **Changelog:** https://throughspec.v-ai.org/changelog/
- **Source & issues:** https://github.com/VishalPatil18/throughspec

## License

[MIT](./LICENSE) © Vishal Patil
