'use client';

import { useEffect } from 'react';

// Wires up the `.reveal` -> `.revealed` transition via IntersectionObserver.
// Mount once near the root of the landing page; it observes all elements
// carrying the `.reveal` class. Reduced-motion falls back to no animation.
export default function RevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.06 },
    );
    els.forEach((el) => io.observe(el));
    const fallback = window.setTimeout(() => {
      els.forEach((el) => el.classList.add('revealed'));
    }, 2600);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);
  return null;
}
