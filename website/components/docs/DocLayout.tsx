// Docs shell: sidebar + content + TOC; prev/next derived from group order.

import Link from 'next/link';
import { GROUPS, PAGES, type DocPage } from '@/lib/docs-content';
import BrandMark from '@/components/BrandMark';
import Search from '@/components/Search';
import DocBlocks from './DocBlocks';
import { SITE_VERSION } from '@/lib/version';

const ORDER: string[] = GROUPS.flatMap((g) => g.slugs);

function slugToHref(slug: string): string {
  return slug === '' ? '/docs/' : `/docs/${slug}/`;
}

function prevNext(current: string): { prev?: DocPage; next?: DocPage } {
  const idx = ORDER.indexOf(current);
  return {
    prev: idx > 0 ? PAGES[ORDER[idx - 1]!] : undefined,
    next: idx >= 0 && idx < ORDER.length - 1 ? PAGES[ORDER[idx + 1]!] : undefined,
  };
}

// Render one DocPage inside the shared shell (all /docs routes delegate here).
export default function DocLayout({ page }: { page: DocPage }) {
  const { prev, next } = prevNext(page.slug);
  const tocItems = page.blocks.filter((b) => b.t === 'h2') as Extract<DocPage['blocks'][number], { t: 'h2' }>[];

  return (
    <div className="mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 md:grid-cols-[262px_minmax(0,1fr)] xl:grid-cols-[262px_minmax(0,1fr)_224px]">
      <aside className="sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))] self-start overflow-y-auto overscroll-contain border-r border-black/10 px-6 pb-20 pt-7">
        <Search />
        <Link
          href="/changelog/"
          className="mb-6 mt-3 inline-flex items-center gap-1.5 rounded-pill border border-black/15 px-2.5 py-1 text-[11px] tracking-[0.01em] text-muted no-underline hover:text-ink"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-pill bg-ink" />
          v{SITE_VERSION}
        </Link>
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-[26px]">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-ink">{g.title}</div>
            <div className="flex flex-col gap-[2px]">
              {g.slugs.map((slug) => {
                const p = PAGES[slug];
                if (!p) return null;
                const cur = slug === page.slug;
                return (
                  <Link
                    key={slug}
                    href={slugToHref(slug)}
                    className={
                      'rounded-md px-2 py-[5px] text-sm no-underline ' +
                      (cur ? 'bg-cloud text-ink' : 'text-muted hover:text-ink')
                    }
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      <main className="min-w-0 px-8 pb-24 pt-12 md:px-14">
        <div className="mb-[22px] flex items-center gap-[10px] text-[12.5px] text-dim">
          <Link href="/docs/" className="text-dim no-underline">Docs</Link>
          <span>/</span>
          <span>{page.group}</span>
          {page.label !== 'Introduction' && (
            <>
              <span>/</span>
              <span className="text-ink">{page.label}</span>
            </>
          )}
        </div>
        <h1 className="mb-[14px] text-[42px] font-normal leading-[1.1] tracking-tighter2">{page.title}</h1>
        <p className="mb-10 max-w-[680px] text-base leading-[1.55] tracking-tighter2 text-muted">{page.intro}</p>

        <DocBlocks blocks={page.blocks} />

        <div className="mt-12 flex justify-between gap-4 border-t border-black/10 pt-8">
          {prev ? (
            <Link
              href={slugToHref(prev.slug)}
              className="max-w-[300px] flex-1 rounded-2xl border border-ink px-[22px] py-4 text-ink no-underline"
            >
              <div className="mb-1.5 text-[11px] text-dim">‹ Previous</div>
              <div className="text-[14.5px] tracking-tighter2">{prev.label}</div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={slugToHref(next.slug)}
              className="ml-auto max-w-[300px] flex-1 rounded-2xl border border-ink px-[22px] py-4 text-right text-ink no-underline"
            >
              <div className="mb-1.5 text-[11px] text-dim">Next ›</div>
              <div className="text-[14.5px] tracking-tighter2">{next.label}</div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </main>

      <aside className="sticky top-[var(--nav-h)] hidden h-[calc(100vh-var(--nav-h))] self-start overflow-y-auto overscroll-contain px-6 pb-20 pt-12 xl:block">
        <div className="mb-[14px] text-[11px] font-medium uppercase tracking-[0.06em] text-dim">On this page</div>
        <div className="flex flex-col gap-[10px]">
          {tocItems.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className="border-l border-black/15 pl-3 text-[13px] leading-[1.4] tracking-tighter2 text-muted no-underline"
            >
              {h.text}
            </a>
          ))}
        </div>
        <div className="mt-7 border-t border-black/10 pt-5">
          <Link href="/why/" className="mb-[9px] block text-[12.5px] text-dim no-underline">
            Why Throughspec ›
          </Link>
          <Link href="/changelog/" className="block text-[12.5px] text-dim no-underline">
            Changelog ›
          </Link>
        </div>
      </aside>
    </div>
  );
}

