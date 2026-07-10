'use client';

// Hoverable copy target for shell commands. Shows a centered copy icon at
// 60% opacity on hover; on click writes to clipboard and pops a toast right
// below the command that auto-dismisses after 3s.

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState, type ReactNode } from 'react';

interface Props {
  text: string;
  className?: string;
  children?: ReactNode;
  tone?: 'light' | 'dark';
}

/** Wraps a shell-command <code>. Handles hover overlay + clipboard + toast. */
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
    window.setTimeout(() => setCopied(false), 3000);
  }, [text]);

  const iconStroke = tone === 'dark' ? '#f6f3f1' : '#000';

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy command: ${text}`}
        className={
          'group relative inline-flex items-center font-mono ' + (className ?? '')
        }
      >
        {children ?? <span>{text}</span>}
        <span
          className={
            'pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity duration-150 group-hover:opacity-60 ' +
            (tone === 'dark' ? 'bg-black/40' : 'bg-warm/70')
          }
          aria-hidden="true"
        >
          <CopyIcon stroke={iconStroke} />
        </span>
      </button>
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            role="status"
            className="absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-3 py-1.5 text-[11px] font-medium text-warm shadow-lg"
          >
            Copied to clipboard
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function CopyIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke={stroke} strokeWidth="1.6" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
