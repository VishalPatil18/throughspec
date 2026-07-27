import Link from 'next/link';
import FadeIn from '@/components/motion/FadeIn';
import CopyableCommand from '@/components/CopyableCommand';

export const metadata = {
  title: 'Features',
  description:
    'Everything Throughspec installs so your project never drifts: deterministic SDLC, token-lean memory layer, nine slash commands, and the structural guarantees that hold it together.',
};

const BIG_FEATURES = [
  {
    kicker: 'Deterministic SDLC',
    title: 'A spec-first pipeline that refuses to skip steps.',
    body: 'Every feature runs through six ordered steps. The plan won’t generate while the SRS has open questions in load-bearing categories - structure is enforced, not suggested.',
    points: [
      'Requirements gate blocks code without a frozen spec',
      '6 steps: requirements → architecting → product → tech → plan → build',
      'Every override is logged in design-decisions.md',
    ],
    tone: 'cream' as const,
    art: `/spec-feature\n  1 requirements  ✓\n  2 architecting  ✓\n  3 product-spec  ✓\n  4 tech-spec     ✓\n  5 planning      ✓\n  6 writing-code  ▶`,
  },
  {
    kicker: 'The memory layer',
    title: 'Condensed memory, written once, read forever.',
    body: 'Re-reading source to reconstruct intent is a token tax. The Kit writes append-only memory files and reads a compressed snapshot instead of re-scanning the repo.',
    points: [
      'CLAUDE.md + context.md stay under 8k tokens',
      'Append-only logs for features and decisions',
      '/spec-sync compresses any file past 1,500 lines',
    ],
    tone: 'lavender' as const,
    art: `claude/\n  context.md          state\n  srs.md              frozen\n  plan.md             8-10 steps\n  features.md         append-only\n  design-decisions.md append-only\n  learnings.md        append-only`,
  },
  {
    kicker: 'Structure that compounds',
    title: 'A canonical tree every skill and human can navigate.',
    body: 'A predictable layout means agents and people always know where to look. The Kit scaffolds it in under five seconds with lint-clean defaults.',
    points: [
      'Same tree on npm and PyPI - never drifts',
      'Resumable workflows if interrupted',
      'Three-way merge on upgrade - never clobbers your edits',
    ],
    tone: 'cream' as const,
    art: `npx spec-init my-app\n\n├─ claude/\n├─ design/\n├─ CLAUDE.md\n├─ CHANGELOG.md\n└─ README.md\n\n✓ ready in 4.2s`,
  },
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
  { cmd: '/spec-architect', desc: 'Design module/service/layer boundaries and record ADRs.' },
  { cmd: '/spec-db-design', desc: 'Design and review schema, constraints, and migrations.' },
  { cmd: '/spec-review', desc: 'Multi-axis review: code, PR, frontend, backend, comments.' },
  { cmd: '/spec-code-quality', desc: 'Raise code quality and run a simplification pass.' },
  { cmd: '/spec-security', desc: 'Threat-model and harden against vulnerabilities.' },
  { cmd: '/spec-performance', desc: 'Measurement-first optimization with before/after numbers.' },
  { cmd: '/spec-test', desc: 'Review coverage by whether tests catch regressions.' },
  { cmd: '/spec-ux', desc: 'Review usability and WCAG accessibility.' },
  { cmd: '/spec-cicd', desc: 'Review or set up CI/CD quality gates.' },
  { cmd: '/spec-launch', desc: 'Staged rollout across environments with a rollback plan.' },
  { cmd: '/spec-git', desc: 'Commit, branch, merge, rebase, tag, and release.' },
  { cmd: '/spec-brainstorm', desc: 'Generate options with explicit tradeoffs.' },
  { cmd: '/spec-suggest', desc: 'Leverage-ranked, evidence-backed suggestions.' },
  { cmd: '/spec-research', desc: 'External knowledge or market research, cited.' },
  { cmd: '/spec-resume', desc: 'Resume interrupted work from a resumption brief.' },
];

const GUARANTEES = [
  { stat: '≤ 8k', label: 'tokens to load full project context on a mature repo' },
  { stat: '≤ 120%', label: 'cost of a 5th feature cycle vs. the first' },
  { stat: '6', label: 'ordered steps, none skipped without a logged override' },
  { stat: '2', label: 'channels - npm + PyPI - from one source of truth' },
];

export default function FeaturesPage() {
  return (
    <main className="bg-warm font-serif text-ink">
      <section className="mx-auto max-w-content px-8 pb-10 pt-[72px]">
        <FadeIn className="mb-[18px] text-xs uppercase tracking-[0.06em] text-dim">Features</FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="mb-5 max-w-[820px] text-[58px] font-normal leading-[1.08] tracking-tighter2">
            Everything the Kit installs so your project never drifts.
          </h1>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="max-w-[600px] text-[17px] leading-[1.55] tracking-tighter2 text-muted">
            A deterministic SDLC, a token-lean memory layer, nine slash commands, and the structural guarantees that hold
            it all together.
          </p>
        </FadeIn>
      </section>

      <section id="graphify" className="mx-auto flex max-w-content flex-col gap-5 px-8 py-6">
        {BIG_FEATURES.map((f, i) => (
          <FadeIn
            key={f.title}
            delay={i * 0.06}
            className={
              'grid grid-cols-1 overflow-hidden rounded-[40px] md:grid-cols-2 ' +
              (f.tone === 'cream' ? 'border border-ink bg-warm' : 'bg-cloud')
            }
            id={i === 1 ? 'obsidian' : undefined}
          >
            <div className="p-12">
              <div className="mb-4 text-xs uppercase tracking-[0.06em] text-muted">{f.kicker}</div>
              <h2 className="mb-4 text-[34px] font-normal leading-[1.12] tracking-tighter2">{f.title}</h2>
              <p className="mb-[22px] max-w-[440px] text-[15px] leading-[1.6] tracking-tighter2 text-muted">
                {f.body}
              </p>
              <div className="flex flex-col gap-[9px]">
                {f.points.map((pt) => (
                  <div key={pt} className="flex items-start gap-[11px] text-sm leading-[1.5] tracking-tighter2 text-[#3d3d3d]">
                    <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-pill bg-ink" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className={
                'flex items-center overflow-x-auto p-12 ' +
                (f.tone === 'cream' ? 'border-l border-ink bg-white' : 'bg-white/45')
              }
            >
              <pre className="m-0 whitespace-pre font-mono text-[12.5px] leading-[1.7] text-ink">{f.art}</pre>
            </div>
          </FadeIn>
        ))}
      </section>

      <section className="mx-auto max-w-content px-8 py-12">
        <FadeIn className="mb-9">
          <div className="mb-[14px] text-xs uppercase tracking-[0.06em] text-dim">Twenty-four slash commands</div>
          <h2 className="text-[40px] font-normal tracking-tighter2">One command for every move you make.</h2>
        </FadeIn>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SKILLS.map((sk, i) => (
            <FadeIn key={sk.cmd} delay={i * 0.04} className="rounded-3xl border border-ink bg-warm p-6">
              <code className="font-mono text-[15px] text-ink">{sk.cmd}</code>
              <div className="mt-3 text-[13px] leading-[1.5] tracking-tighter2 text-muted">{sk.desc}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-8 pb-12 pt-6">
        <FadeIn className="mb-10 text-center">
          <h2 className="mb-3 text-[40px] font-normal tracking-tighter2">Guarantees, not vibes.</h2>
          <p className="text-base tracking-tighter2 text-muted">Measurable commitments the Kit holds itself to.</p>
        </FadeIn>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {GUARANTEES.map((g, i) => (
            <FadeIn key={g.label} delay={i * 0.04} className="rounded-[28px] bg-cloud px-7 py-8">
              <div className="mb-[10px] text-[40px] tracking-[-0.03em]">{g.stat}</div>
              <div className="text-[13.5px] leading-[1.5] tracking-tighter2 text-muted">{g.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-8 pb-20 pt-6">
        <FadeIn className="rounded-[40px] bg-dark px-12 py-16 text-center">
          <h2 className="mb-6 text-[44px] font-normal leading-[1.1] tracking-tighter2 text-warm">
            Read the docs. Run the cycle.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/"
              className="rounded-pill bg-warm px-3 py-2 text-sm font-medium text-ink no-underline"
            >
              Get started &rsaquo;
            </Link>
            <Link
              href="/why/"
              className="rounded-pill border border-warm/50 px-3 py-2 text-sm font-medium text-warm no-underline"
            >
              Why Throughspec
            </Link>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
