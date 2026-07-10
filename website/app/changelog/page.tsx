import FadeIn from '@/components/motion/FadeIn';
import { loadChangelog } from '@/lib/changelog';

export const metadata = {
  title: 'Changelog',
  description:
    'Release notes and upcoming features for Throughspec. Follows Keep a Changelog and semantic versioning.',
};

const UPCOMING = [
  {
    kind: 'In development',
    items: [
      'Cross-platform CI matrix (macOS / Linux / Windows × Node 18/20 × Python 3.10/3.11/3.12).',
      'v1.0.0 publish to npm + PyPI with tagged release and shared-payload SHA-256 in the release notes.',
      'End-to-end acceptance run: fresh scaffold → initiation cycle → one feature cycle in under 90 minutes.',
    ],
  },
  {
    kind: 'Planned - v1.1',
    items: [
      'Stronger Student-persona detection than "grep for the For the Student block".',
      '`.claude/config.yml` for data-driven source-path definition (consumed by /spec-docs).',
      'Cross-language parity coverage for customize and upgrade outputs (currently only init).',
      'Auto-refresh hook so editable Python installs stay in sync with the outer _payload/.',
      '`spec-init doctor` cross-check of meta.json integrations against on-disk artifacts.',
    ],
  },
  {
    kind: 'Under consideration',
    items: [
      'Automatic `/spec-sync` on a Stop hook vs. manual invocation.',
      'Default test-runner per stack, vs. staying stack-agnostic.',
      'Independent versioning for skills separate from the template payload.',
      'Student persona `learnings.md` as a separate Obsidian vault.',
    ],
  },
];

export default function ChangelogPage() {
  const releases = loadChangelog();
  return (
    <main className="bg-warm font-serif text-ink">
      <section className="mx-auto max-w-[820px] px-8 pb-10 pt-[72px]">
        <FadeIn className="mb-[18px] text-xs uppercase tracking-[0.06em] text-dim">Changelog</FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="mb-[18px] text-[50px] font-normal leading-[1.08] tracking-tighter2">
            What’s new in Throughspec.
          </h1>
        </FadeIn>
      </section>

      {/* UPCOMING */}
      <section className="mx-auto max-w-[820px] px-8 pb-4 pt-2">
        <FadeIn className="rounded-[32px] bg-cloud p-10">
          <div className="mb-[18px] flex items-center gap-3">
            <h2 className="text-[26px] font-normal tracking-tighter2">Upcoming Features</h2>
          </div>
          <p className="mb-[22px] max-w-[560px] text-[14px] leading-[1.6] tracking-tighter2 text-muted">
            Work already in flight or on deck. Ordered by likelihood of shipping in the next release cycle.
          </p>
          <div className="flex flex-col gap-6">
            {UPCOMING.map((u) => (
              <div key={u.kind}>
                <div className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-ink">
                  {u.kind}
                </div>
                <div className="flex flex-col gap-[9px]">
                  {u.items.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-[11px] text-sm leading-[1.55] tracking-tighter2 text-[#3d3d3d]"
                    >
                      <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-pill bg-ink" />
                      <span>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* RELEASES */}
      <section className="mx-auto max-w-[820px] px-8 pb-16 pt-8">
        <FadeIn className="mb-4 text-xs uppercase tracking-[0.06em] text-dim">Shipped</FadeIn>
        {releases.length === 0 ? (
          <p className="text-muted">CHANGELOG.md is empty.</p>
        ) : (
          releases.map((r, i) => (
            <FadeIn
              key={r.version}
              delay={i * 0.05}
              className="grid grid-cols-1 gap-8 border-t border-black/10 py-9 md:grid-cols-[150px_1fr]"
            >
              <div className="pt-1">
                <div className="mb-[10px] inline-flex items-center gap-2 rounded-pill border border-ink px-[13px] py-[5px] text-[13px]">
                  {r.version}
                </div>
                {r.date && <div className="text-xs text-dim">{r.date}</div>}
                {i === 0 && (
                  <div className="mt-3 inline-flex items-center gap-[7px] text-[11px] text-muted">
                    <span className="inline-block h-1.5 w-1.5 rounded-pill bg-ink" />
                    Latest
                  </div>
                )}
              </div>
              <div>
                <h2 className="mb-[18px] text-[26px] font-normal tracking-tighter2">
                  {r.version === 'Unreleased' ? 'In-flight changes' : `Release ${r.version}`}
                </h2>
                {r.groups.map((g) => (
                  <div key={g.kind} className="mb-[18px]">
                    <div className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-ink">
                      {g.kind}
                    </div>
                    <div className="flex flex-col gap-[9px]">
                      {g.items.map((it, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-[11px] text-sm leading-[1.55] tracking-tighter2 text-[#3d3d3d]"
                        >
                          <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-pill bg-ink" />
                          <span>{it}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          ))
        )}
        <div className="border-t border-black/10" />
      </section>
    </main>
  );
}
