# spec-init (Python)

The PyPI-distributed Throughspec scaffolding CLI. Published to PyPI as `spec-init`.

This is the **end-user CLI**. For repo-level dev info, see the [root README](../../README.md).

---

## Install

```bash
# recommended
pipx install spec-init
spec-init my-project

# or regular pip
pip install spec-init
spec-init my-project
```

Requires Python ≥ 3.10.

---

## What It Does

Identical to the npm-published `spec-init`. Both CLIs ship the same `templates/` payload, verified byte-for-byte by `tools/check-payload-parity.mjs` at the repo root.

See [`packages/cli-node/README.md`](../cli-node/README.md) for the scaffolded tree shape.

After scaffolding, open the project in Claude Code and run `/spec-requirements`.

---

## Local Development

The Python package's wheel includes the canonical `templates/` payload from the repo root. The build flow:

```bash
# 1. Copy templates/ -> _payload/ (cleared and rewritten on every run)
python -m spec_init._build

# 2. Build the wheel and sdist
uv build
```

`_payload/` is gitignored.

---

## Commands

Command surface and flags are identical to the [Node CLI](../cli-node/README.md#commands). The two channels produce byte-identical scaffolded trees for every persona/integration combination - enforced by the cross-language parity test at `tests/cli-parity.test.ts`.

| Command | Purpose |
|---------|---------|
| `spec-init init <name>` | Scaffold a new project into `<name>/` |
| `spec-init customize --add / --remove <graphify\|obsidian>` | Toggle an integration in an existing project |
| `spec-init customize --persona <name>` | Swap the CLAUDE.md persona block |
| `spec-init add-skill <name>` | Copy a skill from the payload's `skills/` catalog (populated in Stage 5) |
| `spec-init upgrade` | Three-way-merge a newer template payload into an existing project |
| `spec-init doctor` | Verify a scaffolded project's shape |

### Flags

- `--persona vibe|student|engineer|team`
- `--integrations graphify,obsidian`
- `--force` / `--dry-run` / `-h` / `-v`

### The `.spec-init/base/` snapshot

`init` writes a pristine copy of the payload into `<project>/.spec-init/base/`. `upgrade` uses that snapshot as the common ancestor for its three-way merge. `doctor` checks it exists.

---

## Tests

```bash
cd packages/cli-python
uv run pytest tests/
```

---

## License

[MIT](../../LICENSE)
