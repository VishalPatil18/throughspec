'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AnnounceBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="relative flex items-center justify-center gap-3.5 bg-ink px-6 py-2 text-[13px] tracking-tighter2 text-warm">
      <span className="inline-block h-1.5 w-1.5 rounded-pill bg-mint" />
      <span className="opacity-90">
        Throughspec v1.0 - spec-driven development for Claude Code, now on npm + PyPI
      </span>
      <Link
        href="/docs/"
        className="inline-flex items-center gap-1 rounded-pill bg-warm px-3 py-1 text-xs font-medium text-ink no-underline"
      >
        Read the docs <span aria-hidden>&rsaquo;</span>
      </Link>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Dismiss announcement"
        className="absolute right-6 cursor-pointer text-[15px] opacity-60"
      >
        &times;
      </button>
    </div>
  );
}
