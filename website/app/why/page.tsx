import Link from 'next/link';
import FadeIn from '@/components/motion/FadeIn';

export const metadata = {
  title: 'Why Throughspec',
  description:
    'Open-ended prompting drifts. Context cost balloons. Decisions get lost. Throughspec replaces all three with a process that compounds.',
};

const BEFORE = [
  'Open-ended prompts wander off intent with no spec to anchor them.',
  'Every prompt re-scans the repo - context cost grows with the codebase.',
  'Architectural decisions live only in chat history, then vanish.',
  'No predictable layout, so skills and humans hunt for everything.',
];

const AFTER = [
  'A frozen SRS gates code - cross-questioning happens before generation.',
  'A compressed context.md replaces N file scans per prompt.',
  'Every decision is appended to design-decisions.md, with rejected alternatives.',
  'One canonical tree - agents and people always know where to look.',
];

const BELIEFS = [
  {
    num: '01 / SPEC',
    title: 'Spec beats vibe.',
    body: 'Cross-questioning before code generation produces better software than open-ended prompting. So the Kit makes a complete spec a precondition - it refuses to proceed without one, and won’t let you skip the load-bearing questions about users, jobs, success metrics, constraints, and non-goals.',
  },
  {
    num: '02 / MEMORY',
    title: 'Memory beats re-derivation.',
    body: 'Re-reading source code to reconstruct intent is a recurring token tax that compounds as a project grows. The Kit invests once in condensed, append-only memory files and amortizes that cost across every future prompt - reading a snapshot instead of re-scanning the repo.',
  },
  {
    num: '03 / STRUCTURE',
    title: 'Structure compounds.',
    body: 'A predictable layout means skills, agents, and humans all know where to look. The Kit refuses to ship freeform - the structure is the product. Consistency early pays back as leverage on every later feature.',
  },
];

const PERSONAS = [
  { name: 'The Vibe-Coder', body: 'Non-developers building real products through prompting. They get a safe, opinionated workflow that prevents drift - guardrails without ceremony.' },
  { name: 'The Student', body: 'Learning engineering via real projects. They get an auditable trail of why every decision was made, plus a running learnings.md.' },
  { name: 'The Solo Engineer', body: 'Using Claude Code for raw velocity. They get token-efficient context and a reproducible SDLC that holds up across long projects.' },
  { name: 'The Team Lead', body: 'Adopting AI-first engineering. They get a shared structural contract every contributor and agent follows by default.' },
];

export default function WhyPage() {
  return (
    <main className="bg-warm font-serif text-ink">
      <section className="mx-auto max-w-[900px] px-8 pb-12 pt-20 text-center">
        <FadeIn className="mb-7 inline-flex items-center gap-[9px] rounded-pill border border-ink px-4 py-[7px] text-xs">
          WHY THROUGHSPEC
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="mb-[22px] text-[60px] font-normal leading-[1.06] tracking-tighter2">
            Vibe-coding gets you started.
            <br />
            Structure gets you shipped.
          </h1>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="mx-auto max-w-[600px] text-[17px] leading-[1.55] tracking-tighter2 text-muted">
            Open-ended prompting drifts. Context cost balloons. Decisions get lost. Throughspec replaces all three with a
            process that compounds.
          </p>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-[1100px] px-8 pb-14 pt-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FadeIn className="rounded-[32px] border border-black/25 bg-warm p-10">
            <div className="mb-[22px] text-xs uppercase tracking-[0.06em] text-dim">Vibe-driven</div>
            <div className="flex flex-col gap-4">
              {BEFORE.map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <span aria-hidden className="text-[15px] leading-[1.4] text-dim">×</span>
                  <span className="text-[14.5px] leading-[1.5] tracking-tighter2 text-muted">{b}</span>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.08} className="rounded-[32px] bg-cloud p-10">
            <div className="mb-[22px] text-xs uppercase tracking-[0.06em] text-muted">Throughspec</div>
            <div className="flex flex-col gap-4">
              {AFTER.map((a) => (
                <div key={a} className="flex items-start gap-3">
                  <span aria-hidden className="text-sm leading-[1.5] text-ink">✓</span>
                  <span className="text-[14.5px] leading-[1.5] tracking-tighter2 text-[#3d3d3d]">{a}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-8 py-6">
        {BELIEFS.map((b, i) => (
          <FadeIn
            key={b.num}
            delay={i * 0.06}
            className="grid grid-cols-[120px_1fr] gap-8 border-t border-black/10 py-10"
          >
            <div className="pt-1.5 text-[13px] text-dim">{b.num}</div>
            <div>
              <h2 className="mb-[14px] text-[30px] font-normal leading-[1.12] tracking-tighter2">{b.title}</h2>
              <p className="text-[15.5px] leading-[1.65] tracking-tighter2 text-muted">{b.body}</p>
            </div>
          </FadeIn>
        ))}
        <div className="border-t border-black/10" />
      </section>

      <section className="mx-auto max-w-[1100px] px-8 py-14">
        <FadeIn className="mb-10 text-center">
          <h2 className="text-[40px] font-normal tracking-tighter2">Built for four kinds of builder.</h2>
        </FadeIn>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PERSONAS.map((p, i) => (
            <FadeIn key={p.name} delay={i * 0.05} className="rounded-3xl border border-ink bg-warm p-8">
              <div className="mb-[10px] text-2xl tracking-tighter2">{p.name}</div>
              <p className="text-sm leading-[1.55] tracking-tighter2 text-muted">{p.body}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-8 pb-20">
        <FadeIn className="rounded-[40px] bg-dark px-12 py-16 text-center">
          <h2 className="mb-[14px] text-[44px] font-normal leading-[1.1] tracking-tighter2 text-warm">
            Stop re-deriving. Start shipping.
          </h2>
          <p className="mb-[26px] text-[15px] tracking-tighter2 text-[#b9b6b4]">Spec-driven. Drift-proof. Token-lean.</p>
          <Link
            href="/docs/"
            className="inline-block rounded-pill bg-warm px-[26px] py-[13px] text-sm font-medium text-ink no-underline"
          >
            Get started &rsaquo;
          </Link>
        </FadeIn>
      </section>
    </main>
  );
}
