// The animated hero diagram ("Your decisions → Spec Engine → Shipped, with memory").
// Ported from design/Landing.dc.html. Animations resolve through class names
// defined in landing.module.css; keyframes live in app/globals.css.

import s from './landing.module.css';

const LEFT_PILLS = [
  { y: 17, cy: 35, label: 'IDEA' },
  { y: 97, cy: 115, label: 'REQUIREMENTS' },
  { y: 177, cy: 195, label: 'CONSTRAINTS' },
  { y: 257, cy: 275, label: 'NON-GOALS' },
  { y: 337, cy: 355, label: 'REFERENCES' },
];

const RIGHT_PILLS = [
  { y: 17, cy: 35, label: 'SHIPPED CODE' },
  { y: 97, cy: 115, label: 'TESTS' },
  { y: 177, cy: 195, label: 'MEMORY FILES' },
  { y: 257, cy: 275, label: 'DOCS' },
  { y: 337, cy: 355, label: 'CHANGELOG' },
];

// Connector lines - left-source -> node and node -> right-target.
const LEFT_CONNECTORS = [
  { y1: 35, y2: 200, flow: s.flow30 },
  { y1: 115, y2: 208, flow: s.flow26 },
  { y1: 195, y2: 215, flow: s.flow33 },
  { y1: 275, y2: 222, flow: s.flow28 },
  { y1: 355, y2: 230, flow: s.flow35 },
];

const RIGHT_CONNECTORS = [
  { y1: 200, y2: 35, flow: s.flow31 },
  { y1: 208, y2: 115, flow: s.flow27 },
  { y1: 215, y2: 195, flow: s.flow34 },
  { y1: 222, y2: 275, flow: s.flow29 },
  { y1: 230, y2: 355, flow: s.flow36 },
];

/** Renders a pill row (left or right side of the diagram). */
function PillRow({ pills, x, cx, textX }: { pills: typeof LEFT_PILLS; x: number; cx: number; textX: number }) {
  return (
    <g fontFamily="'Source Serif 4',serif" fontSize={13} letterSpacing="-0.3">
      {pills.map((p) => (
        <g key={p.label}>
          <rect x={x} y={p.y} width={230} height={36} rx={18} fill="#f6f3f1" stroke="#000" />
          <circle cx={cx} cy={p.cy} r={3.5} fill="#000" />
          <text x={textX} y={p.cy + 5} fill="#000">
            {p.label}
          </text>
        </g>
      ))}
    </g>
  );
}

export default function DataFlowSVG() {
  return (
    <svg viewBox="0 0 1180 460" width="100%" className="block overflow-visible">
      <defs>
        <radialGradient id="mintGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a7fccd" stopOpacity="0.95" />
          <stop offset="42%" stopColor="#bfe9d8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#cfdaf5" stopOpacity="0" />
        </radialGradient>
        <g id="cog">
          <g fill="#000">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((rot) => (
              <rect
                key={rot}
                x="-2.4"
                y="-20.5"
                width="4.8"
                height="7.5"
                rx="1"
                transform={rot === 0 ? undefined : `rotate(${rot})`}
              />
            ))}
          </g>
          <circle r="14.5" fill="#fff" stroke="#000" strokeWidth="1.4" />
          <circle r="4.6" fill="none" stroke="#000" strokeWidth="1.4" />
          <circle r="1.6" fill="#000" />
        </g>
      </defs>

      <circle cx={588} cy={214} r={205} fill="url(#mintGlow)" className={s.glowPulse} />

      <g strokeLinecap="round">
        {LEFT_CONNECTORS.map((c) => (
          <g key={`l-${c.y1}`}>
            <line x1={250} y1={c.y1} x2={330} y2={c.y2} stroke="#000" strokeOpacity="0.14" strokeWidth="1" />
            <line
              x1={250}
              y1={c.y1}
              x2={330}
              y2={c.y2}
              stroke="#000"
              strokeWidth="1.3"
              strokeDasharray="2.5 9"
              className={c.flow}
            />
          </g>
        ))}
        {RIGHT_CONNECTORS.map((c) => (
          <g key={`r-${c.y2}`}>
            <line x1={848} y1={c.y1} x2={930} y2={c.y2} stroke="#000" strokeOpacity="0.14" strokeWidth="1" />
            <line
              x1={848}
              y1={c.y1}
              x2={930}
              y2={c.y2}
              stroke="#000"
              strokeWidth="1.3"
              strokeDasharray="2.5 9"
              className={c.flow}
            />
          </g>
        ))}
      </g>

      <PillRow pills={LEFT_PILLS} x={20} cx={45} textX={62} />
      <PillRow pills={RIGHT_PILLS} x={930} cx={955} textX={972} />

      <g>
        <path d="M298 186 L344 205 L344 227 L298 246 Z" fill="#f6f3f1" stroke="#000" strokeWidth="1.3" />
        <g transform="translate(350,216) scale(.6)">
          <use href="#cog" className={s.spin32} />
        </g>

        <path d="M836 205 L882 186 L882 246 L836 227 Z" fill="#f6f3f1" stroke="#000" strokeWidth="1.3" />
        <g transform="translate(828,216) scale(.6)">
          <use href="#cog" className={s.spinRev32} />
        </g>
        <g fill="#000">
          <rect x={846} y={211} width={9} height={9} rx={1.6} className={s.eject0} />
          <rect x={846} y={220} width={7} height={7} rx={1.4} className={s.eject1} />
        </g>

        <g transform="translate(470,114) scale(1.5)">
          <use href="#cog" className={s.spin7} />
        </g>
        <g transform="translate(429,123) scale(1.0)">
          <use href="#cog" className={s.spinRev46} />
        </g>
        <g transform="translate(505,99) scale(.6)">
          <use href="#cog" className={s.spin33} />
        </g>

        <g transform="translate(792,106)">
          <circle r={21} fill="#fff" stroke="#000" strokeWidth="1.3" />
          <g stroke="#000" strokeWidth="1">
            <line x1={0} y1={-21} x2={0} y2={-16} />
            <line x1={14.8} y1={-14.8} x2={11} y2={-11} />
            <line x1={-14.8} y1={-14.8} x2={-11} y2={-11} />
            <line x1={21} y1={0} x2={16} y2={0} />
            <line x1={-21} y1={0} x2={-16} y2={0} />
          </g>
          <g className={s.needle}>
            <line x1={0} y1={2} x2={0} y2={-14} stroke="#000" strokeWidth="1.6" />
          </g>
          <circle r={2.4} fill="#000" />
          <text x={0} y={15} textAnchor="middle" fontFamily="'Source Serif 4',serif" fontSize={7} fill="#797776">
            PSI
          </text>
        </g>
        <g fill="#797776">
          <circle cx={811} cy={90} r={5} className={s.steam0} />
          <circle cx={818} cy={92} r={4} className={s.steam1} />
        </g>

        <rect x={338} y={136} width={504} height={168} rx={20} fill="#fff" stroke="#000" strokeWidth="1.5" />
        <g fill="none" stroke="#000" strokeWidth="1.1">
          <circle cx={352} cy={150} r={2.6} />
          <circle cx={828} cy={150} r={2.6} />
          <circle cx={352} cy={290} r={2.6} />
          <circle cx={828} cy={290} r={2.6} />
        </g>

        <rect x={356} y={144} width={468} height={20} rx={7} fill="#242424" />
        <text x={367} y={158} fontFamily="'Source Serif 4',serif" fontSize={10.5} fill="#f6f3f1" letterSpacing="0.4">
          SPEC ENGINE
        </text>
        <text x={458} y={158} fontFamily="'Source Serif 4',serif" fontSize={9} fill="#9b9897">
          deterministic · running
        </text>
        <g>
          <circle cx={792} cy={154} r={3} fill="#a7fccd" className={s.tick0} />
          <circle cx={804} cy={154} r={3} fill="#a7fccd" className={s.tick1} />
          <circle cx={816} cy={154} r={3} fill="#a7fccd" className={s.tick2} />
        </g>

        <g fontFamily="'Source Serif 4',serif">
          <rect x={360} y={172} width={100} height={84} rx={12} fill="#f6f3f1" stroke="#000" strokeWidth="1.2" />
          <rect x={476} y={172} width={100} height={84} rx={12} fill="#f6f3f1" stroke="#000" strokeWidth="1.2" />
          <rect x={592} y={172} width={100} height={84} rx={12} fill="#f6f3f1" stroke="#000" strokeWidth="1.2" />
          <rect x={708} y={172} width={100} height={84} rx={12} fill="#f6f3f1" stroke="#000" strokeWidth="1.2" />

          <g fontSize={8.5} fill="#797776">
            <text x={368} y={187}>01</text>
            <text x={484} y={187}>02</text>
            <text x={600} y={187}>03</text>
            <text x={716} y={187}>04</text>
          </g>
          <g fontSize={10.5} fill="#000" textAnchor="middle">
            <text x={410} y={250}>ASK</text>
            <text x={526} y={250}>SPEC</text>
            <text x={642} y={250}>PLAN</text>
            <text x={758} y={250}>BUILD</text>
          </g>

          {/* Stage 1 - scanner */}
          <g>
            <rect x={388} y={194} width={44} height={40} rx={3} fill="#fff" stroke="#000" strokeWidth="1" />
            <g stroke="#000" strokeOpacity="0.3" strokeWidth="1">
              <line x1={394} y1={202} x2={426} y2={202} />
              <line x1={394} y1={210} x2={420} y2={210} />
              <line x1={394} y1={218} x2={426} y2={218} />
              <line x1={394} y1={226} x2={414} y2={226} />
            </g>
            <g className={s.scan}>
              <rect x={388} y={194} width={44} height={3.5} fill="#a7fccd" />
            </g>
            <g transform="translate(428,190) scale(.4)">
              <use href="#cog" className={s.spin36} />
            </g>
          </g>

          {/* Stage 2 - stamp press */}
          <g>
            <rect x={504} y={192} width={44} height={6} rx={2} fill="#242424" />
            <g className={s.piston}>
              <rect x={523} y={198} width={6} height={16} fill="#000" />
              <rect x={512} y={212} width={28} height={9} rx={2} fill="#242424" />
            </g>
            <rect x={503} y={230} width={46} height={8} rx={2} fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx={526} cy={206} r={4} fill="#797776" className={s.steam18} />
          </g>

          {/* Stage 3 - gearbox */}
          <g>
            <g transform="translate(634,210) scale(.92)">
              <use href="#cog" className={s.spin44} />
            </g>
            <g transform="translate(660,220) scale(.62)">
              <use href="#cog" className={s.spinRev3} />
            </g>
          </g>

          {/* Stage 4 - build drum */}
          <g>
            <g transform="translate(752,208)">
              <circle r={17} fill="#fff" stroke="#000" strokeWidth="1.2" />
              <g className={s.spin26} stroke="#000" strokeWidth="1.2">
                <line x1={-13} y1={0} x2={13} y2={0} />
                <line x1={0} y1={-13} x2={0} y2={13} />
                <line x1={-9} y1={-9} x2={9} y2={9} />
                <line x1={-9} y1={9} x2={9} y2={-9} />
              </g>
              <circle r={2.4} fill="#000" />
            </g>
            <g className={s.pistonX}>
              <rect x={772} y={202} width={9} height={12} rx={1.5} fill="#242424" />
            </g>
            <circle cx={746} cy={190} r={2.2} fill="#a7fccd" className={s.sparkle0} />
            <circle cx={760} cy={188} r={1.8} fill="#a7fccd" className={s.sparkle1} />
          </g>
        </g>

        <g>
          <line x1={362} y1={280} x2={818} y2={280} stroke="#000" strokeOpacity="0.18" strokeWidth="3" />
          <line
            x1={362}
            y1={280}
            x2={818}
            y2={280}
            stroke="#000"
            strokeWidth="1.6"
            strokeDasharray="3 11"
            className={s.flow24}
          />
          <g transform="translate(360,280) scale(.4)">
            <use href="#cog" className={s.spin22} />
          </g>
          <g transform="translate(820,280) scale(.4)">
            <use href="#cog" className={s.spin22} />
          </g>
          <g fill="#000">
            <rect x={364} y={274} width={8} height={8} rx={1.5} className={s.token0} />
            <rect x={364} y={274} width={8} height={8} rx={1.5} className={s.token1} />
            <rect x={364} y={274} width={8} height={8} rx={1.5} className={s.token2} />
          </g>
        </g>
      </g>
    </svg>
  );
}
