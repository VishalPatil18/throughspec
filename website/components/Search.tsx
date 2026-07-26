'use client';

// Search modal backed by Pagefind (index built by build-search.mjs); loaded lazily.

import { useCallback, useEffect, useRef, useState } from 'react';

interface PagefindResult {
  id: string;
  data: () => Promise<{
    url: string;
    meta?: { title?: string };
    excerpt: string;
  }>;
}

interface Pagefind {
  search: (q: string) => Promise<{ results: PagefindResult[] }>;
}

type LoadedResult = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
};

/** Search modal + `⌘K` binding. Mount once inside DocLayout. */
export default function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LoadedResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagefindRef = useRef<Pagefind | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const loadPagefind = useCallback(async (): Promise<Pagefind | null> => {
    if (pagefindRef.current) return pagefindRef.current;
    try {
      // Hide the specifier in a Function ctor so bundlers don't rewrite the dynamic import.
      const dynamicImport = new Function('return import("/pagefind/pagefind.js")');
      const mod = (await dynamicImport()) as Pagefind;
      pagefindRef.current = mod;
      return mod;
    } catch (err) {
      // /pagefind/ is absent in next dev; log so failures aren't silent.
      console.warn(
        '[Search] Pagefind not available. In dev, run `npm run build` first. In prod, verify /pagefind/pagefind.js is deployed.',
        err,
      );
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open || !query.trim()) {
        setResults([]);
        return;
      }
      const pf = await loadPagefind();
      if (!pf) return;
      const { results: raw } = await pf.search(query);
      const loaded = await Promise.all(raw.slice(0, 8).map(async (r) => {
        const data = await r.data();
        return {
          id: r.id,
          url: data.url,
          title: data.meta?.title ?? data.url,
          excerpt: data.excerpt,
        };
      }));
      if (!cancelled) setResults(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, query, loadPagefind]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-8 flex w-full items-center gap-[10px] rounded-[10px] border border-ink px-[13px] py-[9px] text-left"
        aria-label="Search docs"
      >
        <SearchIcon />
        <span className="text-[12.5px] text-dim">Search docs</span>
        <span className="ml-auto rounded-md border border-black/20 px-[6px] py-[1px] text-[11px] text-dim">⌘K</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-2xl bg-warm p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center gap-2 border-b border-black/10 pb-2">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the docs"
                className="w-full bg-transparent px-1 py-2 text-[15px] tracking-tighter2 outline-none placeholder:text-dim"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-black/20 px-2 py-1 text-[11px] text-dim"
              >
                Esc
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {results.length === 0 && query.trim() && (
                <div className="p-3 text-sm text-muted">No results.</div>
              )}
              {results.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  className="block rounded-xl px-3 py-2 no-underline hover:bg-cloud"
                >
                  <div className="text-[14px] text-ink">{r.title}</div>
                  <div
                    className="search-result mt-1 text-[12.5px] leading-[1.5] text-muted"
                    dangerouslySetInnerHTML={{ __html: r.excerpt }}
                  />
                </a>
              ))}
              {results.length === 0 && !query.trim() && (
                <div className="p-3 text-sm text-muted">
                  Type to search. Runs entirely in your browser after the first query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="#797776" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="#797776" strokeWidth="1.3" />
    </svg>
  );
}
