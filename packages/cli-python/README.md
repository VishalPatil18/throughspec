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

## Stage 1 Status

This package currently ships a stub that prints the version and exits. Real command surface lands in Stage 4 of [`claude/plan.md`](../../claude/plan.md).

---

## License

[MIT](../../LICENSE)
