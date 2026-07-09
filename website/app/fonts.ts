// Self-hosted fonts (zero third-party CDN, no privacy leak). @fontsource
// injects the @font-face rules; we expose CSS variables that Tailwind's
// `font-serif` / `font-mono` utilities resolve through tailwind.config.ts.

import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/500.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

export const fontVars = {
  '--font-serif': '"Source Serif 4", serif',
  '--font-mono': '"JetBrains Mono", monospace',
} as const;
