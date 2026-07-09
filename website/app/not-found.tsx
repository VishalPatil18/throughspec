import Link from 'next/link';
import NotFoundSVG from '@/components/landing/NotFoundSVG';

export const metadata = { title: 'Not found' };

const POPULAR = [
  { label: 'Features', href: '/features/' },
  { label: 'Why Throughspec', href: '/why/' },
  { label: 'Changelog', href: '/changelog/' },
  { label: 'About', href: '/about/' },
];

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col bg-warm font-serif text-ink">
      <section className="flex flex-1 items-center justify-center px-8 pb-20 pt-16">
        <div className="w-full max-w-[680px] text-center">
          <NotFoundSVG />
          <div className="rise mb-[18px] text-[13px] tracking-[0.1em] text-dim">ERROR 404 - SPEC NOT FOUND</div>
          <h1 className="rise r-2 mx-auto mb-[18px] max-w-[520px] text-[52px] font-normal leading-[1.08] tracking-tighter2">
            This page drifted off the throughline.
          </h1>
          <p className="rise r-3 mx-auto mb-8 max-w-[480px] text-base leading-[1.55] tracking-tighter2 text-muted">
            The route you requested isn’t in the spec. Let’s get you back to something that is.
          </p>

          <div className="rise r-4 mb-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-pill bg-dark px-[26px] py-[13px] text-sm font-medium text-warm no-underline"
            >
              Back home <span className="text-[15px]" aria-hidden>&rsaquo;</span>
            </Link>
            <Link
              href="/docs/"
              className="rounded-pill border border-ink px-[26px] py-[13px] text-sm font-medium text-ink no-underline"
            >
              Read the docs
            </Link>
          </div>

          <div className="rise r-5 mx-auto max-w-[520px] border-t border-black/10 pt-[26px]">
            <div className="mb-4 text-[11px] uppercase tracking-[0.06em] text-dim">Popular destinations</div>
            <div className="flex flex-wrap justify-center gap-[10px]">
              {POPULAR.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="rounded-pill border border-black/25 px-[18px] py-[9px] text-[13px] text-ink no-underline"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
