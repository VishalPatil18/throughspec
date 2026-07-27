// Self-hosted fonts exposed as CSS vars for Tailwind's font-serif/font-mono (no CDN).

import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/500.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

export const fontVars = {
  '--font-serif': '"Source Serif 4", serif',
  '--font-mono': '"JetBrains Mono", monospace',
} as const;
