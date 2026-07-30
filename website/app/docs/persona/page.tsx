import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Persona' };

export default function PersonaPage() {
  return <DocLayout page={PAGES['persona']!} />;
}
