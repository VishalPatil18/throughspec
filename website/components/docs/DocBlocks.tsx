// Renders a DocPage's `blocks` array. One switch, one component per variant.

import type { DocBlock } from '@/lib/docs-content';
import InlineMarkdown from '@/components/InlineMarkdown';
import DocCodeBlock from './DocCodeBlock';
import DocIcon from './DocIcon';

const CALLOUT_TONE = {
  note: 'bg-cloud',
  tip: 'bg-mint/40',
  warn: 'bg-[#f6dccb]',
} as const;

const CALLOUT_ICON = { note: 'info', tip: 'lightbulb', warn: 'warning' } as const;

export default function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h2':
            return (
              <h2
                key={i}
                id={b.id}
                className="mb-4 mt-11 scroll-mt-24 text-[27px] font-normal tracking-tighter2"
              >
                {b.text}
              </h2>
            );
          case 'p':
            return (
              <p
                key={i}
                className="mb-[18px] max-w-[680px] text-[15px] leading-[1.65] tracking-tighter2 text-[#3d3d3d]"
              >
                {b.text}
              </p>
            );
          case 'code':
            return <DocCodeBlock key={i} text={b.text} />;
          case 'callout':
            return (
              <div
                key={i}
                className={`mb-[22px] flex max-w-[680px] items-start gap-3 rounded-2xl px-5 py-4 ${CALLOUT_TONE[b.variant]}`}
              >
                <span className="mt-[2px] flex-none text-ink">
                  <DocIcon name={CALLOUT_ICON[b.variant]} size={18} />
                </span>
                <div className="text-sm leading-[1.6] tracking-tighter2 text-[#3d3d3d]">
                  {b.label && (
                    <span className="mb-[3px] block text-[11px] font-medium uppercase tracking-[0.05em] text-ink">
                      {b.label}
                    </span>
                  )}
                  <InlineMarkdown text={b.text} />
                </div>
              </div>
            );
          case 'list':
            return (
              <div key={i} className="mb-[22px] flex max-w-[680px] flex-col gap-[10px]">
                {b.items.map((it, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-3 text-[15px] leading-[1.6] tracking-tighter2 text-[#3d3d3d]"
                  >
                    <span className="mt-[9px] h-[5px] w-[5px] flex-none rounded-pill bg-ink" />
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            );
          case 'defs':
            return (
              <div
                key={i}
                className="mb-6 max-w-[680px] overflow-hidden rounded-2xl border border-black/10"
              >
                {b.items.map((d, j) => (
                  <div
                    key={j}
                    className="grid grid-cols-[200px_1fr] items-start gap-4 border-b border-black/5 px-[18px] py-[14px] last:border-b-0"
                  >
                    <code className="font-mono text-[13px] text-ink">{d.term}</code>
                    <span className="text-[13.5px] leading-[1.5] tracking-tighter2 text-muted">{d.desc}</span>
                  </div>
                ))}
              </div>
            );
          case 'steps':
            return (
              <div key={i} className="mb-6 flex max-w-[680px] flex-col">
                {b.items.map((s, j) => (
                  <div key={j} className="grid grid-cols-[34px_1fr] gap-4 pb-[22px]">
                    <div className="z-10 flex h-7 w-7 items-center justify-center rounded-pill border border-ink bg-warm text-xs">
                      {s.n}
                    </div>
                    <div>
                      <div className="mb-1.5 text-[15px] tracking-tighter2 text-ink">{s.title}</div>
                      <div className="text-[13.5px] leading-[1.55] tracking-tighter2 text-muted">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          case 'cards':
            return (
              <div key={i} className="mb-6 grid max-w-[680px] grid-cols-1 gap-4 sm:grid-cols-2">
                {b.items.map((c, j) => {
                  const inner = (
                    <>
                      <span className="mb-3 inline-flex text-ink">
                        <DocIcon name={c.icon} />
                      </span>
                      <div className="mb-1 text-[15px] font-medium tracking-tighter2 text-ink">
                        {c.title}
                      </div>
                      <div className="text-[13.5px] leading-[1.5] tracking-tighter2 text-muted">
                        {c.desc}
                      </div>
                    </>
                  );
                  const cls = 'block rounded-2xl border border-black/10 p-5 no-underline transition-colors';
                  return c.href ? (
                    <a key={j} href={c.href} className={`${cls} hover:border-ink`}>
                      {inner}
                    </a>
                  ) : (
                    <div key={j} className={cls}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            );
        }
      })}
    </>
  );
}
