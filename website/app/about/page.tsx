import Link from 'next/link';
import RevealOnScroll from '@/components/RevealOnScroll';

export const metadata = { title: 'About' };

const PRINCIPLES = [
  {
    tag: 'BELIEF 01',
    title: 'Process is a feature.',
    body: 'The best tooling doesn’t just generate output - it shapes how the work gets done. We treat the workflow itself as the product, and the generated code as a downstream effect of a good process.',
  },
  {
    tag: 'BELIEF 02',
    title: 'Memory is leverage.',
    body: 'A project that remembers its own decisions is exponentially cheaper to extend. We optimize relentlessly for token-lean, append-only memory so the hundredth prompt costs about what the first did.',
  },
  {
    tag: 'BELIEF 03',
    title: 'Determinism over cleverness.',
    body: 'A predictable, boring structure beats a clever, surprising one. We’d rather refuse to proceed than improvise - every gate, every phase, every log exists to remove ambiguity.',
  },
];

const STATS = [
  { stat: '2', label: 'distribution channels - npm and PyPI - from a single source-of-truth template tree.' },
  { stat: '9', label: 'slash commands covering scaffolding, specs, features, bugs, docs, and sync.' },
  { stat: 'MIT', label: 'licensed and fully open - fork it, audit it, ship it.' },
];

const TIMELINE = [
  { when: 'The itch', title: 'Drift, every time', body: 'We kept watching promising AI-built projects collapse under their own context - great starts, lost intent, ballooning cost.' },
  { when: 'The thesis', title: 'Spec beats vibe', body: 'We bet that enforcing a spec-first process up front would beat any amount of prompt cleverness later.' },
  { when: 'The build', title: 'The memory layer', body: 'Append-only memory files turned re-derivation from a recurring tax into a one-time investment.' },
  { when: 'v1.0', title: 'Throughspec ships', body: 'A publishable kit on npm and PyPI - scaffold, spec, plan, and ship, on rails, for Claude Code.' },
];

export default function AboutPage() {
  return (
    <main className="bg-warm font-serif text-ink">
      <RevealOnScroll />

      <section className="mx-auto max-w-[900px] px-8 pb-12 pt-20">
        <div className="reveal mb-[18px] text-xs uppercase tracking-[0.06em] text-dim">About</div>
        <h1 className="reveal d-1 mb-[22px] text-[54px] font-normal leading-[1.08] tracking-tighter2">
          We build the rails, not the train.
        </h1>
        <p className="reveal d-2 max-w-[640px] text-[17px] leading-[1.6] tracking-tighter2 text-muted">
          Throughspec started from a simple frustration: AI coding tools are astonishing at generating code and terrible
          at remembering why. The gap between a good idea and shipped software wasn’t capability - it was process. So we
          built the process, and made it a precondition.
        </p>
      </section>

      <section className="mx-auto max-w-[900px] px-8 py-6">
        {PRINCIPLES.map((p) => (
          <div key={p.tag} className="reveal grid grid-cols-[140px_1fr] gap-8 border-t border-black/10 py-9">
            <div className="pt-[5px] text-[13px] tracking-[0.04em] text-dim">{p.tag}</div>
            <div>
              <h2 className="mb-3 text-[26px] font-normal tracking-tighter2">{p.title}</h2>
              <p className="text-[15px] leading-[1.65] tracking-tighter2 text-muted">{p.body}</p>
            </div>
          </div>
        ))}
        <div className="border-t border-black/10" />
      </section>

      <section className="mx-auto max-w-[1100px] px-8 py-12">
        <div className="reveal grid grid-cols-1 gap-8 rounded-[40px] bg-cloud p-12 md:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="mb-2 text-[44px] tracking-[-0.03em]">{s.stat}</div>
              <div className="text-[13.5px] leading-[1.5] tracking-tighter2 text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-8 pb-14 pt-6">
        <div className="reveal mb-9">
          <div className="mb-[14px] text-xs uppercase tracking-[0.06em] text-dim">How we got here</div>
          <h2 className="text-4xl font-normal tracking-tighter2">A short, opinionated history.</h2>
        </div>
        {TIMELINE.map((t) => (
          <div key={t.when} className="reveal grid grid-cols-[90px_1fr] gap-6 pb-7">
            <div className="pt-[2px] text-[13px] text-ink">{t.when}</div>
            <div className="border-l border-black/20 pb-1 pl-6">
              <div className="mb-1.5 text-[15px] tracking-tighter2">{t.title}</div>
              <div className="text-[13.5px] leading-[1.55] tracking-tighter2 text-muted">{t.body}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-content px-8 pb-20">
        <div className="reveal rounded-[40px] border border-ink px-12 py-14 text-center">
          <h2 className="mb-5 text-[38px] font-normal leading-[1.1] tracking-tighter2">
            Open source. MIT licensed. Yours to fork.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/"
              className="rounded-pill bg-dark px-[26px] py-[13px] text-sm font-medium text-warm no-underline"
            >
              Read the docs &rsaquo;
            </Link>
            <Link
              href="/changelog/"
              className="rounded-pill border border-ink px-[26px] py-[13px] text-sm font-medium text-ink no-underline"
            >
              See the changelog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
