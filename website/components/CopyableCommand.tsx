'use client';

// Hover-to-copy shell command: copy icon on hover, "Copy"/"Copied" tooltip on click.

import { useCallback, useState, type ReactNode } from 'react';

interface Props {
  text: string;
  className?: string;
  children?: ReactNode;
  tone?: 'light' | 'dark';
}

/** Wraps a shell-command <code>. Handles hover overlay + clipboard + tooltip. */
export default function CopyableCommand({ text, className, children, tone = 'light' }: Props) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [text]);

  const iconStroke = tone === 'dark' ? '#f6f3f1' : '#000';

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Copied' : `Copy command: ${text}`}
        className={'group relative inline-flex items-center pr-8 font-mono ' + (className ?? '')}
      >
        {children ?? <span>{text}</span>}
        <span
          className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-60"
          aria-hidden="true"
        >
          <CopyIcon stroke={iconStroke} />
        </span>
        <span
          aria-hidden="true"
          className={
            'pointer-events-none absolute right-2 top-full z-40 mt-2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-warm shadow-lg transition-opacity duration-150 ' +
            (copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
          }
        >
          {copied ? 'Copied' : 'Copy'}
        </span>
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </span>
  );
}

function CopyIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke={stroke} strokeWidth="1.6" />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
