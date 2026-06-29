# CLAUDE.md - Project Behavior Contract

> **Template version:** 1.0.0
> **Read this file before every prompt.** It is the contract between you (Claude) and this project.

---

## 1. What this project is

<!-- Replace with one paragraph: what the product is, who it's for, what it does. -->

**Product:** _<one-line product name and pitch>_
**Audience:** _<who uses this>_
**Status:** _<pre-alpha / alpha / beta / shipping>_

For frozen requirements, read [`claude/srs.md`](./claude/srs.md).
For the current build plan, read [`claude/plan.md`](./claude/plan.md).
For the compressed current state, read [`claude/context.md`](./claude/context.md).

---

## 2. How you work in this project

This project follows the **Spec-Driven Development** SDLC. You MUST honor these invariants:

1. **Read before you write.** Open `claude/context.md` and the relevant section of `claude/features.md` before any code change.
2. **Cross-question before you decide.** When a requirement is ambiguous, ask. Do not guess.
3. **Spec before code.** Never write production code until the relevant feature's Tech Specs phase is complete.
4. **Diff-scoped refactor.** When `/spec-refactor` runs, touch only files changed in the current cycle.
5. **Memory is sacred.** After every feature cycle, update `claude/context.md`, `claude/features.md`, `claude/design-decisions.md`, `claude/learnings.md`, and `CHANGELOG.md` - in that order.

---

## 3. SDLC phases (mandatory)

| Phase         | Skill                | Output                                 |
| ------------- | -------------------- | -------------------------------------- |
| Requirements  | `/spec-requirements` | `claude/srs.md`                        |
| Design        | `/spec-design`       | `design/design.md` + `design/preview/` |
| Planning      | `/spec-plan`         | `claude/plan.md`                       |
| Feature Cycle | `/spec-feature`      | implementation + memory updates        |

The Feature Cycle itself runs six sub-phases in order: Requirements → Architecting → Product Specs → Tech Specs → Planning → Writing Code. Do not skip phases without an explicit user override logged in `claude/design-decisions.md`.

---

## 4. Bug resolution phases (mandatory)

When invoked via `/spec-bug`:

1. **Reproduce** - if you cannot reproduce, stop and ask for repro steps.
2. **Write a regression test** that fails today.
3. **Apply the smallest possible fix.**
4. **Run the full test suite.**
5. **Log the fix** in `CHANGELOG.md` under `### Fixed`.

No refactors. No abstractions. No scope creep.

---

## 5. Documentation rewrite phases (mandatory)

When invoked via `/spec-docs`:

1. Read the repo state and the memory layer.
2. Produce a diff (docs vs reality) and present it for approval.
3. Apply only on approval. **Never modify source code in this workflow.**
4. Flag any documented feature that no longer exists.

---

## 6. Environment

<!-- Fill these in as the project matures. -->

- **Language(s):** _<e.g., TypeScript 5.x, Python 3.12>_
- **Framework(s):** _<e.g., Next.js 16, FastAPI>_
- **Package manager:** _<npm / pnpm / uv / pip>_
- **Test runner:** _<vitest / pytest / etc.>_
- **Deployment target:** _<Vercel / Fly / etc.>_
- **Required env vars:** see `.env.example`

---

## 7. Custom user instructions

<!-- Anything user-specific that overrides defaults. Keep this short. -->

- _<e.g., "Never use class components in React.">_
- _<e.g., "Prefer Drizzle over Prisma.">_

---

## 8. Integrations active in this project

- [ ] Graphify - _see `.graphify/config.yml`_
- [ ] Obsidian - _vault rooted at project directory_

---

## 9. Quick links

- [SRS](./claude/srs.md) · [Plan](./claude/plan.md) · [Context](./claude/context.md)
- [Features log](./claude/features.md) · [Design decisions](./claude/design-decisions.md) · [Learnings](./claude/learnings.md)
- [Design system](./design/design.md) · [Changelog](./CHANGELOG.md)
