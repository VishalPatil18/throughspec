import Link from 'next/link';
import DataFlowSVG from '@/components/landing/DataFlowSVG';
import PhaseCycler from '@/components/landing/PhaseCycler';
import FadeIn from '@/components/motion/FadeIn';
import CopyableCommand from '@/components/CopyableCommand';
import s from '@/components/landing/landing.module.css';
import { SITE_VERSION } from '@/lib/version';

const PERSONAS = ['Vibe-coders', 'Students', 'Solo engineers', 'Team leads'];

const BELIEFS = [
  {
    num: '01 / SPEC',
    title: 'Spec beats vibe.',
    body: 'Cross-questioning before code beats open-ended prompting. Throughspec makes a complete spec a precondition - it refuses to proceed without one.',
  },
  {
    num: '02 / MEMORY',
    title: 'Memory beats re-derivation.',
    body: 'Re-reading source to reconstruct intent is a token tax. The Kit invests once in condensed memory files and amortizes that across every prompt.',
  },
  {
    num: '03 / STRUCTURE',
    title: 'Structure compounds.',
    body: 'A predictable layout means skills, agents, and humans all know where to look. The Kit refuses to ship freeform - structure is the product.',
  },
];

const STEPS = [
  { num: '01', cmd: 'spec-init <name>', desc: 'Scaffolds the canonical directory tree with safe, lint-clean defaults - in under five seconds.' },
  { num: '02', cmd: '/spec-requirements', desc: 'Three-plus rounds of cross-questioning, then freezes claude/srs.md. Won’t proceed on empty load-bearing categories.' },
  { num: '03', cmd: '/spec-design', desc: 'Extracts a design system from your references, or proposes one from the SRS - never fabricates brand colors.' },
  { num: '04', cmd: '/spec-plan', desc: 'Produces an 8-10 step build plan, each ending in a standalone, testable, runnable deliverable.' },
  { num: '05', cmd: '/spec-feature', desc: 'Enters the feature cycle, one step at a time - read memory, cross-question, implement, test, refactor.' },
];

const MEMORY = [
  { file: 'CLAUDE.md', role: 'router + behavior contract' },
  { file: 'context.md', role: 'compressed current state' },
  { file: 'srs.md', role: 'frozen requirements' },
  { file: 'plan.md', role: '8-10 step plan' },
  { file: 'features.md', role: 'append-only feature log' },
  { file: 'design-decisions.md', role: 'append-only decisions' },
];

const SKILLS = [
  { cmd: '/spec-init', desc: 'Scaffold the project inside an existing Claude session.' },
  { cmd: '/spec-requirements', desc: 'Build claude/srs.md via cross-questioning.' },
  { cmd: '/spec-design', desc: 'Build design/design.md and download UI assets.' },
  { cmd: '/spec-plan', desc: 'Build claude/plan.md with 8-10 step deliverables.' },
  { cmd: '/spec-feature', desc: 'Run the full feature development cycle.' },
  { cmd: '/spec-refactor', desc: 'Clean only the current cycle’s diff - nothing else.' },
  { cmd: '/spec-bug', desc: 'Isolated bug resolution: reproduce, test, smallest fix.' },
  { cmd: '/spec-docs', desc: 'Reconcile docs against reality - never touches source.' },
  { cmd: '/spec-sync', desc: 'Reconcile context.md against actual repo state.' },
];

const INTEGRATIONS = [
  {
    name: 'Graphify',
    glyph: '◈',
    desc: 'Treat the codebase as a queryable knowledge graph. Claude prefers Graphify queries over full-repo greps when available.',
    flag: '--integrations graphify',
    link: 'https://graphify.net/',
    linkLabel: 'graphify.net',
  },
  {
    name: 'Obsidian',
    glyph: '◉',
    desc: 'Visualize the claude/ and design/ markdown corpus as a navigable graph, with front-matter conventions baked in.',
    flag: '--integrations obsidian',
    link: 'https://obsidian.md/',
    linkLabel: 'obsidian.md',
  },
  {
    name: 'Caveman',
    glyph: '◆',
    desc: 'Ultra-compressed “caveman” replies cut output tokens ~65% while keeping code, commands, and errors byte-exact.',
    flag: '--integrations caveman',
    link: 'https://github.com/JuliusBrussee/caveman',
    linkLabel: 'GitHub',
  },
  {
    name: 'agentmemory',
    glyph: '▣',
    desc: 'Persistent cross-session memory - captures decisions and project context, then injects the relevant slice back at session start.',
    flag: '--integrations agentmemory',
    link: 'https://github.com/rohitg00/agentmemory',
    linkLabel: 'GitHub',
  },
  {
    name: 'openwiki',
    glyph: '◍',
    desc: 'Auto-generates an agent-facing documentation wiki for the codebase, so Claude reads structured context before a broad grep.',
    flag: '--integrations openwiki',
    link: 'https://github.com/langchain-ai/openwiki',
    linkLabel: 'GitHub',
  },
  {
    name: 'ponytail',
    glyph: '⬡',
    desc: 'A code-minimalism ruleset - the agent runs a YAGNI ladder and writes the least code necessary, no over-engineering.',
    flag: '--integrations ponytail',
    link: 'https://github.com/DietrichGebert/ponytail',
    linkLabel: 'GitHub',
  },
  {
    name: 'Open Code Review',
    glyph: '◐',
    desc: 'AI code-review CLI (ocr) with line-level findings on diffs and files - run it pre-push or in CI alongside /spec-review.',
    flag: '--integrations opencodereview',
    link: 'https://github.com/alibaba/open-code-review',
    linkLabel: 'GitHub',
  },
];

const FAQS = [
  {
    q: 'Does Throughspec replace Claude Code?',
    a: 'No. The Kit composes on top of Claude Code’s permission, hook, and settings model - it scaffolds process, not application source, and never hosts or runs Claude Code itself.',
  },
  {
    q: 'How does it keep token cost flat as a project matures?',
    a: 'A condensed context.md replaces N file scans per prompt, refactors are diff-scoped, memory logs are append-only, and /spec-sync compresses any memory file past 1,500 lines. Target: a 5th feature cycle costs ≤120% of the first.',
  },
  {
    q: 'Can I skip cross-questioning to go faster?',
    a: 'No. The requirements skill refuses to proceed until target users, jobs-to-be-done, the primary success metric, hard constraints, and non-goals are all filled. Overrides require an explicit, logged decision.',
  },
  {
    q: 'npm or PyPI?',
    a: 'Both. npx spec-init for Node ≥18, pipx install spec-init for Python ≥3.10. A single source-of-truth template tree feeds both channels, so they never drift.',
  },
  {
    q: 'What about my edits when I upgrade?',
    a: 'The upgrade command never overwrites your content - it does a three-way merge and surfaces conflicts for manual resolution. Every workflow is also resumable if interrupted.',
  },
  {
    q: 'Is it cross-platform?',
    a: 'Yes - macOS, Linux, and Windows (PowerShell + WSL), with no compiled native binary required at install time.',
  },
];

export default function Landing() {
  return (
    <main className="overflow-x-hidden bg-warm font-serif text-ink">
      {/* HERO */}
      <section className="mx-auto max-w-content px-8 pb-6 pt-20 text-center">
        <FadeIn className="mb-[34px] inline-flex items-center gap-[9px] rounded-pill border border-ink px-4 py-[7px] text-xs tracking-[0.01em]">
          <span className="inline-block h-1.5 w-1.5 rounded-pill bg-ink" />
          SPEC-DRIVEN SDLC · FOR CLAUDE CODE
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="mx-auto mb-[26px] max-w-[920px] text-[74px] font-normal leading-[1.08] tracking-tighter2">
            Collapse the gap between
            <br />
            idea and shipped software.
          </h1>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="mx-auto mb-9 max-w-[600px] text-[17px] leading-[1.5] tracking-tighter2 text-muted">
            Throughspec scaffolds a deterministic, spec-first workflow into Claude Code. You make the
            decisions. Claude does the heavy lifting. Structure keeps the work from drifting.
          </p>
        </FadeIn>
        <FadeIn delay={0.18} className="flex flex-wrap items-center justify-center gap-[13px]">
          <Link
            href="/docs/"
            className="inline-flex items-center gap-2 rounded-pill bg-dark px-3 py-2 text-sm font-medium text-warm no-underline"
          >
            Get started <span className="text-[15px]" aria-hidden>&rsaquo;</span>
          </Link>
          <Link
            href="/docs/"
            className="rounded-pill border border-ink px-3 py-2 text-sm font-medium text-ink no-underline"
          >
            Read the docs
          </Link>
        </FadeIn>
        <FadeIn delay={0.24} className="mt-[26px] w-auto inline-flex items-center gap-3 rounded-[10px] border border-ink bg-white px-2 py-2 text-[13.5px]">
          <span className="text-dim">$</span>
          <CopyableCommand text="npx spec-init my-app">
            <span>npx spec-init my-app</span>
          </CopyableCommand>
        </FadeIn>
        <FadeIn delay={0.3} className="mt-4">
          <Link
            href="/changelog/"
            className="inline-flex items-center gap-2 rounded-pill border border-ink/15 px-3 py-1.5 text-xs tracking-[0.01em] text-muted no-underline hover:text-ink"
          >
            <span className="rounded-pill bg-ink px-1.5 py-0.5 text-[10px] font-medium text-warm">
              New
            </span>
            v{SITE_VERSION} — create-app shorthand &amp; conflict-free upgrades
            <span aria-hidden>&rsaquo;</span>
          </Link>
        </FadeIn>
      </section>

      {/* DATA FLOW DIAGRAM */}
      <FadeIn as="section" delay={0.3} className="mx-auto max-w-content px-6 pb-2 pt-6">
        <DataFlowSVG />
        <div className="mx-auto mt-[6px] flex max-w-[1180px] justify-between text-[11px] uppercase tracking-[0.04em] text-dim">
          <span>Your decisions</span>
          <span>Deterministic SDLC</span>
          <span>Shipped, with memory</span>
        </div>
      </FadeIn>

      {/* PERSONAS */}
      <section className="mx-auto max-w-content px-8 py-16 text-center">
        <FadeIn className="mb-6 text-xs uppercase tracking-[0.06em] text-dim">
          Built for the way you actually build
        </FadeIn>
        <FadeIn delay={0.05} className="flex flex-wrap justify-center gap-[14px]">
          {PERSONAS.map((p) => (
            <div key={p} className="flex items-center gap-[9px] rounded-pill border border-ink px-5 py-[10px] text-[13px]">
              <span className="inline-block h-[5px] w-[5px] rounded-pill bg-ink" />
              {p}
            </div>
          ))}
        </FadeIn>
      </section>

      {/* THREE BELIEFS */}
      <section className="mx-auto max-w-content px-8 pb-6 pt-10">
        <FadeIn className="mb-12 text-center">
          <h2 className="mb-[14px] text-[44px] font-normal tracking-tighter2">Three load-bearing beliefs</h2>
          <p className="text-base tracking-tighter2 text-muted">Everything in the Kit is downstream of these.</p>
        </FadeIn>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BELIEFS.map((b, i) => (
            <FadeIn
              key={b.num}
              delay={i * 0.08}
              className="rounded-[40px] bg-cloud p-10 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
            >
              <div className="mb-6 text-xs text-muted">{b.num}</div>
              <h3 className="mb-[14px] text-[26px] font-normal leading-[1.15] tracking-tighter2">{b.title}</h3>
              <p className="text-[14.5px] leading-[1.5] tracking-tighter2 text-muted">{b.body}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-content px-8 py-[72px]">
        <FadeIn className="mb-11">
          <div className="mb-[14px] text-xs uppercase tracking-[0.06em] text-dim">The initiation cycle</div>
          <h2 className="max-w-[640px] text-[44px] font-normal tracking-tighter2">
            Five commands from empty folder to your first feature.
          </h2>
        </FadeIn>
        <div className="flex flex-col">
          {STEPS.map((step, i) => (
            <FadeIn
              key={step.num}
              delay={i * 0.05}
              className="grid grid-cols-[64px_220px_1fr] items-center gap-6 border-t border-black/10 py-[26px]"
            >
              <div className="text-sm text-dim">{step.num}</div>
              <CopyableCommand
                text={step.cmd}
                className="justify-self-start rounded-lg border border-ink bg-white px-3 py-2 text-[15px] text-ink"
              />
              <div className="text-[15px] leading-[1.45] tracking-tighter2 text-muted">{step.desc}</div>
            </FadeIn>
          ))}
          <div className="border-t border-black/10" />
        </div>
      </section>

      {/* FEATURE CYCLE */}
      <section className="mx-auto max-w-content px-8 pb-[72px] pt-6">
        <FadeIn className="mb-11 text-center">
          <div className="mb-[14px] text-xs uppercase tracking-[0.06em] text-dim">The feature cycle</div>
          <h2 className="mb-3 text-[44px] font-normal tracking-tighter2">No step skipped. No code unspecced.</h2>
          <p className="text-base tracking-tighter2 text-muted">
            <code className="font-mono text-sm">/spec-feature</code> runs six ordered steps, every time.
          </p>
        </FadeIn>
        <FadeIn delay={0.05}>
          <PhaseCycler />
        </FadeIn>
      </section>

      {/* MEMORY LAYER */}
      <section className="mx-auto max-w-content px-8 pb-[72px]">
        <FadeIn className="grid grid-cols-1 items-center gap-12 rounded-[40px] bg-cloud p-12 shadow-[0_0_10px_rgba(0,0,0,0.1)] md:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-[18px] text-xs uppercase tracking-[0.06em] text-muted">The memory layer</div>
            <h2 className="mb-4 text-[38px] font-normal leading-[1.12] tracking-tighter2">Memory beats re-derivation.</h2>
            <p className="mb-[26px] max-w-[420px] text-[15px] leading-[1.55] tracking-tighter2 text-muted">
              Re-reading source to reconstruct intent is a token tax. Throughspec writes condensed memory once - then
              every prompt reads the snapshot instead of re-scanning the repo.
            </p>
            <div className="flex flex-col gap-2">
              {MEMORY.map((m) => (
                <div key={m.file} className="flex items-center gap-3 rounded-[10px] bg-white/50 px-[14px] py-[11px]">
                  <code className="font-mono text-[13px] text-ink">{m.file}</code>
                  <span className="text-[12.5px] text-muted">- {m.role}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`relative h-[340px] overflow-hidden rounded-[28px] ${s.memoryArt}`}>
            <div className={`absolute left-12 top-10 h-[150px] w-[150px] rounded-pill bg-white/40 ${s.floatSlow}`} />
            <div className={`absolute bottom-12 right-16 h-[90px] w-[90px] rounded-3xl bg-white/30 ${s.floatMed}`} />
            <div className={`absolute right-[-40px] top-[70px] h-[200px] w-[200px] rounded-pill border border-black/20 ${s.spin26slow}`} />
            <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.04em] text-black/50">
              ~8k token ceiling
            </div>
          </div>
        </FadeIn>
      </section>

      {/* SKILLS GRID */}
      <section className="mx-auto max-w-content px-8 pb-[72px]">
        <FadeIn className="mb-10">
          <div className="mb-[14px] text-xs uppercase tracking-[0.06em] text-dim">Skills catalog</div>
          <h2 className="max-w-[680px] text-[44px] font-normal tracking-tighter2">
            Twenty-four skills. One for every move you make.
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {SKILLS.slice(0, 6).map((sk, i) => (
            <FadeIn key={sk.cmd} delay={i * 0.04} className="rounded-2xl border border-ink bg-warm p-[18px]">
              <code className="font-mono text-[13.5px] text-ink">{sk.cmd}</code>
              <div className="mt-[7px] text-[12.5px] leading-[1.5] tracking-tighter2 text-muted">{sk.desc}</div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.1} className="mt-8 flex justify-center">
          <Link
            href="/docs/supporting-skills/"
            className="inline-flex items-center gap-2 rounded-pill border border-ink px-5 py-2 text-sm font-medium text-ink no-underline transition-colors hover:bg-ink hover:text-warm"
          >
            Check all skills <span className="text-[15px]" aria-hidden>&rsaquo;</span>
          </Link>
        </FadeIn>
      </section>

      {/* INTEGRATIONS */}
      <section className="mx-auto max-w-content px-8 pb-[72px]">
        <FadeIn className="mb-10">
          <div className="mb-[14px] text-xs uppercase tracking-[0.06em] text-dim">Integrations</div>
          <h2 className="max-w-[680px] text-[44px] font-normal tracking-tighter2">
            Optional integrations, one flag away.
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {INTEGRATIONS.slice(0, 4).map((ig, i) => (
            <FadeIn key={ig.name} delay={i * 0.06} className="rounded-2xl border border-ink bg-warm p-6">
              <div className="mb-3 flex items-center gap-[10px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink text-[15px]">
                  {ig.glyph}
                </div>
                <div className="text-lg tracking-tighter2">{ig.name}</div>
              </div>
              <p className="mb-[14px] text-[13px] leading-[1.5] tracking-tighter2 text-muted">{ig.desc}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <CopyableCommand
                  text={ig.flag}
                  className="inline-block rounded-lg border border-ink bg-white px-2.5 py-1.5 text-[12px]"
                />
                <a
                  href={ig.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] tracking-tighter2 text-muted no-underline hover:text-ink"
                >
                  {ig.linkLabel} <span aria-hidden>&#8599;</span>
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.1} className="mt-8 flex justify-center">
          <Link
            href="/docs/integrations/"
            className="inline-flex items-center gap-2 rounded-pill border border-ink px-5 py-2 text-sm font-medium text-ink no-underline transition-colors hover:bg-ink hover:text-warm"
          >
            Check all integrations <span className="text-[15px]" aria-hidden>&rsaquo;</span>
          </Link>
        </FadeIn>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[820px] px-8 pb-[72px] pt-2">
        <FadeIn className="mb-10 text-center">
          <h2 className="text-[44px] font-normal tracking-tighter2">Questions, answered</h2>
        </FadeIn>
        <FadeIn delay={0.05}>
          {FAQS.map((f) => (
            <details key={f.q} className="border-b border-black/20">
              <summary className="flex items-center justify-between px-1 py-6 text-base tracking-tighter2">
                <span>{f.q}</span>
                <span data-pm className="text-[22px] font-normal leading-none">+</span>
              </summary>
              <div className="max-w-[680px] px-1 pb-6 text-[14.5px] leading-[1.6] tracking-tighter2 text-muted">
                {f.a}
              </div>
            </details>
          ))}
        </FadeIn>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-content px-8 pb-[88px]">
        <FadeIn className="rounded-[40px] bg-dark px-12 py-[72px] text-center">
          <h2 className="mb-4 text-[52px] font-normal leading-[1.08] tracking-tighter2 text-warm">
            Ship your next project
            <br />
            on rails.
          </h2>
          <p className="mb-8 text-base tracking-tighter2 text-[#b9b6b4]">Spec-driven. Drift-proof. Token-lean.</p>
          <div className="mb-[26px] flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/"
              className="inline-flex items-center gap-2 rounded-pill bg-warm px-3 py-2 text-sm font-medium text-ink no-underline"
            >
              Get started <span className="text-[15px]" aria-hidden>&rsaquo;</span>
            </Link>
            <Link
              href="/why/"
              className="rounded-pill border border-warm/50 px-3 py-2 text-sm font-medium text-warm no-underline"
            >
              Why Throughspec
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-[10px]">
            <CopyableCommand
              text="npx spec-init my-app"
              tone="dark"
              className="rounded-lg border border-warm/25 bg-warm/10 px-[14px] py-2 text-[12.5px] text-warm"
            />
            <CopyableCommand
              text="pipx install spec-init"
              tone="dark"
              className="rounded-lg border border-warm/25 bg-warm/10 px-[14px] py-2 text-[12.5px] text-warm"
            />
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
