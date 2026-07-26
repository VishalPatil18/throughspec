// Docs content model + data; sidebar, breadcrumbs, prev/next, and TOC derive from it.

export type DocBlock =
  | { t: 'p'; text: string }
  | { t: 'h2'; id: string; text: string }
  | { t: 'code'; text: string }
  | { t: 'callout'; variant: 'note' | 'tip' | 'warn'; label: string; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'defs'; items: { term: string; desc: string }[] }
  | { t: 'steps'; items: { n: string; title: string; desc: string }[] };

export interface DocPage {
  slug: string; // path segment under /docs/
  group: string;
  label: string;
  title: string;
  intro: string;
  blocks: DocBlock[];
}

export interface DocGroup {
  title: string;
  slugs: string[];
}

// Sidebar order + grouping. Every slug here must map to a page in PAGES below.
export const GROUPS: DocGroup[] = [
  { title: 'Get Started', slugs: ['', 'install', 'quickstart'] },
  { title: 'Workflows', slugs: ['workflows'] },
  { title: 'Skills', slugs: ['supporting-skills'] },
  {
    title: 'Recipes',
    slugs: ['design-prompt-library', 'learning-map', 'customization-recipes'],
  },
];

export const PAGES: Record<string, DocPage> = {
  '': {
    slug: '',
    group: 'Get Started',
    label: 'Introduction',
    title: 'Introduction',
    intro:
      'Throughspec is a publishable scaffolding tool - distributed on npm and PyPI - that bootstraps a Claude Code project around a deterministic, spec-first SDLC.',
    blocks: [
      {
        t: 'p',
        text: 'The value proposition is simple: collapse the gap between idea and shipped software. You provide decisions; Claude does the heavy lifting; the Kit enforces structure so the work compounds rather than drifts.',
      },
      {
        t: 'callout',
        variant: 'note',
        label: 'Composes, never replaces',
        text: 'Throughspec sits on top of Claude Code’s permission, hook, and settings model. It scaffolds process, not application source - and never hosts or runs Claude Code itself.',
      },
      { t: 'h2', id: 'philosophy', text: 'Core philosophy' },
      { t: 'p', text: 'The Kit is built on three load-bearing beliefs.' },
      {
        t: 'list',
        items: [
          'Spec-driven beats vibe-driven. Cross-questioning before code generation beats open-ended prompting - so specs are a precondition.',
          'Memory beats re-derivation. Re-reading source to reconstruct intent is a token tax. The Kit writes condensed memory once and amortizes it.',
          'Structure compounds. A predictable layout means skills, agents, and humans always know where to look. The Kit refuses to ship freeform.',
        ],
      },
      { t: 'h2', id: 'audience', text: 'Who it’s for' },
      {
        t: 'defs',
        items: [
          { term: 'Vibe-Coder', desc: 'Non-developer building real products through prompting - needs a safe, opinionated workflow that prevents drift.' },
          { term: 'Student', desc: 'Learning engineering via real projects - needs an auditable trail of why every decision was made.' },
          { term: 'Solo Engineer', desc: 'Using Claude Code for velocity - needs token-efficient context and a reproducible SDLC.' },
          { term: 'Team Lead', desc: 'Adopting AI-first engineering - needs a shared structural contract every contributor follows.' },
        ],
      },
    ],
  },

  install: {
    slug: 'install',
    group: 'Get Started',
    label: 'Install',
    title: 'Install',
    intro:
      'Throughspec ships on two channels from a single source-of-truth template tree, so the trees never drift byte-for-byte.',
    blocks: [
      { t: 'h2', id: 'npm', text: 'npm (Node.js ≥ 18)' },
      { t: 'p', text: 'Distributed as ESM. One-off run via npx or install globally.' },
      { t: 'code', text: '# one-off scaffold\nnpx spec-init my-app\n\n# or install globally\nnpm i -g spec-init' },
      { t: 'h2', id: 'pypi', text: 'PyPI (Python ≥ 3.10)' },
      { t: 'p', text: 'Distributed as a pure-Python wheel. pipx keeps it isolated from your other Python tools.' },
      { t: 'code', text: 'pipx install spec-init\n# or\npip install spec-init' },
      { t: 'h2', id: 'flags', text: 'Flags' },
      {
        t: 'defs',
        items: [
          { term: '--persona <name>', desc: 'vibe | student | engineer | team - pre-tunes CLAUDE.md and the learning map.' },
          { term: '--integrations <csv>', desc: 'graphify,obsidian - activates the relevant integration blocks and drops in their config files.' },
          { term: '--force', desc: 'Required to overwrite an existing project. init refuses otherwise.' },
          { term: '--dry-run', desc: 'Prints the file plan without writing anything.' },
        ],
      },
      { t: 'h2', id: 'verify', text: 'Verify' },
      { t: 'p', text: 'Once installed, spec-init doctor validates that a scaffolded project has all the required files, that CLAUDE.md carries a template-version, and that the .spec-init/base/ snapshot exists.' },
      { t: 'code', text: 'cd my-app\nspec-init doctor' },
      {
        t: 'callout',
        variant: 'note',
        label: 'No native binaries',
        text: 'Nothing compiled is required at install time. The Node CLI is pure JS; the Python CLI is pure Python. macOS, Linux, and Windows (PowerShell + WSL) are all supported.',
      },
    ],
  },

  quickstart: {
    slug: 'quickstart',
    group: 'Get Started',
    label: 'Quickstart',
    title: 'Quickstart',
    intro:
      'From an empty folder to your first shipped feature in under 90 minutes. Here is the whole initiation cycle end-to-end.',
    blocks: [
      { t: 'h2', id: 'scaffold', text: 'Scaffold a project' },
      { t: 'p', text: 'Run the initializer with your project name. It creates the canonical directory tree with safe, lint-clean defaults in under five seconds.' },
      { t: 'code', text: 'npx spec-init my-app\ncd my-app' },
      {
        t: 'callout',
        variant: 'tip',
        label: 'Prefer a guided setup?',
        text: 'Run npx spec-init with no arguments in a terminal for an interactive welcome - arrow-key selects for new-vs-existing, persona, and integrations, then it scaffolds. In a non-interactive shell (CI, pipes) it prints help instead, so scripts are unaffected.',
      },
      {
        t: 'callout',
        variant: 'tip',
        label: 'Python channel?',
        text: 'Prefer the Python channel? pipx install spec-init, then spec-init my-app. Both channels ship the same template payload, verified byte-for-byte on every release.',
      },
      { t: 'h2', id: 'existing-project', text: 'Already have a project?' },
      { t: 'p', text: 'Adopt Throughspec in an existing repo with reinit. It writes only the missing spec and memory files, keeps everything you already have, and never touches your source code. It also lays down the .spec-init/base/ snapshot so upgrade works from then on.' },
      { t: 'code', text: 'cd my-existing-project\nnpx spec-init reinit          # keeps existing files\nnpx spec-init reinit --force  # replace existing spec files with fresh templates' },
      {
        t: 'callout',
        variant: 'note',
        label: 'Non-destructive by default',
        text: 'reinit keeps any spec file that already exists (interactively it asks keep or replace). Pass --force to overwrite them. Already Throughspec-managed? Use upgrade instead - reinit will point you there.',
      },
      { t: 'h2', id: 'cycle', text: 'Run the initiation cycle' },
      { t: 'p', text: 'Open Claude Code in the new directory and run these skills in order. Each gates the next - you cannot plan before the spec is frozen, and you cannot build before the plan is written.' },
      {
        t: 'steps',
        items: [
          { n: '1', title: '/spec-requirements', desc: 'At least three rounds of cross-questioning, then freezes claude/srs.md. Refuses to proceed while any of the five mandatory categories is empty.' },
          { n: '2', title: '/spec-design', desc: 'Extracts a design system from your references, or proposes one from the SRS. Never fabricates brand colors when a reference is supplied.' },
          { n: '3', title: '/spec-plan', desc: 'Produces an 8-10 step build plan, each ending in a standalone, testable, runnable deliverable.' },
          { n: '4', title: '/spec-feature', desc: 'Enters the feature cycle: Requirements → Architecting → Product Specs → Tech Specs → Planning → Writing Code.' },
        ],
      },
      {
        t: 'callout',
        variant: 'warn',
        label: 'No skipping',
        text: '/spec-requirements refuses to proceed until target users, jobs-to-be-done, the success metric, hard constraints, and non-goals are all filled in. Overrides must be logged in design-decisions.md.',
      },
      { t: 'h2', id: 'result', text: 'What you end up with' },
      { t: 'p', text: 'A scaffolded project whose memory layer keeps Claude oriented across every future prompt - without re-scanning the repo. CLAUDE.md plus claude/context.md stay under 8,000 tokens on a mature project (NFR-PERF-02).' },
      { t: 'code', text: 'my-app/\n├─ CLAUDE.md\n├─ claude/\n│  ├─ srs.md\n│  ├─ plan.md\n│  ├─ context.md\n│  ├─ features.md\n│  ├─ learnings.md\n│  └─ design-decisions.md\n├─ design/\n│  ├─ design.md\n│  └─ preview/\n├─ .claude/\n│  ├─ skills/\n│  └─ agents/\n├─ CHANGELOG.md\n├─ README.md\n└─ .spec-init/base/    (snapshot for upgrade)' },
    ],
  },

  workflows: {
    slug: 'workflows',
    group: 'Workflows',
    label: 'Workflows',
    title: 'Workflows',
    intro:
      'The Kit ships three workflows: the initiation cycle (once per project), the feature cycle (once per feature), and the maintenance skills (as needed).',
    blocks: [
      { t: 'h2', id: 'initiation', text: 'Initiation cycle' },
      { t: 'p', text: 'Run once, right after scaffold. Produces the three foundational documents that gate every future feature.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-requirements', desc: 'Cross-questions until the SRS is complete, then freezes claude/srs.md. Refuses on empty load-bearing categories.' },
          { term: '/spec-design', desc: 'Builds design/design.md from user-supplied references or, when none are provided, proposes one from the SRS.' },
          { term: '/spec-plan', desc: 'Emits claude/plan.md with 8-10 step deliverables, each ending in a standalone, testable, runnable outcome.' },
        ],
      },
      { t: 'h2', id: 'feature', text: 'Feature cycle' },
      { t: 'p', text: '/spec-feature runs six ordered steps against a single item from the plan. Skipping a step requires an explicit --skip <step> flag AND a logged entry in design-decisions.md.' },
      {
        t: 'steps',
        items: [
          { n: '1', title: 'Requirements', desc: 'Cross-question transcript → features.md. Locked-in problem statement for this step.' },
          { n: '2', title: 'Architecting', desc: '≥2 architectural options with tradeoffs. Rejected options are recorded, not deleted.' },
          { n: '3', title: 'Product Specs', desc: 'UI, UX, entities, DB schema - everything the code needs to be unambiguous.' },
          { n: '4', title: 'Tech Specs', desc: 'Concrete stack + deploy targets; rejected alternatives noted.' },
          { n: '5', title: 'Planning', desc: 'Step-by-step plan with acceptance criteria; each step verifiable end-to-end.' },
          { n: '6', title: 'Writing Code', desc: 'Implement → test → refactor → memory update. Memory is written in a fixed order: context.md → features.md → design-decisions.md → learnings.md → CHANGELOG.md.' },
        ],
      },
      {
        t: 'callout',
        variant: 'note',
        label: 'Diff-scoped refactor',
        text: '/spec-refactor cleans only files touched by the current cycle. It refuses to open files outside the diff, and writes an audit log to .claude/refactor-audits/ so drift becomes observable at review time.',
      },
      { t: 'h2', id: 'maintenance', text: 'Maintenance skills' },
      { t: 'p', text: 'Four skills keep the project honest after the initial build.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-bug', desc: 'Reproduction-first bug workflow: recipe → failing regression test → smallest possible diff → CHANGELOG entry.' },
          { term: '/spec-docs', desc: 'Reconciles README + memory files against the code. Never modifies source. Flags features no longer present.' },
          { term: '/spec-refactor', desc: 'Diff-scoped cleanup. Only files in the current cycle’s changed list.' },
          { term: '/spec-sync', desc: 'Reconciles context.md drift and compresses any memory file past 1,500 lines with a compressed-from audit trail.' },
        ],
      },
    ],
  },

  'supporting-skills': {
    slug: 'supporting-skills',
    group: 'Skills',
    label: 'Skills',
    title: 'Skills',
    intro:
      'The Kit ships 24 skills: 9 core workflow skills that carry a project from requirements to shipped feature, plus 15 supporting skills invoked as needed across design, review, delivery, ideation, and continuity. Each reads the memory layer first and writes its findings or decisions back, so nothing drifts. Every skill is a slash command - "how to use it" is simply typing its name.',
    blocks: [
      {
        t: 'callout',
        variant: 'note',
        label: 'Spec-driven, not free-floating',
        text: 'Every skill anchors in claude/srs.md and claude/context.md before it acts, and records outcomes in the memory layer (design-decisions.md, context.md, or CHANGELOG.md). They extend the SDLC; they never bypass it.',
      },
      { t: 'h2', id: 'core', text: 'Core workflow' },
      { t: 'p', text: 'The spine of the SDLC - run them roughly in order. Each gates the next: you cannot plan before the spec is frozen, or build before the plan is written.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-init', desc: 'Scaffold the project tree inside an existing Claude session. Use when starting a new project or adopting the Kit in an empty directory.' },
          { term: '/spec-requirements', desc: 'Cross-questions you across five mandatory categories, then freezes claude/srs.md with BDD acceptance scenarios. Use first, before any design or code; refuses to proceed on empty load-bearing categories.' },
          { term: '/spec-design', desc: 'Extracts a design system from your references or infers one from the SRS - never fabricates brand colors. Use after requirements, before building UI.' },
          { term: '/spec-plan', desc: 'Produces an 8-10 step build plan, each stage standalone, testable, and runnable. Use after the SRS is frozen; refuses while load-bearing open questions remain.' },
          { term: '/spec-feature', desc: 'Runs the full 6-phase feature cycle (requirements → architecting → product specs → tech specs → planning → code). Use to build any feature end-to-end.' },
          { term: '/spec-refactor', desc: 'Cleans only the files changed in the current cycle, writing an audit trail. Use right after a feature cycle - never for repo-wide cleanups.' },
          { term: '/spec-bug', desc: 'Reproduction-first bug workflow: recipe → failing regression test → smallest fix → CHANGELOG entry. Use when something is broken; refuses without a reproduction.' },
          { term: '/spec-docs', desc: 'Reconciles README and memory files against the actual code; never touches source. Use when docs have drifted from reality.' },
          { term: '/spec-sync', desc: 'Reconciles context.md against the repo and compresses any memory file past 1,500 lines with an audit trail. Use when memory has drifted or grown large.' },
        ],
      },
      { t: 'h2', id: 'design', text: 'Design' },
      { t: 'p', text: 'Shape the structure before code is written. These decide what is allowed to know about what.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-architect', desc: 'Designs module, service, and layer boundaries from the forces most likely to change. Defaults to a modular monolith until measured evidence earns a split, and records every non-obvious choice as a 5-line ADR in design-decisions.md.' },
          { term: '/spec-db-design', desc: 'Designs and reviews the database schema - keys, foreign keys, constraints, and indexes for the real query shapes. Enforces invariants in the schema, not the app, and keeps every migration reversible and additive.' },
        ],
      },
      { t: 'h2', id: 'review', text: 'Review' },
      { t: 'p', text: 'Six lenses on a change, each labelling findings by severity and reviewing only the diff.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-review', desc: 'Multi-axis review across correctness, readability, architecture, security, and performance. Modes: code, pr, frontend, backend, and comments (which also rewrites drifted or verbose comments).' },
          { term: '/spec-code-quality', desc: 'Raises quality on code you write and runs a simplification pass - hierarchy of correct → honest → changeable → consistent, then small. Reports defects as input → wrong behavior → consequence.' },
          { term: '/spec-security', desc: 'Threat-models each trust boundary with STRIDE, then verifies the always-do controls. Gates new auth, data, or integration changes behind explicit human approval.' },
          { term: '/spec-performance', desc: 'Measurement-first: no optimization without a number, no “faster now” without a second number. Checks the database first, where the time usually is.' },
          { term: '/spec-test', desc: 'Judges tests by whether they would catch a regression, not by coverage percent. Flags missing edge and error cases and treats flakiness as a defect.' },
          { term: '/spec-ux', desc: 'Reviews usability and WCAG 2.1 AA accessibility against the SRS users and jobs-to-be-done - including the four states (empty, loading, error, populated) every data view needs.' },
        ],
      },
      { t: 'h2', id: 'delivery', text: 'Delivery' },
      { t: 'p', text: 'Move verified change safely from a branch to production.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-cicd', desc: 'Reviews and sets up the quality-gate pipeline - lint, types, tests, build, audit - wired to the project’s real commands. No gate is skippable.' },
          { term: '/spec-launch', desc: 'Promotes across dev → staging → production behind feature flags, with staged-rollout thresholds and a written rollback plan. Every launch is reversible, observable, and incremental.' },
          { term: '/spec-git', desc: 'Atomic commits, short-lived branches, and semantic-version releases where the tag is the source of truth. Scans for secrets before every commit.' },
        ],
      },
      { t: 'h2', id: 'ideation', text: 'Ideation' },
      { t: 'p', text: 'Widen the option space and bring the outside world in - before committing.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-brainstorm', desc: 'Diverges to 3-6 genuinely different approaches, then converges on a recommendation scored by fit, cost, risk, and reversibility. Never silently picks one.' },
          { term: '/spec-suggest', desc: 'Surfaces evidence-backed improvements ranked by leverage (impact vs effort), split into Now / Soon / Later. Advisory only - the owning skill does the work.' },
          { term: '/spec-research', desc: 'Gathers external knowledge or market intelligence with a cite-or-flag rule: every claim is either sourced or explicitly marked inference. Modes: knowledge and market.' },
        ],
      },
      { t: 'h2', id: 'continuity', text: 'Continuity' },
      { t: 'p', text: 'Survive an interruption without losing the thread.' },
      {
        t: 'defs',
        items: [
          { term: '/spec-resume', desc: 'Restores work stopped by a crash, dropped connection, lost context, or usage limits from a resumption brief in claude/resume.md - leading with the next action and never redoing verified work.' },
        ],
      },
      {
        t: 'callout',
        variant: 'tip',
        label: 'Modes',
        text: 'Skills with modes take the mode as an argument, e.g. /spec-review frontend or /spec-research market. Omit it to get the default (code review, knowledge research).',
      },
    ],
  },

  'design-prompt-library': {
    slug: 'design-prompt-library',
    group: 'Recipes',
    label: 'Design Prompt Library',
    title: 'Design Prompt Library',
    intro:
      'Curated prompts to feed /spec-design when a fresh visual language is needed. Each recipe is grounded in a concrete extraction goal so Claude does not hallucinate tokens or brand colors.',
    blocks: [
      { t: 'h2', id: 'reference-first', text: 'Reference-first extraction' },
      { t: 'p', text: 'When you already have a design you love - a product screenshot, a brand site, a Figma export - point /spec-design at it and let the skill extract tokens. This is the highest-fidelity route.' },
      { t: 'code', text: '/spec-design\n> Reference: ./references/monad.png\n> Extract tokens: colors, typography, spacing scale, border radii.\n> Rules: do not invent brand colors. If unclear, mark as INFERRED.' },
      { t: 'h2', id: 'inferred', text: 'Inferred from SRS' },
      { t: 'p', text: 'When no reference exists, the skill must infer a system from the SRS. Anchor the inference in specific SRS clauses so the choices are traceable.' },
      { t: 'code', text: '/spec-design\n> No reference. Infer from:\n>   - Product tone in srs.md §1.2 ("token-lean, deterministic")\n>   - Target audience in srs.md §2 ("engineers, students")\n>   - Constraint in srs.md §4.1 ("zero JS runtime dependencies")\n> Rules: propose a single dominant surface + accent; label every choice with the SRS clause that motivated it.' },
      { t: 'h2', id: 'component-focus', text: 'Component-scoped recipes' },
      { t: 'p', text: 'Once tokens exist, drive component-level design by naming the surface, the states, and the accessibility floor.' },
      {
        t: 'list',
        items: [
          'Buttons - primary, secondary, ghost; hover / active / disabled; contrast ≥ WCAG AA.',
          'Forms - text input, textarea, select; error / helper / success states; keyboard focus visible.',
          'Cards - default, hover, selected; explicit shadow tokens; safe padding scale.',
          'Nav - top bar, sidebar, breadcrumb; active-state, current-page semantics.',
        ],
      },
      { t: 'h2', id: 'refusal', text: 'When to refuse' },
      { t: 'p', text: 'The skill refuses to fabricate brand colors when a reference is supplied. If your reference is ambiguous (bad photo, low-res crop, mixed brand kit), fix the reference before running the skill; do not ask it to guess.' },
      {
        t: 'callout',
        variant: 'warn',
        label: 'No fabricated brand colors',
        text: 'FR-DESIGN-04 mandates that /spec-design refuse to invent brand colors when a reference is provided. If the reference is incomplete, the skill will halt and ask.',
      },
    ],
  },

  'learning-map': {
    slug: 'learning-map',
    group: 'Recipes',
    label: 'Learning Map',
    title: 'Learning Map',
    intro:
      'For the Student persona: the sequence of concepts you traverse while shipping a first real project through Throughspec. Each concept is answered in learnings.md as you go.',
    blocks: [
      { t: 'h2', id: 'deciding', text: 'Deciding' },
      {
        t: 'defs',
        items: [
          { term: 'What is a spec?', desc: 'A frozen artifact that turns interpretation into agreement. Everything downstream is traceable back to a clause.' },
          { term: 'Cross-questioning', desc: 'Why we do ≥3 rounds before writing code. The technique is older than software; the enforcement is new.' },
          { term: 'Load-bearing categories', desc: 'Users, jobs-to-be-done, success metric, constraints, non-goals. Skip one and the code drifts.' },
        ],
      },
      { t: 'h2', id: 'designing', text: 'Designing' },
      {
        t: 'defs',
        items: [
          { term: 'Design tokens', desc: 'Named values (colors, spacing, type) that let a system stay consistent even as components change.' },
          { term: 'Reference-driven vs inferred', desc: 'When to trust a reference vs invent from constraints. And when to refuse to invent.' },
          { term: 'Surfaces', desc: 'The map of physical UI regions - nav, content, marginalia. Design happens per surface, not per page.' },
        ],
      },
      { t: 'h2', id: 'planning', text: 'Planning' },
      {
        t: 'defs',
        items: [
          { term: 'Step-by-step plan', desc: 'Why 8-10 steps, each with a standalone-testable-runnable deliverable. Each step ships or the plan is wrong.' },
          { term: 'Acceptance criteria', desc: 'Turning "make it work" into a runnable test. Weak criteria demand constant clarification.' },
          { term: 'Effort bands', desc: 'S / M / L relative sizing. Absolute time estimates lie; relative sizing survives.' },
        ],
      },
      { t: 'h2', id: 'building', text: 'Building' },
      {
        t: 'defs',
        items: [
          { term: 'The 6 steps', desc: 'Requirements → Architecting → Product → Tech → Planning → Writing Code. Ordered because each depends on the previous.' },
          { term: 'Sub-agents', desc: 'Tool-scoped actors. spec-interrogator can only Read. spec-coder can Write. Least-privilege by construction.' },
          { term: 'Memory-update order', desc: 'context.md first, CHANGELOG.md last. Why the order matters when compaction runs.' },
        ],
      },
      { t: 'h2', id: 'maintaining', text: 'Maintaining' },
      {
        t: 'defs',
        items: [
          { term: 'Reproduction-first bug fixing', desc: 'The recipe IS the regression test. No recipe → no fix cycle.' },
          { term: 'Diff-scoped refactor', desc: 'Cleaning only what you touched. Compensating audit log makes drift observable.' },
          { term: 'Compression', desc: '/spec-sync folds oldest entries with a compressed-from block. Recency stays verbatim.' },
        ],
      },
      {
        t: 'callout',
        variant: 'tip',
        label: 'Write it down',
        text: 'After every step, ask Claude "Why this step?" and append the answer to learnings.md. Six months later, that log is worth more than the code.',
      },
    ],
  },

  'customization-recipes': {
    slug: 'customization-recipes',
    group: 'Recipes',
    label: 'Customization Recipes',
    title: 'Customization Recipes',
    intro:
      'Everything you can change without editing skill sources. Persona and integrations live behind spec-init customize; day-to-day preferences live in spec.config.js.',
    blocks: [
      { t: 'h2', id: 'spec-config', text: 'Edit spec.config.js' },
      { t: 'p', text: 'spec.config.js is the friendly front door to your project preferences. Claude reads it at the start of every session (see CLAUDE.md section 2) and honors it - no build step, and the CLI never parses it, so an edit can never break your scaffold. Use it to disable skills you do not want, tune the workflow, or add project-wide instructions.' },
      { t: 'code', text: "module.exports = {\n  skills: { disabled: ['spec-market-research'] },\n  workflow: { phases: ['requirements','design','plan','feature'], allowSkip: false },\n  settings: {\n    commitSuggestions: true,\n    customInstructions: ['Prefer Drizzle over Prisma'],\n  },\n};" },
      {
        t: 'callout',
        variant: 'note',
        label: 'Config vs customize',
        text: 'spec.config.js holds advisory preferences Claude honors. Persona and integrations are machine-managed state - change those with spec-init customize, not in the config file.',
      },
      { t: 'h2', id: 'swap-persona', text: 'Swap the persona' },
      { t: 'p', text: 'Persona drives CLAUDE.md verbosity and the "Why this step?" annotations. Swap safely - customize re-derives CLAUDE.md from the pristine .spec-init/base/ snapshot.' },
      { t: 'code', text: '# switch from engineer to student\nspec-init customize --persona student' },
      {
        t: 'callout',
        variant: 'warn',
        label: 'Replays CLAUDE.md',
        text: '--persona rewrites CLAUDE.md from the snapshot. User edits below the persona block are preserved; edits inside the persona block are replayed.',
      },
      { t: 'h2', id: 'toggle-integrations', text: 'Toggle integrations' },
      { t: 'p', text: 'Graphify and Obsidian are additive. Toggling on drops in their config files and integration sections; toggling off removes both, leaving zero residual files.' },
      { t: 'code', text: '# add\nspec-init customize --add graphify\nspec-init customize --add obsidian\n\n# remove\nspec-init customize --remove obsidian' },
      {
        t: 'callout',
        variant: 'note',
        label: 'Surgical re-derive',
        text: '--add / --remove only replays files whose snapshot content contains that integration’s marker. Memory files without the marker are untouched.',
      },
      { t: 'h2', id: 'add-skill', text: 'Drop in a skill' },
      { t: 'p', text: 'Copy a skill definition from the payload catalog into your project’s .claude/skills/ directory. Custom same-named files override defaults.' },
      { t: 'code', text: 'spec-init add-skill spec-requirements\n# then edit .claude/skills/spec-requirements/SKILL.md' },
      { t: 'h2', id: 'upgrade', text: 'Upgrade safely' },
      { t: 'p', text: 'A newer template payload merges through a three-way merge against the pristine snapshot. Conflicts surface as git-style fences for manual resolution - never silent overwrites.' },
      { t: 'code', text: 'spec-init upgrade\n# review conflicts, then\ngit add . && git commit -m "chore: template upgrade"' },
      { t: 'h2', id: 'diagnose', text: 'Diagnose drift' },
      { t: 'p', text: 'doctor cross-checks the SRS §6 required-file list, the template-version field, and the .spec-init/base/ snapshot. Run it after any manual edit to CLAUDE.md.' },
      { t: 'code', text: 'spec-init doctor\n# ✓ CLAUDE.md present\n# ✓ template-version 1.0.0\n# ✓ .spec-init/base/ snapshot intact' },
    ],
  },
};
