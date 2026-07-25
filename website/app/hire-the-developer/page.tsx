import Link from 'next/link';
import FadeIn from '@/components/motion/FadeIn';

export const metadata = {
  title: 'Hire the developer',
  description:
    'Vishal Patil - AI engineer and researcher shipping end-to-end AI products. Open to work across the US & Europe.',
};

const SKILLS = [
  { name: 'Spec-Driven Development', detail: 'Ship features with SRS-first workflows; the practice Throughspec itself is built on.' },
  { name: 'Full-stack (Next.js · TypeScript)', detail: 'App Router, server components, static export, edge-friendly builds.' },
  { name: 'RAG & GenAI integrations', detail: 'Retrieval pipelines, vector stores, embedding evaluation, hybrid search.' },
  { name: 'Multi-provider LLM systems', detail: 'Fallback routing across Anthropic / OpenAI / open-weights; cost + latency tuning.' },
  { name: 'Security & GDPR-by-design', detail: 'PII minimization, request-scoped scoping, audit logging, DPIA-ready defaults.' },
  { name: 'Postgres', detail: 'Schema design, migrations, row-level security, connection pooling under load.' },
];

const LINKS = [
  { label: 'About me', href: 'https://v-ai.org/', kind: 'primary' as const },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vishalrameshpatil/', kind: 'primary' as const },
  { label: 'GitHub', href: 'https://github.com/vishalpatil18', kind: 'primary' as const },
  { label: 'Email', href: 'mailto:hire.vishalpatil@gmail.com', kind: 'primary' as const },
];

export default function HireThePage() {
  return (
    <main className="bg-warm font-serif text-ink">
      {/* HERO */}
      <section className="mx-auto max-w-[900px] px-8 pb-10 pt-20">
        <FadeIn className="mb-6 inline-flex items-center gap-2 rounded-pill border border-ink px-4 py-[7px] text-xs">
          <span className="inline-block h-2 w-2 rounded-pill bg-green-500" />
          Open to work · US &amp; Europe
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="mb-[6px] text-[60px] font-normal leading-[1.05] tracking-tighter2">
            Hi, I&rsquo;m Vishal Patil.
          </h1>
          <h3 className="mb-[22px] text-[30px] font-normal leading-[1.05] tracking-tighter2">
            I build AI products people actually use.
          </h3>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="max-w-[640px] text-[17px] leading-[1.6] tracking-tighter2 text-muted text-justify">
            AI engineer and researcher shipping end-to-end products from specification through production. My last
            project,{' '}
            <a
              href="https://v-ai.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline"
            >
              VAi
            </a>{' '}
            - an AI assistant that talks to recruiters on a job seeker&rsquo;s behalf - went viral and was{' '}
            <a
              href="https://www.cnbc.com/2026/04/30/these-2-job-seekers-built-ai-chatbots-to-talk-to-recruiters-for-them.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline"
            >
              featured by CNBC
            </a>
            .
          </p>
        </FadeIn>
      </section>

      {/* NARRATIVE */}
      <section className="mx-auto max-w-[900px] px-8 pb-8">
        <FadeIn delay={0.05}>
          <p className="mb-5 max-w-[720px] text-[15.5px] leading-[1.75] tracking-tighter2 text-justify">
            I care about the whole loop: talking to users, freezing a spec, choosing the right stack, wiring the
            eval harness, and shipping something that stays up. My philosophy is baked into{' '}
            <Link href="/" className="text-ink underline">Throughspec</Link> - a spec-driven SDLC for Claude Code
            that refuses to skip cross-questioning, keeps memory files under 8k tokens, and produces reproducible
            architecture decisions instead of chat-log folklore.
          </p>
          <p className="mb-5 max-w-[720px] text-[15.5px] leading-[1.75] tracking-tighter2 text-justify">
            On the applied side, I have built retrieval pipelines over messy real-world corpora, evaluation
            harnesses that catch regressions before they ship, and multi-provider LLM routing that keeps latency and
            cost predictable. I care about security defaults - GDPR-by-design, PII minimization, audit trails - and
            I write code the same way I write specs: boring, deterministic, tested.
          </p>
          <p className="max-w-[720px] text-[15.5px] leading-[1.75] tracking-tighter2 text-justify">
            If you are building an AI product and want someone who can own it from cross-questioning to production,
            let&rsquo;s talk. My best work happens when the spec is honest, the memory layer is condensed, and the
            structure carries its own weight.
          </p>
        </FadeIn>
      </section>

      {/* SKILLS */}
      <section className="mx-auto max-w-[1100px] px-8 py-12">
        <FadeIn className="mb-8">
          <div className="mb-3 text-xs uppercase tracking-[0.06em] text-dim">What I bring to the table</div>
          <h2 className="text-[36px] font-normal tracking-tighter2">Stack I ship with.</h2>
        </FadeIn>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SKILLS.map((s, i) => (
            <FadeIn key={s.name} delay={i * 0.05} className="rounded-3xl border border-ink bg-warm p-6">
              <div className="mb-2 text-[18px] tracking-tighter2">{s.name}</div>
              <p className="text-[13.5px] leading-[1.55] tracking-tighter2 text-muted">{s.detail}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* PORTFOLIO / LINKS */}
      <section className="mx-auto max-w-[1100px] px-8 py-12">
        <FadeIn className="mb-8">
          <div className="mb-3 text-xs uppercase tracking-[0.06em] text-dim">Portfolio</div>
          <h2 className="text-[36px] font-normal tracking-tighter2">Shipped work.</h2>
        </FadeIn>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FadeIn className="block">
            <a
              href="https://v-ai.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[32px] bg-cloud p-10 no-underline transition-shadow hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-2 text-xs uppercase tracking-[0.06em] text-muted">Portfolio · Viral 2026</div>
              <h3 className="mb-3 text-[24px] font-normal tracking-tighter2 text-ink">
                VAi - AI assistant & portfolio
              </h3>
              <p className="mb-4 text-[14.5px] leading-[1.6] tracking-tighter2 text-[#3d3d3d] text-justify">
                An AI that talks to recruiters on Vishal&rsquo;s behalf. Featured by CNBC. Multi-provider LLM
                routing, retrieval over a resume + JD corpus, GDPR-aware storage, evaluated end-to-end.
              </p>
              <div className="text-[12.5px] tracking-tighter2 text-muted">GenAI · LLM routing · RAG · GDPR</div>
            </a>
          </FadeIn>

          <FadeIn delay={0.06} className="block">
            <Link
              href="/"
              className="block rounded-[32px] border border-ink bg-warm p-10 no-underline transition-shadow hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-2 text-xs uppercase tracking-[0.06em] text-muted">Open source · 2026</div>
              <h3 className="mb-3 text-[24px] font-normal tracking-tighter2 text-ink">Throughspec</h3>
              <p className="mb-4 text-[14.5px] leading-[1.6] tracking-tighter2 text-muted">
                A spec-driven SDLC for Claude Code, published to npm + PyPI from one source-of-truth template tree.
                Nine slash commands, seven tool-scoped agents, an append-only memory layer under 8k tokens.
              </p>
              <div className="text-[12.5px] tracking-tighter2 text-dim">
                TypeScript · Python · Next.js · Design system
              </div>
            </Link>
          </FadeIn>

          <FadeIn delay={0.12} className="block">
            <a
              href="https://pro-bot.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[32px] border border-ink bg-warm p-10 no-underline transition-shadow hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-2 text-xs uppercase tracking-[0.06em] text-muted">Open source · 2026</div>
              <h3 className="mb-3 text-[24px] font-normal tracking-tighter2 text-ink">ProBot</h3>
              <p className="mb-4 text-[14.5px] leading-[1.6] tracking-tighter2 text-muted">
                AI chatbot generator for non-developers. Inspired by VAi - turns a resume, product page, or FAQ into
                a hosted assistant without writing code.
              </p>
              <div className="text-[12.5px] tracking-tighter2 text-dim">GenAI · LLM routing · RAG · GDPR</div>
            </a>
          </FadeIn>

          <FadeIn delay={0.18} className="block">
            <a
              href="https://vmarker.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[32px] bg-cloud p-10 no-underline transition-shadow hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-2 text-xs uppercase tracking-[0.06em] text-muted">Research project · 2026</div>
              <h3 className="mb-3 text-[24px] font-normal tracking-tighter2 text-ink">vmarker</h3>
              <p className="mb-4 text-[14.5px] leading-[1.6] tracking-tighter2 text-[#3d3d3d] text-justify">
                Turn video into searchable knowledge. Timestamp-level retrieval over long-form video, indexed with
                VideoRAG and routed across multiple LLMs.
              </p>
              <div className="text-[12.5px] tracking-tighter2 text-muted">VideoRAG · GenAI · LLM routing</div>
            </a>
          </FadeIn>
        </div>
      </section>

      {/* CONTACT */}
      <section className="mx-auto max-w-content px-8 pb-20">
        <FadeIn className="rounded-[40px] bg-dark px-12 py-14 text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.06em] text-[#b9b6b4]">Get in touch</div>
          <h2 className="mb-4 text-[40px] font-normal leading-[1.1] tracking-tighter2 text-warm">
            Let&rsquo;s ship something worth remembering.
          </h2>
          <p className="mb-8 max-w-[520px] mx-auto text-[15px] tracking-tighter2 text-[#b9b6b4]">
            Full-time, contract, or advisory. Open to work across the US &amp; Europe.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={
                  'rounded-pill px-[24px] py-[12px] text-sm font-medium no-underline ' +
                  (l.kind === 'primary'
                    ? 'bg-warm text-ink'
                    : 'border border-warm/50 text-warm')
                }
              >
                {l.label} &rsaquo;
              </a>
            ))}
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
