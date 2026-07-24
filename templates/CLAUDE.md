# CLAUDE.md - Project Behavior Contract

> **Template version:** 0.1.0
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
6. **Suggest a commit.** End any response that changed files with a suggested Conventional Commits message (`<type>: <description>`, imperative subject <= 50 chars; `type` one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`). See `CONTRIBUTING.md`.

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

<!-- Integration blocks below are inserted or removed by `spec-init init --integrations …` and `spec-init customize --add/--remove <name>`. If no block appears here, no integrations are active. -->

<!-- integration:graphify -->

- [x] **Graphify** - _see `.graphify/config.yml`_. Prefer Graphify queries over full-repo greps when available.

<!-- /integration:graphify -->

<!-- integration:obsidian -->

- [x] **Obsidian** - _vault rooted at project directory_. The `claude/` and `design/` markdown files carry front-matter for graph-view rendering.

<!-- /integration:obsidian -->

<!-- integration:caveman -->

- [x] **Caveman** - _token-lean session mode; see `claude/caveman.md`_. Speak in caveman mode to cut output tokens (~65%) while keeping code and commands byte-exact. Activate with `/caveman`; check savings with `/caveman-stats`.

<!-- /integration:caveman -->

---

## 9. Quick links

- [SRS](./claude/srs.md) · [Plan](./claude/plan.md) · [Context](./claude/context.md)
- [Features log](./claude/features.md) · [Design decisions](./claude/design-decisions.md) · [Learnings](./claude/learnings.md)
- [Design system](./design/design.md) · [Changelog](./CHANGELOG.md)

---

## 10. Persona Guidance

<!-- Blocks below are gated by HTML-comment markers of the form `<!-- persona:NAME -->` ... `<!-- /persona:NAME -->`. The scaffolding CLI keeps only the block(s) whose NAME matches the chosen `--persona` and strips the rest verbatim. Multi-persona blocks list names as CSV (e.g. `persona:student,engineer`). -->

<!-- persona:vibe -->

### For the Vibe-Coder

You are here to ship a working idea, not to debate architecture.

- If a step feels heavy, ask Claude to explain it in one sentence before doing it.
- Skip prose you do not understand - but do not skip a required cross-question.
- Trust the workflow: it protects you from having to redo work later.

<!-- /persona:vibe -->

<!-- persona:student -->

### For the Student

After every phase, ask Claude: **"Why this step?"** and append the answer to [`claude/learnings.md`](./claude/learnings.md).

- Follow the Teach-and-Explain contract on every prompt.
- Use `/spec-docs` to re-read what you built when it stops making sense.
- Do not delete past learnings; the log is append-only.

<!-- /persona:student -->

<!-- persona:engineer -->

### For the Solo Engineer

- Prefer diff-scoped `/spec-refactor` over full-repo cleanups.
- Read `claude/context.md` before Grep - it is cheaper.
- Log every non-trivial architecture decision to `claude/design-decisions.md`, even in solo work.

<!-- /persona:engineer -->

<!-- persona:team -->

### For the Team Lead

- Every PR must run through the checklist in [`.github/pull_request_template.md`](./.github/pull_request_template.md).
- Memory files are shared context - treat unresolved conflicts in them as blocking.
- Rotate `/spec-sync` ownership so the log does not drift under one person.

<!-- /persona:team -->
