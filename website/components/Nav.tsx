'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnnounceBar from './AnnounceBar';
import BrandMark from './BrandMark';

type NavActive =
  | 'landing'
  | 'docs'
  | 'features'
  | 'why'
  | 'changelog'
  | 'about'
  | null;

const LINKS: { label: string; href: string; id: Exclude<NavActive, null> }[] = [
  { label: 'Features', href: '/features/', id: 'features' },
  { label: 'Why Throughspec', href: '/why/', id: 'why' },
  { label: 'Changelog', href: '/changelog/', id: 'changelog' },
  { label: 'Docs', href: '/docs/', id: 'docs' },
];

/** Map a pathname to the nav's active-link id. Prefix match so /docs/install
 * highlights the Docs link. */
function activeFor(pathname: string | null): NavActive {
  if (!pathname || pathname === '/') return 'landing';
  if (pathname.startsWith('/docs')) return 'docs';
  if (pathname.startsWith('/features')) return 'features';
  if (pathname.startsWith('/why')) return 'why';
  if (pathname.startsWith('/changelog')) return 'changelog';
  if (pathname.startsWith('/about')) return 'about';
  return null;
}

export default function Nav() {
  const active = activeFor(usePathname());
  return (
    <div className="sticky top-0 z-50 font-serif">
      <AnnounceBar />
      <nav className="flex items-center justify-between border-b border-ink bg-warm px-8 py-[15px]">
        <Link href="/" className="flex items-center gap-[11px] text-ink no-underline">
          <BrandMark />
          <span className="text-[17px] font-medium tracking-tightest">throughspec</span>
        </Link>

        <div className="flex items-center gap-[30px]">
          {LINKS.map((l) => {
            const cur = l.id === active;
            return (
              <Link
                key={l.id}
                href={l.href}
                className={
                  'pb-[2px] text-sm font-medium tracking-tighter2 no-underline ' +
                  (cur
                    ? 'border-b border-ink text-ink'
                    : 'border-b border-transparent text-muted')
                }
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/docs/"
            className="inline-flex items-center gap-[7px] rounded-pill bg-dark px-[21px] py-[10px] text-[13px] font-medium text-warm no-underline"
          >
            Get started <span className="text-[14px]" aria-hidden>&rsaquo;</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
