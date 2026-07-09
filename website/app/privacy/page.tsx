import Link from 'next/link';

export const metadata = { title: 'Privacy' };

const SECTIONS = [
  {
    id: 'scope',
    title: 'Scope',
    paras: [
      'This policy covers the Throughspec command-line tool and this marketing website. The tool executes locally; the website is a static informational site.',
      'Because the Kit is a local scaffolder, the vast majority of your activity - prompts, source code, specs, and memory files - never reaches us.',
    ],
  },
  {
    id: 'local',
    title: 'Data that stays on your machine',
    paras: [
      'All files the Kit generates - the claude/ memory layer, design/ assets, CHANGELOG.md, and your source - are written to your local filesystem and version control. We never receive them.',
      'Your interactions with Claude Code are governed by Anthropic’s own terms and privacy policy, not ours.',
    ],
  },
  {
    id: 'collected',
    title: 'Information we may collect',
    paras: [
      'Package registries (npm and PyPI) record standard, anonymized download counts when you install the Kit. We may view these aggregate totals; they do not identify you.',
      'If you opt in to telemetry during init, the CLI may send anonymous, aggregate usage events (such as which command was run). Telemetry is off by default and can be disabled at any time.',
    ],
  },
  {
    id: 'website',
    title: 'Website analytics',
    paras: [
      'This site uses privacy-respecting, cookieless analytics to count page views in aggregate. We do not build advertising profiles and do not sell data.',
    ],
  },
  {
    id: 'thirdparty',
    title: 'Third parties',
    paras: [
      'Optional integrations such as Graphify and Obsidian run locally and are configured by you. Activating them does not transmit data to us.',
      'We do not share information with advertisers or data brokers.',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    paras: [
      'Reports of vulnerabilities go through the repository’s SECURITY.md. Because the Kit runs locally with no server component, the attack surface is limited to the CLI itself and its published packages.',
    ],
  },
  {
    id: 'rights',
    title: 'Your choices',
    paras: [
      'You can disable CLI telemetry, run the tool fully offline after install, and remove any generated configuration at any time. Since we hold almost no personal data, there is little for us to delete - but requests can be directed to the maintainers.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-warm font-serif text-ink">
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-12 px-8 pb-20 pt-16 md:grid-cols-[240px_1fr]">
        <aside className="sticky top-6 self-start">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-dim">Contents</div>
          <div className="flex flex-col gap-[11px]">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border-l border-black/15 pl-3 text-[13px] leading-[1.4] tracking-tighter2 text-muted no-underline"
              >
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 text-xs uppercase tracking-[0.06em] text-dim">Legal</div>
          <h1 className="mb-3 text-[46px] font-normal leading-[1.08] tracking-tighter2">Privacy Policy</h1>
          <p className="mb-[14px] text-[13px] text-dim">Last updated 12 June 2026</p>
          <div className="mb-10 max-w-[640px] rounded-2xl bg-cloud px-[22px] py-5">
            <p className="text-sm leading-[1.6] tracking-tighter2 text-[#3d3d3d]">
              Throughspec is a command-line scaffolding tool that runs entirely on your machine. It is not a hosted
              service. We do not operate servers that receive your code, prompts, or project files.
            </p>
          </div>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="mb-9 scroll-mt-6">
              <h2 className="mb-[14px] text-[25px] font-normal tracking-tighter2">{s.title}</h2>
              {s.paras.map((p, i) => (
                <p
                  key={i}
                  className="mb-[14px] max-w-[660px] text-[14.5px] leading-[1.7] tracking-tighter2 text-[#3d3d3d]"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-2 border-t border-black/10 pt-6">
            <p className="text-[13.5px] leading-[1.6] tracking-tighter2 text-muted">
              Questions about this policy? See the <Link href="/terms/" className="text-ink underline">Terms of Service</Link> or reach the maintainers via the
              repository’s SECURITY.md.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
