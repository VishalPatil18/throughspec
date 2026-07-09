import RevealOnScroll from '@/components/RevealOnScroll';
import { loadChangelog } from '@/lib/changelog';

export const metadata = { title: 'Changelog' };

export default function ChangelogPage() {
  const releases = loadChangelog();
  return (
    <main className="bg-warm font-serif text-ink">
      <RevealOnScroll />

      <section className="mx-auto max-w-[820px] px-8 pb-10 pt-[72px]">
        <div className="reveal mb-[18px] text-xs uppercase tracking-[0.06em] text-dim">Changelog</div>
        <h1 className="reveal d-1 mb-[18px] text-[50px] font-normal leading-[1.08] tracking-tighter2">
          What’s new in Throughspec.
        </h1>
        <p className="reveal d-2 text-base leading-[1.55] tracking-tighter2 text-muted">
          Every release follows{' '}
          <a className="text-ink underline" href="https://keepachangelog.com/en/1.1.0/">
            Keep a Changelog
          </a>{' '}
          and{' '}
          <a className="text-ink underline" href="https://semver.org/spec/v2.0.0.html">
            semantic versioning
          </a>
          . The Kit’s own CHANGELOG.md is the source of truth.
        </p>
      </section>

      <section className="mx-auto max-w-[820px] px-8 pb-16 pt-2">
        {releases.length === 0 ? (
          <p className="text-muted">CHANGELOG.md is empty.</p>
        ) : (
          releases.map((r, i) => (
            <div
              key={r.version}
              className="reveal grid grid-cols-1 gap-8 border-t border-black/10 py-9 md:grid-cols-[150px_1fr]"
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
            </div>
          ))
        )}
        <div className="border-t border-black/10" />
      </section>
    </main>
  );
}
