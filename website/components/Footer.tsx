import Link from 'next/link';
import BrandMark from './BrandMark';
import CopyableCommand from './CopyableCommand';

const COLUMNS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '/features/' },
      { label: 'Docs', href: '/docs/' },
      { label: 'Changelog', href: '/changelog/' },
      { label: 'Why Throughspec', href: '/why/' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Quickstart', href: '/docs/quickstart/' },
      { label: 'Workflows', href: '/docs/workflows/' },
      { label: 'Design Prompts', href: '/docs/design-prompt-library/' },
      { label: 'Learning Map', href: '/docs/learning-map/' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'Graphify', href: '/features/#graphify' },
      { label: 'Obsidian', href: '/features/#obsidian' },
      { label: 'npm', href: '/docs/install/#npm' },
      { label: 'PyPI', href: '/docs/install/#pypi' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about/' },
      { label: 'Privacy', href: '/privacy/' },
      { label: 'Terms', href: '/terms/' },
      { label: 'Security', href: '/privacy/#security' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink bg-warm font-serif">
      <div className="mx-auto max-w-content px-8 pb-10 pt-[72px]">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="max-w-[300px]">
            <div className="mb-[18px] flex items-center gap-[11px]">
              <BrandMark />
              <span className="text-[17px] font-medium tracking-tightest">throughspec</span>
            </div>
            <div className="mb-[22px] text-[13px] leading-[1.5] tracking-tighter2 text-muted">
              Spec-driven development for Claude Code. Decide once - Claude does the heavy lifting -
              structure keeps the work from drifting.
            </div>
            <div className="flex gap-2">
              <CopyableCommand
                text="npx spec-init"
                className="rounded-lg border border-ink bg-white px-3 py-[7px] text-xs text-ink"
              />
              <CopyableCommand
                text="pipx install spec-init"
                className="rounded-lg border border-ink bg-white px-3 py-[7px] text-xs text-ink"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <div className="mb-1 text-xs font-medium uppercase tracking-[0.05em] text-ink">
                  {col.title}
                </div>
                {col.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm tracking-tighter2 text-muted no-underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="my-[22px] mt-12 h-px bg-black/10" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs tracking-[-0.01em] text-dim">
            © 2026 Throughspec v0.1.0 · MIT licensed
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/hire-the-developer/" className="text-xs text-dim underline">
              Hire the Developer
            </Link>
            <span>·</span>
            <span className="text-xs text-dim">Spec-driven. Drift-proof. Token-lean.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
