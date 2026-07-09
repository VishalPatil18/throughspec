// Small SVG logo shared by Nav and Footer.

export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="19"
      viewBox="0 0 32 19"
      aria-hidden="true"
      className={className}
    >
      <line x1="1" y1="9.5" x2="31" y2="9.5" stroke="#000" strokeWidth="1.4" />
      <rect x="11.5" y="4" width="11" height="11" fill="#000" />
    </svg>
  );
}
