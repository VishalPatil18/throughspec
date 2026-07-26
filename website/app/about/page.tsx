import Link from 'next/link';
import FadeIn from '@/components/motion/FadeIn';

export const metadata = {
  title: 'About',
  description:
    'Throughspec is built on the belief that process is a feature, memory is leverage, and determinism beats cleverness. Built and maintained by Vishal Patil.',
};

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
    body: 'A predictable, boring structure beats a clever, surprising one. We’d rather refuse to proceed than improvise - every gate, every step, every log exists to remove ambiguity.',
  },
];

const STATS = [
  { stat: '2', label: 'distribution channels - npm and PyPI from a single source-of-truth template tree.' },
  { stat: '24', label: 'slash commands covering scaffolding, specs, features, bugs, docs, and sync.' },
  { stat: 'MIT', label: 'licensed and fully open source - fork it, audit it, ship it.' },
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
      <section className="mx-auto max-w-[900px] px-8 pb-12 pt-20">
        <FadeIn className="mb-[18px] text-xs uppercase tracking-[0.06em] text-dim">About</FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="mb-[22px] text-[54px] font-normal leading-[1.08] tracking-tighter2">
            We build the rails, not the train.
          </h1>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="max-w-[640px] text-[17px] leading-[1.6] tracking-tighter2 text-muted">
            Throughspec started from a simple frustration: AI coding tools are astonishing at generating code and terrible
            at remembering why. The gap between a good idea and shipped software wasn’t capability - it was process. So we
            built the process, and made it a precondition.
          </p>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-[900px] px-8 py-6">
        {PRINCIPLES.map((p, i) => (
          <FadeIn
            key={p.tag}
            delay={i * 0.06}
            className="grid grid-cols-[140px_1fr] gap-8 border-t border-black/10 py-9"
          >
            <div className="pt-[5px] text-[13px] tracking-[0.04em] text-dim">{p.tag}</div>
            <div>
              <h2 className="mb-3 text-[26px] font-normal tracking-tighter2">{p.title}</h2>
              <p className="text-[15px] leading-[1.65] tracking-tighter2 text-muted">{p.body}</p>
            </div>
          </FadeIn>
        ))}
        <div className="border-t border-black/10" />
      </section>

      <section className="mx-auto max-w-[1100px] px-8 py-12">
        <FadeIn className="grid grid-cols-1 gap-8 rounded-[40px] bg-cloud p-12 md:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="mb-2 text-[44px] tracking-[-0.03em]">{s.stat}</div>
              <div className="text-[13.5px] leading-[1.5] tracking-tighter2 text-muted">{s.label}</div>
            </div>
          ))}
        </FadeIn>
      </section>

      <section className="mx-auto max-w-[900px] px-8 pb-14 pt-6">
        <FadeIn className="mb-9">
          <div className="mb-[14px] text-xs uppercase tracking-[0.06em] text-dim">How we got here</div>
          <h2 className="text-4xl font-normal tracking-tighter2">A short, opinionated history.</h2>
        </FadeIn>
        {TIMELINE.map((t, i) => (
          <FadeIn key={t.when} delay={i * 0.05} className="grid grid-cols-[90px_1fr] gap-6 pb-7">
            <div className="pt-[2px] text-[13px] text-ink">{t.when}</div>
            <div className="border-l border-black/20 pb-1 pl-6">
              <div className="mb-1.5 text-[15px] tracking-tighter2">{t.title}</div>
              <div className="text-[13.5px] leading-[1.55] tracking-tighter2 text-muted">{t.body}</div>
            </div>
          </FadeIn>
        ))}
      </section>

      <section className="mx-auto max-w-content px-8 pb-12">
        <FadeIn className="rounded-[40px] px-12 py-14 text-center">
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
              href="https://github.com/vishalpatil18/throughspec"
              className="rounded-pill border border-ink px-[26px] py-[13px] text-sm font-medium text-ink no-underline"
            >
              Github
            </Link>
          </div>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-[900px] px-8 pb-12">
        <FadeIn className="rounded-[40px] border border-ink bg-warm p-10 md:p-12">
          <div className="mb-4 text-xs uppercase tracking-[0.06em] text-dim">Maintainer</div>
          <h2 className="mb-4 text-[32px] font-normal leading-[1.15] tracking-tighter2">
            Built and maintained by Vishal Patil.
          </h2>
          <p className="mb-4 text-[15px] leading-[1.65] tracking-tighter2 text-muted text-justify">
            AI engineer and researcher shipping end-to-end AI products from specification through production. Prior work
            includes <Link href="https://v-ai.org" className="text-ink underline">VAi</Link>, an AI assistant that talks to recruiters on Vishal's
            behalf which went viral and was <Link href="https://www.cnbc.com/2026/04/30/these-2-job-seekers-built-ai-chatbots-to-talk-to-recruiters-for-them.html" className="text-ink underline" target="_blank">featured by CNBC.</Link>
          </p>
          <p className="mb-6 text-[15px] leading-[1.65] tracking-tighter2 text-muted text-justify">
            Throughspec is the SDLC I wish existed when I started building with Claude Code - spec-driven, drift-proof,
            token-lean. Open to work across the US & Europe.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/hire-the-developer/"
              className="inline-flex items-center gap-2 rounded-pill bg-dark px-[22px] py-[11px] text-sm font-medium text-warm no-underline"
            >
              Hire the developer <span aria-hidden>&rsaquo;</span>
            </Link>
            <a
              href="https://v-ai.org"
              target="_blank"
              className="rounded-pill border border-ink px-[22px] py-[11px] text-sm font-medium text-ink no-underline"
            >
              VAi
            </a>
            <a
              href="https://github.com/vishalpatil18"
              target="_blank"
              className="rounded-pill border border-ink px-[22px] py-[11px] text-sm font-medium text-ink no-underline"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/vishalrameshpatil/"
              target="_blank"
              className="rounded-pill border border-ink px-[22px] py-[11px] text-sm font-medium text-ink no-underline"
            >
              LinkedIn
            </a>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
