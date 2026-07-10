import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: '#f6f3f1',
        ink: '#000000',
        muted: '#4e4d4d',
        dim: '#797776',
        dark: '#242424',
        mint: '#a7fccd',
        mintSoft: '#bfe9d8',
        cloud: '#cfdaf5',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Source Serif 4', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter2: '-0.02em',
      },
      borderRadius: {
        pill: '100px',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
