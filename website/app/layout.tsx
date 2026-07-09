import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://throughspec.dev'),
  title: {
    default: 'Throughspec - Spec-driven SDLC for Claude Code',
    template: '%s - Throughspec',
  },
  description:
    'Throughspec scaffolds a deterministic, spec-first workflow into Claude Code. Structure keeps the work from drifting.',
  openGraph: {
    title: 'Throughspec',
    description: 'Spec-driven SDLC for Claude Code.',
    type: 'website',
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
