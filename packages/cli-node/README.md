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

## Stage 1 Status

This package currently ships a stub that prints the version and exits. Real command surface (`init`, `customize`, `add-skill`, `upgrade`, `doctor`) lands in Stage 3 of [`claude/plan.md`](../../claude/plan.md).

---

## License

[MIT](../../LICENSE)
