'use client';

// Docs code block: pre on the left, permanent copy button in the top-right.
// Distinct from the marketing site's <CopyableCommand> (which hovers).
// Docs users copy commands frequently, so the affordance is always visible.

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';

export default function DocCodeBlock({ text }: { text: string }) {
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

  return (
    <div className="relative mb-[22px] max-w-[680px] rounded-xl border border-ink bg-white">
      <div className="overflow-x-auto px-5 pb-[18px] pr-14 pt-[18px]">
        <pre className="m-0 whitespace-pre text-left font-mono text-[13.5px] leading-[1.6] text-ink">
          {text}
        </pre>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy: ${text}`}
        title="Copy to clipboard"
        className="absolute right-2 top-2 flex h-[35px] w-[35px] items-center justify-center text-dim hover:text-ink"
      >
        <CopyIcon />
      </button>
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            role="status"
            className="absolute right-2 top-11 z-40 whitespace-nowrap rounded-md bg-ink px-3 py-1.5 text-[11px] font-medium text-warm shadow-lg"
          >
            Copied to clipboard
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
