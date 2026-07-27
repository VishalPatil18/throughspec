import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

// File-based tab icon: the BrandMark shape rendered at 32x32.
export default function Icon() {
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
        <svg width="26" height="16" viewBox="0 0 32 19">
          <line x1="1" y1="9.5" x2="31" y2="9.5" stroke="#000" strokeWidth="2.2" />
          <rect x="11.5" y="4" width="11" height="11" fill="#000" />
        </svg>
      </div>
    ),
    size,
  );
}
