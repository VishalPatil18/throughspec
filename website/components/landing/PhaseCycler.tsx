'use client';

import { useEffect, useState } from 'react';

const PHASES = [
  { num: '01', title: 'Requirements', out: 'Cross-question transcript → features.md' },
  { num: '02', title: 'Architecting', out: '≥2 options + tradeoffs → decisions' },
  { num: '03', title: 'Product Specs', out: 'UI, UX, entities, DB schema' },
  { num: '04', title: 'Tech Specs', out: 'Stack + deploy, rejected alts noted' },
  { num: '05', title: 'Planning', out: 'Staged plan, acceptance criteria' },
  { num: '06', title: 'Writing Code', out: 'Implement → test → refactor → memory' },
];

// Auto-cycling grid of six phase cards. The active card flips to dark
// (bg-dark / text-warm) with a mint dot; others sit on the warm bg.
export default function PhaseCycler() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const iv = window.setInterval(() => {
      setActive((i) => (i + 1) % PHASES.length);
    }, 1700);
    return () => window.clearInterval(iv);
  }, []);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {PHASES.map((p, i) => {
        const on = i === active;
        return (
          <div
            key={p.num}
            className={
              'flex min-h-[180px] flex-col justify-between rounded-3xl border border-ink p-6 transition-colors duration-500 ' +
              (on ? 'bg-dark text-warm' : 'bg-warm text-ink')
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-70">{p.num}</span>
              <span
                className={
                  'inline-block h-2 w-2 rounded-pill transition-colors duration-500 ' +
                  (on ? 'bg-mint' : 'bg-transparent')
                }
              />
            </div>
            <div>
              <div className="mb-2 text-[19px] leading-[1.15] tracking-tighter2">{p.title}</div>
              <div className="text-[11.5px] leading-[1.4] opacity-70">{p.out}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
