import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Spec-Driven Development' };

export default function Page() {
  return <DocLayout page={PAGES['spec-driven-development']!} />;
}
