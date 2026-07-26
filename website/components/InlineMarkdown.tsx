import { Fragment } from 'react';
import { parseInline } from '@/lib/inline-markdown';

// Render a short markdown string as inline React nodes (server-safe, no hooks).
export default function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((t, i) => {
        switch (t.type) {
          case 'code':
            return (
              <code
                key={i}
                className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.88em] text-ink"
              >
                {t.value}
              </code>
            );
          case 'bold':
            return (
              <strong key={i} className="font-semibold text-ink">
                {t.value}
              </strong>
            );
          case 'italic':
            return <em key={i}>{t.value}</em>;
          case 'link':
            return (
              <a
                key={i}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink"
              >
                {t.value}
              </a>
            );
          default:
            return <Fragment key={i}>{t.value}</Fragment>;
        }
      })}
    </>
  );
}
