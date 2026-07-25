# Software Requirements Specification (SRS) - Beta

## Throughspec

> Spec-driven. Drift-proof. Token-lean.

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Document Version | 1.0.0                                             |
| Status           | Draft - Approved for Build                        |
| Owner            | Solutions Architecture                            |
| Last Updated     | 2026-06-25                                        |
| Related Docs     | `CLAUDE.md`, `claude/plan.md`, `design/design.md` |

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional, non-functional, architectural, and process requirements for **Throughspec**. Throughspec is a publishable scaffolding tool, distributed via npm and PyPI, that bootstraps a Claude Code project around a deterministic, spec-first Software Development Life Cycle (SDLC).

Throughspec's value proposition is to **collapse the gap between idea and shipped software** for users who do not want to (or cannot) hand-craft prompts, manage Claude Code context manually, or design SDLC scaffolding from scratch. The user provides decisions; Claude does the heavy lifting; Throughspec enforces structure so the work compounds rather than drifts.

### 1.2 Scope

In scope:

- A scaffolding CLI (`spec-init` / `spec-init.py`) that creates the canonical project structure.
- A canonical set of Claude-readable markdown files (`CLAUDE.md`, `claude/*.md`, `design/design.md`) that act as the project's durable memory.
- A library of Claude Code **skills** and **agents** that implement the mandated workflows (Project Initiation, Feature Development 6-Phase Cycle, Bug Resolution, Documentation Rewrite).
- Integration adapters for **Graphify** (code knowledge graph) and **Obsidian** (markdown-graph navigation).
- A companion website serving documentation, design prompts, a learning map, and customization recipes.

Out of scope (explicitly):

- Hosting or remote execution of Claude Code itself.
- Project-specific runtime code generation (Throughspec scaffolds process, not application source).
- Replacing Claude Code's permission, hook, or settings model - Throughspec composes on top of it.

### 1.3 Audience

| Persona           | Profile                                                | Primary Need                                             |
| ----------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| **Vibe-Coder**    | Non-developer building real products through prompting | A safe, opinionated workflow that prevents project drift |
| **Student**       | Learning software engineering via real projects        | An auditable trail showing _why_ every decision was made |
| **Solo Engineer** | Experienced developer using Claude Code for velocity   | Token-efficient context management and reproducible SDLC |
| **Team Lead**     | Adopting AI-first engineering for a small team         | A shared structural contract every contributor follows   |

### 1.4 Definitions, Acronyms, Abbreviations

| Term              | Definition                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SDLC              | Software Development Life Cycle                                                                                                |
| Harness           | The configured environment (settings, hooks, skills, agents, memory files) Claude Code runs inside                             |
| Skill             | A reusable Claude Code instruction package invoked via `/skill-name`                                                           |
| Agent             | A specialized Claude sub-process with a constrained tool set and role                                                          |
| Memory File       | A markdown file in `claude/` that Claude reads to reconstruct project state without re-deriving it                             |
| Cross-Questioning | A workflow phase where Claude interrogates the user to surface implicit requirements                                           |
| Token-Efficient   | A design property that minimizes wasted context tokens by reading from condensed memory rather than re-scanning the codebase   |
| 6-Phase Cycle     | The mandatory feature development workflow: Requirements → Architecting → Product Specs → Tech Specs → Planning → Writing Code |

### 1.5 Core Philosophy

Throughspec is built on three load-bearing beliefs:

1. **Spec-driven beats vibe-driven.** Cross-questioning the user _before_ code generation produces dramatically better outputs than open-ended prompting. Throughspec enforces specs as a precondition.
2. **Memory beats re-derivation.** Re-reading source files to reconstruct intent is a token tax. Throughspec invests once in writing condensed memory files (`context.md`, `learnings.md`, `design-decisions.md`) and amortizes that cost across every subsequent prompt.
3. **Structure compounds.** A predictable file layout means skills, agents, and humans all know where to look. Throughspec refuses to ship freeform.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  Throughspec Distribution Plane                  │
│   ┌──────────────┐    ┌──────────────┐    ┌────────────────┐   │
│   │  npm package │    │  pip package │    │ docs website   │   │
│   │ spec-init    │    │ spec-init    │    │ + design store │   │
│   └──────┬───────┘    └──────┬───────┘    └────────┬───────┘   │
└──────────┼───────────────────┼─────────────────────┼───────────┘
           │                   │                     │
           └─────────┬─────────┘                     │
                     ▼                               │
        ┌────────────────────────┐                   │
        │   Scaffolding CLI      │                   │
        │   (init + customize)   │                   │
        └────────────┬───────────┘                   │
                     │                               │
                     ▼                               │
┌────────────────────────────────────────────────────┴───────────┐
│                  User Project (scaffolded)                       │
│                                                                  │
│   ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐  │
│   │  CLAUDE.md   │──▶│  claude/*.md  │◀──│ design/design.md │  │
│   │ (router)     │   │ (memory)      │   │ (design system)  │  │
│   └──────┬───────┘   └──────┬────────┘   └──────────────────┘  │
│          │                  │                                    │
│          ▼                  ▼                                    │
│   ┌────────────────────────────────────────────┐                │
│   │       Claude Code Runtime + Skills          │                │
│   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │                │
│   │  │/init │ │/srs  │ │/plan │ │/feature  │  │                │
│   │  └──────┘ └──────┘ └──────┘ └──────────┘  │                │
│   │  ┌──────┐ ┌──────┐ ┌────────────────────┐ │                │
│   │  │/bug  │ │/docs │ │ code-refactor       │ │                │
│   │  └──────┘ └──────┘ └────────────────────┘ │                │
│   └────────────────────────────────────────────┘                │
└────────────────────────────────────────────────────────────────┘
           │                                       │
           ▼                                       ▼
   ┌───────────────┐                       ┌────────────────┐
   │   Graphify    │                       │    Obsidian    │
   │ (code graph)  │                       │ (markdown graph)│
   └───────────────┘                       └────────────────┘
```

### 2.2 Components

#### 2.2.1 Scaffolding CLI

| Property     | Specification                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entry points | `spec-init` (npm bin), `spec-init` (pip console script)                                                                                                            |
| Commands     | `init`, `reinit`, `customize`, `add-skill`, `upgrade`, `doctor`                                                                                                    |
| Inputs       | Project name, target stack hints (optional), persona (student / engineer / non-dev), integration toggles (Graphify, Obsidian)                                      |
| Outputs      | A populated project directory matching the canonical structure in §6                                                                                               |
| Idempotency  | `init` refuses to overwrite an existing project unless `--force` is passed; `reinit` adopts Throughspec into an existing project in place, keeping existing spec files unless `--force`; `upgrade` merges new template versions while preserving user edits via three-way merge |

#### 2.2.2 Claude Memory Layer

The memory layer is Throughspec's primary novelty. Each file has a single, narrow role:

| File                         | Role                                                                                 | Update Trigger                                      |
| ---------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `CLAUDE.md`                  | Router and behavior contract. Read by Claude before every prompt.                    | Manual; rarely.                                     |
| `claude/srs.md`              | Frozen project requirements.                                                         | End of Requirements Gathering.                      |
| `claude/plan.md`             | 8–10 stage build plan with checkbox state.                                           | End of Planning; checkboxes flip during execution.  |
| `claude/context.md`          | Compressed snapshot of current project state - what exists, what works, what's next. | End of every feature cycle's _Writing Code_ phase.  |
| `claude/features.md`         | Append-only log of completed features with their final shape.                        | End of every feature cycle.                         |
| `claude/design-decisions.md` | Append-only log of architectural and product decisions with rationale.               | During Architecting and Tech Specs phases.          |
| `claude/learnings.md`        | Append-only user-facing learning notes (for the Student persona).                    | End of every feature cycle.                         |
| `design/design.md`           | Design system tokens, components, do's/don'ts.                                       | Once during Design Generation; rarely edited after. |

#### 2.2.3 Skills Catalog

Throughspec installs the following user-invocable skills (slash commands) into the project's `.claude/skills/` (or equivalent host directory):

| Skill                | Phase       | Purpose                                                             |
| -------------------- | ----------- | ------------------------------------------------------------------- |
| `/spec-init`         | Initiation  | Run interactive scaffold inside an existing Claude Code session     |
| `/spec-requirements` | Initiation  | Build `claude/srs.md` via cross-questioning                         |
| `/spec-design`       | Initiation  | Build `design/design.md` and download generated UI assets           |
| `/spec-plan`         | Initiation  | Build `claude/plan.md` with 8–10 staged deliverables                |
| `/spec-feature`      | Execution   | Run the full 6-phase feature cycle                                  |
| `/spec-refactor`     | Execution   | Run the code-refactor skill against newly written/updated code only |
| `/spec-bug`          | Maintenance | Run the isolated Bug Resolution workflow                            |
| `/spec-docs`         | Maintenance | Run the isolated Documentation Rewrite workflow                     |
| `/spec-sync`         | Maintenance | Reconcile `context.md` against actual repo state                    |

Throughspec also installs the following **supporting skills** - invoked as needed across the SDLC (design, review, delivery, ideation, continuity), each reading the memory layer first and writing findings/decisions back to it:

| Skill               | Group      | Purpose                                                                     |
| ------------------- | ---------- | --------------------------------------------------------------------------- |
| `/spec-architect`   | Design     | Design module/service/layer boundaries; record ADRs in `design-decisions.md`|
| `/spec-db-design`   | Design     | Design and review DB schema, constraints, indexes, and reversible migrations|
| `/spec-review`      | Review     | Multi-axis review; modes: `code` / `pr` / `frontend` / `backend` / `comments`|
| `/spec-code-quality`| Review     | Raise code quality and run a simplification pass                            |
| `/spec-security`    | Review     | Threat-model and harden; gate high-risk changes behind approval             |
| `/spec-performance` | Review     | Measurement-first performance work with before/after numbers                |
| `/spec-test`        | Review     | Review test coverage/quality by whether tests catch regressions             |
| `/spec-ux`          | Review     | Review usability and WCAG accessibility against the SRS users               |
| `/spec-cicd`        | Delivery   | Review/set up CI quality gates and deployment automation                    |
| `/spec-launch`      | Delivery   | Promote across environments with staged rollout and a rollback plan         |
| `/spec-git`         | Delivery   | Git operations and semantic-version releases                                |
| `/spec-brainstorm`  | Ideation   | Diverge/converge option generation with explicit tradeoffs                  |
| `/spec-suggest`     | Ideation   | Leverage-ranked, evidence-backed improvement suggestions                    |
| `/spec-research`    | Ideation   | External knowledge/market research; modes: `knowledge` / `market`           |
| `/spec-resume`      | Continuity | Resume interrupted work from a `claude/resume.md` resumption brief          |

#### 2.2.4 Agents Catalog

Pre-configured agents (delegated tasks Claude can dispatch in parallel):

| Agent               | Tools                   | Role                                                           |
| ------------------- | ----------------------- | -------------------------------------------------------------- |
| `spec-interrogator` | Read                    | Conducts cross-questioning rounds; produces requirements diffs |
| `spec-architect`    | Read, Grep, Glob        | Proposes architecture options with tradeoffs                   |
| `spec-planner`      | Read, Grep              | Decomposes scope into 8–10 testable stages                     |
| `spec-coder`        | Read, Write, Edit, Bash | Implements a single stage end-to-end                           |
| `spec-refactorer`   | Read, Edit              | Cleans only the diff Claude just produced                      |
| `spec-doc-writer`   | Read, Write, Edit       | Updates the memory layer after every cycle                     |
| `spec-bug-hunter`   | Read, Grep, Bash        | Isolates, reproduces, and patches bugs without scope creep     |

### 2.3 Distribution Architecture

| Channel | Mechanism                                           | Notes                                                                                           |
| ------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| npm     | `npx spec-init <name>` or `npm i -g spec-init-cli`  | Node.js ≥18; ships as ESM                                                                       |
| PyPI    | `pipx install spec-init` or `pip install spec-init` | Python ≥3.10                                                                                    |
| Website | Static site (Next.js or Astro) hosted on Vercel     | Includes docs, design prompts, learning map, customization recipes, copy-paste install commands |

Both packages share the same template payload (a single `templates/` tree shipped inside each distributable). Drift between the two channels is prevented by a single source-of-truth template directory referenced during package build.

---

## 3. Functional Requirements

### 3.1 FR-INIT - Project Initiation

| ID         | Requirement                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-INIT-01 | The CLI MUST scaffold the directory tree defined in §6 into the target directory.                                                                   |
| FR-INIT-02 | The CLI MUST populate each scaffolded file from a template with safe defaults that pass markdown lint.                                              |
| FR-INIT-03 | The CLI MUST refuse to overwrite existing files without `--force`.                                                                                  |
| FR-INIT-04 | The CLI MUST emit a post-init checklist instructing the user to (a) open Claude Code, (b) run `/spec-requirements`.                                 |
| FR-INIT-05 | The CLI MUST accept an optional `--persona` flag (`vibe`, `student`, `engineer`, `team`) that pre-tunes `CLAUDE.md` verbosity and the learning map. |
| FR-INIT-06 | The CLI MUST accept `--integrations graphify,obsidian` flags that activate the relevant integration sections.                                       |

### 3.2 FR-REQ - Requirements Gathering

| ID        | Requirement                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-REQ-01 | `/spec-requirements` MUST conduct at least three rounds of cross-questioning before writing `claude/srs.md`.                                            |
| FR-REQ-02 | Cross-questioning MUST cover: target users, jobs-to-be-done, primary success metric, hard constraints, explicit non-goals.                              |
| FR-REQ-03 | The skill MUST refuse to proceed if any of the above five categories are still empty.                                                                   |
| FR-REQ-04 | The final `claude/srs.md` MUST include sections: Overview, Personas, Functional Requirements, Non-Functional Requirements, Constraints, Open Questions. |
| FR-REQ-05 | All open questions MUST be tracked as a checklist in `claude/srs.md` and surfaced in later phases.                                                      |

### 3.3 FR-DESIGN - Design Generation

| ID           | Requirement                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-DESIGN-01 | `/spec-design` MUST first attempt to use user-provided design references (URLs, screenshots, prompts pasted from the Throughspec website).               |
| FR-DESIGN-02 | If no input is provided, the skill MUST infer the design direction from `claude/srs.md` and propose one.                                         |
| FR-DESIGN-03 | The skill MUST produce `design/design.md` containing: tokens (color, typography, spacing, radius, shadow), components, do's/don'ts, surface map. |
| FR-DESIGN-04 | The skill MUST place any generated HTML/CSS/JS reference assets in `design/preview/`.                                                            |
| FR-DESIGN-05 | The skill MUST refuse to fabricate brand colors when a reference is supplied; it MUST extract them.                                              |

### 3.4 FR-PLAN - Planning

| ID         | Requirement                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| FR-PLAN-01 | `/spec-plan` MUST produce 8–10 stages in `claude/plan.md`.                                                            |
| FR-PLAN-02 | Each stage MUST end with a standalone, testable, runnable deliverable.                                                |
| FR-PLAN-03 | Each stage MUST include: goal, scope-in, scope-out, acceptance criteria, test plan, estimated effort band (S/M/L).    |
| FR-PLAN-04 | The plan MUST be expressed as a checklist Claude flips during execution.                                              |
| FR-PLAN-05 | The skill MUST refuse to generate a plan if `claude/srs.md` has unresolved open questions in load-bearing categories. |

### 3.5 FR-FEATURE - 6-Phase Feature Cycle

`/spec-feature` MUST execute six ordered phases. The skill MUST NOT skip phases unless the user passes an explicit override flag (e.g., `--skip product-specs`) AND the override is logged in `claude/design-decisions.md`.

| Phase            | Mandatory Outputs                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| 1. Requirements  | Cross-questioning transcript appended to `claude/features.md` under the feature heading                 |
| 2. Architecting  | At least two architecture options with tradeoffs; final choice recorded in `claude/design-decisions.md` |
| 3. Product Specs | UI sketches, UX flow, frontend entities, backend entities, DB schema (in `claude/features.md`)          |
| 4. Tech Specs    | Framework, language, deployment target, DB choice - each with rejected alternatives                     |
| 5. Planning      | Multi-stage execution plan with per-stage acceptance criteria (in `claude/features.md`)                 |
| 6. Writing Code  | Implementation + tests + refactor + memory updates (see FR-CODE)                                        |

### 3.6 FR-CODE - Writing Code Phase

| ID         | Requirement                                                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-CODE-01 | Before writing code, Claude MUST re-read `CLAUDE.md`, `claude/context.md`, and the relevant `claude/features.md` section.                                                  |
| FR-CODE-02 | Claude MUST cross-question on any ambiguous design decision before writing the code that depends on it.                                                                    |
| FR-CODE-03 | Tests MUST be written for every behavior introduced.                                                                                                                       |
| FR-CODE-04 | The `/spec-refactor` skill MUST run only against files changed in the current cycle (diff-scoped).                                                                         |
| FR-CODE-05 | After implementation, Claude MUST update - in this order - `claude/context.md`, `claude/features.md`, `claude/design-decisions.md`, `claude/learnings.md`, `CHANGELOG.md`. |

### 3.7 FR-BUG - Bug Resolution Workflow

| ID        | Requirement                                                                      |
| --------- | -------------------------------------------------------------------------------- |
| FR-BUG-01 | `/spec-bug` MUST first produce a reproduction recipe before proposing any fix.   |
| FR-BUG-02 | The skill MUST identify the smallest possible diff that resolves the bug.        |
| FR-BUG-03 | The skill MUST add a regression test that fails before the fix and passes after. |
| FR-BUG-04 | The skill MUST NOT introduce refactors, abstractions, or unrelated improvements. |
| FR-BUG-05 | The skill MUST append an entry to `CHANGELOG.md` under `### Fixed`.              |

### 3.8 FR-DOCS - Documentation Rewrite Workflow

| ID         | Requirement                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| FR-DOCS-01 | `/spec-docs` MUST read the current repo state and reconcile it against `claude/context.md`, `claude/features.md`, and `README.md`. |
| FR-DOCS-02 | The skill MUST produce a diff of doc changes before applying them.                                                                 |
| FR-DOCS-03 | The skill MUST NOT modify source code.                                                                                             |
| FR-DOCS-04 | The skill MUST flag any documented feature that no longer exists in the codebase.                                                  |

### 3.9 FR-INTEGRATE - Integrations

| ID              | Requirement                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-INTEGRATE-01 | When `--integrations graphify` is active, Throughspec MUST add a `.graphify/` config and a setup section to `README.md` linking to https://graphify.net/.                                                       |
| FR-INTEGRATE-02 | When `--integrations obsidian` is active, Throughspec MUST add a `.obsidian/` workspace stub, configure the `claude/` and `design/` directories as the Obsidian vault root, and document graph-view navigation. |
| FR-INTEGRATE-03 | Integrations MUST be optional and removable via `spec-init customize --remove obsidian`.                                                                                                                    |

---

## 4. Non-Functional Requirements

### 4.1 NFR-PERF - Performance

| ID          | Requirement                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| NFR-PERF-01 | `spec-init` MUST complete a fresh scaffold in under 5 seconds on a standard laptop.                                 |
| NFR-PERF-02 | The total token cost of reading `CLAUDE.md` + `claude/context.md` MUST stay under 8,000 tokens on a mature project. |
| NFR-PERF-03 | Memory files MUST be compressed during the `/spec-sync` step when any single file exceeds 1,500 lines.              |

### 4.2 NFR-USE - Usability

| ID         | Requirement                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------- |
| NFR-USE-01 | All slash commands MUST print a one-line description and a "next step" hint on completion.   |
| NFR-USE-02 | Throughspec MUST work end-to-end without the user editing any JSON config by hand.               |
| NFR-USE-03 | The Student persona MUST receive an additional "Why this step?" annotation after each phase. |

### 4.3 NFR-REL - Reliability

| ID         | Requirement                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| NFR-REL-01 | Throughspec MUST never silently fail. All errors MUST be printed with a remediation hint.                                   |
| NFR-REL-02 | The `upgrade` command MUST never overwrite user content; merge conflicts MUST be surfaced for manual resolution.        |
| NFR-REL-03 | Every workflow MUST be resumable - if interrupted, the next invocation MUST detect partial state and offer to continue. |

### 4.4 NFR-SEC - Security

| ID         | Requirement                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| NFR-SEC-01 | Throughspec MUST NOT execute arbitrary remote scripts during install.                                                       |
| NFR-SEC-02 | Throughspec MUST NOT collect telemetry without explicit opt-in.                                                             |
| NFR-SEC-03 | Generated templates MUST NOT contain placeholder secrets, API keys, or tokens.                                          |
| NFR-SEC-04 | Throughspec MUST surface a security review checklist before any feature touching auth, payments, or PII is marked complete. |

### 4.5 NFR-MAINT - Maintainability

| ID           | Requirement                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| NFR-MAINT-01 | Template files MUST be versioned; `CLAUDE.md` MUST include a `template-version` field.                                       |
| NFR-MAINT-02 | Skill definitions MUST live in a single `skills/` directory in the Throughspec repo and be compiled into both npm and PyPI payloads. |
| NFR-MAINT-03 | Breaking template changes MUST be released as major version bumps with a documented migration.                               |

### 4.6 NFR-PORT - Portability

| ID          | Requirement                                                            |
| ----------- | ---------------------------------------------------------------------- |
| NFR-PORT-01 | Throughspec MUST work on macOS, Linux, and Windows (PowerShell + WSL).     |
| NFR-PORT-02 | Throughspec MUST NOT depend on any compiled native binary at install time. |

---

## 5. Workflows (Authoritative)

### 5.1 Project Initiation Cycle

```
[install package]
       │
       ▼
[run: spec-init <name>]
       │  scaffolds directory, prints next step
       ▼
[open Claude Code in the new directory]
       │
       ▼
[/spec-requirements]──┐
       │              │ cross-question loop until SRS complete
       ▼              │
[claude/srs.md frozen]◀┘
       │
       ▼
[/spec-design]────────┐
       │              │ extract or generate design system
       ▼              │
[design/design.md]◀───┘
       │
       ▼
[/spec-plan]──────────┐
       │              │ produce 8–10 staged plan
       ▼              │
[claude/plan.md]◀─────┘
       │
       ▼
[/spec-feature]   ◀── enter the 6-Phase Cycle, one stage at a time
```

### 5.2 Feature Development 6-Phase Cycle

```
┌──────────────────┐
│ 1. Requirements   │  cross-question, capture answers in features.md
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 2. Architecting   │  ≥2 options + tradeoffs → confirm → design-decisions.md
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 3. Product Specs  │  UI, UX, FE/BE entities, DB schema → features.md
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 4. Tech Specs     │  stack + deployment + DB, rejected alternatives noted
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 5. Planning       │  multi-stage execution plan with acceptance criteria
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 6. Writing Code   │  read memory → cross-question → implement → test
│                   │  → /spec-refactor (diff-scoped) → update memory layer
└──────────────────┘
```

### 5.3 Bug Resolution Workflow (Isolated)

```
[/spec-bug]
   │
   ▼
[reproduce] ─── if cannot reproduce, halt and ask for repro steps
   │
   ▼
[write failing regression test]
   │
   ▼
[smallest possible fix]
   │
   ▼
[run full test suite]
   │
   ▼
[update CHANGELOG.md ### Fixed]
   │
   ▼
[done - no refactors, no scope creep]
```

### 5.4 Documentation Rewrite Workflow (Isolated)

```
[/spec-docs]
   │
   ▼
[read repo state + memory layer]
   │
   ▼
[diff: docs vs reality]
   │
   ▼
[present diff to user]
   │
   ▼
[apply on approval - docs only, never source code]
   │
   ▼
[flag stale features for removal]
```

### 5.5 Token Efficiency Strategy

| Mechanism                | How It Saves Tokens                                       |
| ------------------------ | --------------------------------------------------------- |
| `CLAUDE.md` routing      | Replaces re-reading conventions every prompt              |
| `claude/context.md`      | Single condensed read replaces N file scans               |
| Diff-scoped refactor     | Refactor reads only the cycle's diff, not the repo        |
| Memory append-only logs  | History is appended, never re-derived                     |
| Compression at threshold | `/spec-sync` compresses any memory file > 1,500 lines     |
| Phase gates              | Refusing to proceed without complete specs avoids re-work |

---

## 6. Folder & File Structure

### 6.1 Canonical Tree

```
~project/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── config.yml
│   │   └── feature_request.md
│   └── pull_request_template.md
├── claude/
│   ├── context.md            # compressed current-state snapshot
│   ├── learnings.md          # student-facing learning trail
│   ├── plan.md               # 8–10 stage build plan, checkbox state
│   ├── srs.md                # frozen requirements
│   ├── features.md           # append-only feature log (template + heading at init)
│   └── design-decisions.md   # append-only decisions log (empty at init)
├── design/
│   ├── design.md             # tokens, components, do's/don'ts
│   └── preview/              # generated HTML/CSS/JS (optional)
├── CHANGELOG.md
├── CLAUDE.md                 # router + behavior contract, read before every prompt
├── spec.config.js           # advisory project config Claude reads (skills/workflow/settings)
├── README.md
├── SECURITY.md
└── CONTRIBUTING.md
```

### 6.2 File Roles

See §2.2.2. Each file has exactly one writer (a skill or workflow) to prevent contention.

### 6.3 File Ownership Matrix

| File                         | Written By                              | Read By                   |
| ---------------------------- | --------------------------------------- | ------------------------- |
| `CLAUDE.md`                  | User / `spec-init`                      | Claude (every prompt)     |
| `claude/srs.md`              | `/spec-requirements`                    | All downstream skills     |
| `claude/plan.md`             | `/spec-plan`                            | `/spec-feature`           |
| `claude/context.md`          | `/spec-feature` (phase 6), `/spec-sync` | All skills                |
| `claude/features.md`         | `/spec-feature`                         | `/spec-docs`, `/spec-bug` |
| `claude/design-decisions.md` | `/spec-feature` (phases 2, 4)           | All skills                |
| `claude/learnings.md`        | `/spec-feature` (phase 6)               | User (Student persona)    |
| `design/design.md`           | `/spec-design`                          | `/spec-feature` (phase 3) |
| `CHANGELOG.md`               | `/spec-feature`, `/spec-bug`            | User, release tooling     |

---

## 7. Integrations

### 7.1 Graphify

- **Purpose:** Treat the codebase as a queryable knowledge graph.
- **Activation:** `spec-init init --integrations graphify` or `spec-init customize --add graphify`.
- **What ships:**
  - `.graphify/config.yml` with sensible defaults.
  - A `## Graphify` section in `README.md` linking to https://graphify.net/.
  - A note in `CLAUDE.md` instructing Claude to prefer Graphify queries over full-repo greps when available.

### 7.2 Obsidian

- **Purpose:** Visualize the `claude/` and `design/` markdown corpus as a navigable graph.
- **Activation:** `spec-init init --integrations obsidian`.
- **What ships:**
  - `.obsidian/workspace.json` with the vault rooted at the project directory.
  - Recommended community plugins listed in `README.md`: Dataview, Graph Analysis, Excalidraw.
  - Front-matter conventions in every `claude/*.md` file so Obsidian's graph view renders meaningful links.

### 7.3 Companion Website

The website is in scope as a distribution and education channel. It hosts:

| Section               | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| Install               | Copy-paste npm and pip commands                                          |
| Quickstart            | 10-minute "first project" walkthrough                                    |
| Workflows             | Long-form docs for each workflow in §5                                   |
| Design Prompt Library | Curated prompts to feed `/spec-design`                                   |
| Learning Map          | A graph of concepts a student traverses while building (Student persona) |
| Customization Recipes | How to add/remove skills, swap personas, tune `CLAUDE.md`                |
| Changelog             | Template-version history with migration notes                            |

---

## 8. Customization Surface

Users MAY customize Throughspec at three levels:

1. **`CLAUDE.md`** - project-specific instructions, environment hints, behavioral overrides.
2. **`.claude/skills/`** - add project-specific slash commands; override Throughspec defaults by same-named file.
3. **`spec-init customize`** - non-destructive CLI command that swaps personas, toggles integrations, adds/removes skills.

Throughspec MUST NOT support customization that violates the workflow invariants (e.g., disabling cross-questioning in `/spec-requirements`). Such overrides require editing the skill source directly and are out of warranty.

---

## 9. Acceptance Criteria

Throughspec is considered shippable when:

- [ ] `spec-init` produces the §6 tree on macOS, Linux, Windows.
- [ ] All 9 skills in §2.2.3 install and execute end-to-end.
- [ ] All 7 agents in §2.2.4 are dispatchable.
- [ ] A new user can complete an Initiation Cycle + one Feature Cycle in under 90 minutes.
- [ ] Token usage for a 5th feature cycle is ≤120% of the 1st cycle (proving memory compression works).
- [ ] All NFRs in §4 pass automated or scripted verification.
- [ ] Documentation site is live with all sections in §7.3.
- [ ] Graphify and Obsidian integrations toggle on and off without leaving artifacts.

---

## 10. Risks & Mitigations

| Risk                                          | Likelihood | Impact | Mitigation                                                                |
| --------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------- |
| Memory files drift from reality               | Medium     | High   | Mandatory `/spec-sync` at end of every cycle; warning hook on Stop        |
| Users skip cross-questioning to "go faster"   | High       | High   | Skill refuses to proceed; override requires explicit logged decision      |
| Template upgrades clobber user edits          | Medium     | High   | Three-way merge in `upgrade`; never overwrite without conflict surface    |
| Graphify or Obsidian API changes              | Low        | Medium | Integrations are optional and isolated to dedicated config files          |
| Token cost grows unbounded as project matures | Medium     | High   | Compression threshold (1,500 lines) + condensed `context.md` contract     |
| Two distribution channels drift               | Medium     | Medium | Single source-of-truth `templates/` tree consumed by both build pipelines |

---

## 11. Open Questions

- [ ] Should `/spec-sync` run automatically on a `Stop` hook, or stay manual?
- [ ] Do we ship a default test runner per stack, or stay stack-agnostic?
- [ ] How do we version skills independently of the template payload?
- [ ] Should the Student persona's `learnings.md` be a separate Obsidian vault?

These remain unresolved and MUST be answered before v1.0.0.

---

## 12. Appendices

### 12.1 Glossary of Slash Commands

| Command              | One-Line                                               |
| -------------------- | ------------------------------------------------------ |
| `/spec-init`         | Scaffold the project inside an existing Claude session |
| `/spec-requirements` | Build `claude/srs.md` via cross-questioning            |
| `/spec-design`       | Build `design/design.md` and download UI assets        |
| `/spec-plan`         | Build `claude/plan.md` (8–10 stages)                   |
| `/spec-feature`      | Run the 6-phase feature development cycle              |
| `/spec-refactor`     | Clean only the current cycle's diff                    |
| `/spec-bug`          | Isolated bug resolution workflow                       |
| `/spec-docs`         | Isolated documentation rewrite workflow                |
| `/spec-sync`         | Reconcile memory files against repo state              |

### 12.2 References

- Claude Code documentation
- Graphify - https://graphify.net/
- Obsidian - https://obsidian.md/
- Companion design document - `DESIGN.md` (this repo)

---

_End of SRS v1.0.0_
