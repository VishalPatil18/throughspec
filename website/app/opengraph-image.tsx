import { ImageResponse } from 'next/og';
import { SITE_VERSION } from '@/lib/version';

export const alt = 'Throughspec - Spec-driven SDLC for Claude Code';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

// Dynamic OG card built once at export time, reusing the site palette.
export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f6f3f1',
          padding: '72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="42" height="25" viewBox="0 0 32 19">
            <line x1="1" y1="9.5" x2="31" y2="9.5" stroke="#000" strokeWidth="1.6" />
            <rect x="11.5" y="4" width="11" height="11" fill="#000" />
          </svg>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>throughspec</div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 15,
              color: '#4e4d4d',
              border: '1px solid #000',
              borderRadius: 999,
              padding: '2px 10px',
            }}
          >
            {`v${SITE_VERSION}`}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid #000',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 18,
              alignSelf: 'flex-start',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 999, background: '#a7fccd' }} />
            SPEC-DRIVEN SDLC · FOR CLAUDE CODE
          </div>
          <div style={{ fontSize: 88, lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 980 }}>
            Collapse the gap between idea and shipped software.
          </div>
          <div style={{ fontSize: 22, color: '#4e4d4d', letterSpacing: '-0.02em', maxWidth: 720 }}>
            Deterministic scaffolding, an append-only memory layer, and nine slash commands - published to npm + PyPI.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              background: '#fff',
              border: '1px solid #000',
              borderRadius: 10,
              padding: '10px 16px',
            }}
          >
            npx spec-init my-app
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              background: '#fff',
              border: '1px solid #000',
              borderRadius: 10,
              padding: '10px 16px',
            }}
          >
            pipx install spec-init
          </div>
        </div>
      </div>
    ),
    size,
  );
}
