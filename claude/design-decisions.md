# Design Decisions

> Append-only log. Each decision names the constraint, the choice, the rejected alternatives, and the rationale. If a decision is reversed, add a new entry that supersedes the old one - never delete history.

---

## 2026-07-08 - SRS §11 open questions: resolved for v1.0

Four SRS §11 open questions were carried through the build. All four are **deferred to v1.1** for v1.0 with the rationale below. Recorded together because they share a common posture: default to the least-magical, most-inspectable behavior for the first stable release, and layer automation on top only after real users tell us where the friction is.

### D-2026-07-08-01 - `/spec-sync` stays manual for v1.0

**Question:** Should `/spec-sync` run automatically on a Claude Code Stop hook?

**Decision:** Manual invocation only. Users run `/spec-sync` when they choose.

**Considered:** Auto-fire on every Stop; auto-fire only when the memory files exceed the 1,500-line threshold; auto-fire only in student persona.

**Rationale:** Hooks execute against every session, including sessions where the user was just poking around, cancelled a plan mid-flight, or hit a dead-end they don't want written to memory. Auto-syncing at Stop time would fossilize half-formed intent into the append-only log with no chance to review. Manual invocation gives the user a moment to decide *whether the last chunk of work is worth remembering*. If users tell us they forget to run `/spec-sync` and drift accumulates, we revisit for v1.1 with an opt-in hook.

### D-2026-07-08-02 - Stack-agnostic test runner for v1.0

**Question:** Should Throughspec ship a default test runner per stack (Vitest for Node, pytest for Python, etc.)?

**Decision:** Stack-agnostic. `/spec-design` and `/spec-plan` choose a runner per project.

**Considered:** Ship a per-stack default; ship a single "recommended" runner across stacks; ship a runner-picker skill.

**Rationale:** Throughspec scaffolds process, not application source. Prescribing a test runner would make the Kit opinionated about a layer it does not otherwise touch. Projects come in with existing preferences - shipping a default would force `spec-init` users to explain why they *changed* the pre-selected one, which is exactly the ceremony we are trying to avoid. Keeping this stack-agnostic also protects the SRS §NFR-PORT-01 promise: nothing compiled, nothing platform-specific, no native binary at install time.

### D-2026-07-08-03 - Single template-version for v1.0

**Question:** Should skills be versioned independently of the template payload?

**Decision:** Single monotonic `template-version` in `templates/CLAUDE.md`. Skills ride along.

**Considered:** Per-skill semver in each `SKILL.md` frontmatter; a manifest file with per-skill versions; a hybrid where the template-version pins skill versions.

**Rationale:** SRS Risk row 6 makes byte-for-byte payload parity between npm and PyPI a load-bearing invariant. Per-skill versioning would let one channel ship a newer `/spec-refactor` than the other unless we duplicated the parity check at skill granularity - which effectively brings us back to a monotonic version anyway. `spec-init upgrade`'s three-way merge already surfaces per-file drift; that is the escape hatch when a user's copy of one skill diverges from the shipped default. If real projects grow custom skill catalogs large enough to want independent versioning, we revisit in v1.1 alongside `.claude/config.yml`.

### D-2026-07-08-04 - Single Obsidian vault for v1.0

**Question:** For the Student persona, should `learnings.md` live in a separate Obsidian vault?

**Decision:** Single vault rooted at the project directory. Student `learnings.md` sits next to the other memory files.

**Considered:** Second Obsidian vault under `claude/learnings/` with its own `workspace.json`; symlink from a global `~/claude-learnings/` vault; nothing (drop learnings.md from Obsidian entirely).

**Rationale:** Graph value is a function of edge density. Splitting `learnings.md` into a separate vault severs its links to `context.md`, `plan.md`, and `design-decisions.md` - which is exactly where the student's teaching moments cross-reference the code decisions that produced them. Obsidian users who want a personal cross-project learning journal can create one manually and copy entries over; the Kit shouldn't preempt that choice. Toggle-roundtrip of the obsidian integration would also grow in complexity if we managed two vault configs. Keep the vault singular for v1.0; revisit if students report grep pain.

---

## Format for future entries

Each decision follows:

```
### D-YYYY-MM-DD-NN - <headline>

**Question:** <what triggered the decision>
**Decision:** <what we picked>
**Considered:** <the rejected alternatives, one line each>
**Rationale:** <why this choice; what constraint or evidence forced it>
```

Entries never move. If a decision is reversed later, append a new `D-` entry that names the superseded decision and explains what changed. Rollback is a `git log` away for the code, but the intent needs a paper trail.
