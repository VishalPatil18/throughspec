# spec-init (Node)

The Node-distributed Throughspec scaffolding CLI. Published to npm as `spec-init`.

This is the **end-user CLI**. For repo-level dev info, see the [root README](../../README.md).

---

## Install

```bash
# one-off
npx spec-init my-project

# or globally
npm install -g spec-init
spec-init my-project
```

Requires Node ≥ 18.

---

## What It Does

`spec-init <name>` scaffolds the canonical Throughspec tree into `./my-project/`:

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
└── .github/
    ├── ISSUE_TEMPLATE/
    └── pull_request_template.md
```

After scaffolding, open the project in Claude Code and run `/spec-requirements`.

---

## Commands

| Command | Purpose |
|---------|---------|
| `spec-init init <name>` | Scaffold a new project into `<name>/` |
| `spec-init customize --add / --remove <graphify\|obsidian>` | Toggle an integration in an existing project |
| `spec-init customize --persona <name>` | Swap the CLAUDE.md persona block |
| `spec-init add-skill <name>` | Copy a skill from the payload's `skills/` catalog (populated in Stage 5) |
| `spec-init upgrade` | Three-way-merge a newer template payload into an existing project |
| `spec-init doctor` | Verify a scaffolded project's shape |

### Flags

- `--persona vibe\|student\|engineer\|team` - which CLAUDE.md persona block to keep at scaffold time.
- `--integrations graphify,obsidian` - flip integration checkboxes at scaffold time.
- `--force` - overwrite an existing directory during `init`.
- `--dry-run` - print the plan without writing files.
- `-h, --help` / `-v, --version`.

### The `.spec-init/base/` snapshot

`init` writes a pristine copy of the payload into `<project>/.spec-init/base/`. `upgrade` uses that snapshot as the common ancestor for its three-way merge against the newer shipped payload. `doctor` checks it exists. Don't edit files under `.spec-init/` - they are the CLI's private state.

---

## License

[MIT](../../LICENSE)
