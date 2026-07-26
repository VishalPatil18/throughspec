// Inline-SVG icon set for docs cards and callouts. Zero-dep; stroke = currentColor.

type IconName =
  | 'rocket'
  | 'wand'
  | 'compass'
  | 'key'
  | 'lightbulb'
  | 'info'
  | 'warning'
  | 'book'
  | 'plug'
  | 'terminal'
  | 'map'
  | 'question'
  | 'layers'
  | 'shield';

const PATHS: Record<IconName, React.ReactNode> = {
  rocket: <path d="M5 15c-1 1-1.5 4-1.5 4s3-.5 4-1.5m8.5-13c2.5 0 4 1.5 4 4-.5 4-4 7.5-8 9l-3-3c1.5-4 5-7.5 9-8Z M9 15l-2-2" />,
  wand: <path d="M6 18 18 6m-3-1 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2ZM5 11l.6 1.4L7 13l-1.4.6L5 15l-.6-1.4L3 13l1.4-.6L5 11Z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H20l-2 2m-2-2v2" />
    </>
  ),
  lightbulb: <path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
  warning: <path d="M12 3 2 20h20L12 3Zm0 6v5m0 3h.01" />,
  book: <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Zm0 0v13m2-9h7M7 12h7" />,
  plug: <path d="M9 3v5m6-5v5M6 8h12v2a6 6 0 0 1-12 0V8Zm6 8v5" />,
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3m6 0h4" />
    </>
  ),
  map: <path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6l6-2Zm0 0v14m6-12v14" />,
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7m0 3h.01" />
    </>
  ),
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5" />,
  shield: <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6l-7-3Zm-2 8 1.5 1.5L15 9" />,
};

/** Render a named line icon. Falls back to a dot for unknown names. */
export default function DocIcon({ name, size = 22 }: { name: string; size?: number }) {
  const path = PATHS[name as IconName] ?? <circle cx="12" cy="12" r="3" />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
