import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://throughspec.v-ai.org'),
  title: {
    default: 'Throughspec - Spec-driven SDLC for Claude Code',
    template: '%s - Throughspec',
  },
  description:
    'Throughspec scaffolds a deterministic, spec-first workflow into Claude Code. Twenty-four slash commands, seven tool-scoped agents, an append-only memory layer under 8k tokens, distributed on npm + PyPI.',
  keywords: [
    'Claude Code',
    'spec-driven development',
    'SDLC',
    'AI coding',
    'scaffolding',
    'CLI',
    'Next.js',
    'RAG',
  ],
  authors: [{ name: 'Vishal Patil' }],
  creator: 'Vishal Patil',
  publisher: 'Throughspec',
  applicationName: 'Throughspec',
  category: 'developer tools',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://throughspec.v-ai.org/',
    siteName: 'Throughspec',
    title: 'Throughspec - Spec-driven SDLC for Claude Code',
    description:
      'Deterministic scaffolding, an append-only memory layer, and nine slash commands - published to npm + PyPI.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Throughspec - Spec-driven SDLC for Claude Code',
    description:
      'Deterministic scaffolding, an append-only memory layer, and nine slash commands - published to npm + PyPI.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-warm font-serif text-ink antialiased">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
