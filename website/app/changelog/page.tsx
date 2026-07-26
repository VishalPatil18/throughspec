import FadeIn from '@/components/motion/FadeIn';
import InlineMarkdown from '@/components/InlineMarkdown';
import { loadChangelog } from '@/lib/changelog';

export const metadata = {
  title: 'Changelog',
  description:
    'Release notes and upcoming features for Throughspec. Follows Keep a Changelog and semantic versioning.',
};

export default function ChangelogPage() {
  // Show only shipped versions; hide the "Unreleased" placeholder section.
  const releases = loadChangelog().filter((r) => r.version !== 'Unreleased');
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
                  Release {r.version}
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
                          <span>
                            <InlineMarkdown text={it} />
                          </span>
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
