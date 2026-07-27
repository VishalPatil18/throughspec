// Broken-throughline 404 mark, ported from design/NotFound.dc.html.

import s from './landing.module.css';

export default function NotFoundSVG() {
  return (
    <svg
      width={320}
      height={120}
      viewBox="0 0 320 120"
      className="mx-auto mb-7 block overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="g404" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a7fccd" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#cfdaf5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#cfdaf5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={160} cy={60} r={78} fill="url(#g404)" className={s.glowPulse} />
      <line x1={0} y1={60} x2={118} y2={60} stroke="#000" strokeOpacity="0.16" strokeWidth="1.4" />
      <line
        x1={0}
        y1={60}
        x2={118}
        y2={60}
        stroke="#000"
        strokeWidth="1.4"
        strokeDasharray="2.5 9"
        className={s.flow30}
      />
      <rect x={124} y={44} width={32} height={32} fill="none" stroke="#000" strokeWidth="1.4" strokeDasharray="4 5" />
      <text x={140} y={98} textAnchor="middle" fontFamily="'Source Serif 4',serif" fontSize={10} fill="#797776">
        missing
      </text>
      <line x1={200} y1={60} x2={320} y2={60} stroke="#000" strokeOpacity="0.16" strokeWidth="1.4" />
      <line
        x1={200}
        y1={60}
        x2={320}
        y2={60}
        stroke="#000"
        strokeWidth="1.4"
        strokeDasharray="2.5 9"
        className={s.flow34}
      />
    </svg>
  );
}
