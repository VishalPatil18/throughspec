import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

// Larger touch icon for iOS. Same BrandMark composition, larger canvas.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f6f3f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="140" height="83" viewBox="0 0 32 19">
          <line x1="1" y1="9.5" x2="31" y2="9.5" stroke="#000" strokeWidth="1.6" />
          <rect x="11.5" y="4" width="11" height="11" fill="#000" />
        </svg>
      </div>
    ),
    size,
  );
}
