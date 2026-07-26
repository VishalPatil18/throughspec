import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'The Memory Layer' };

export default function Page() {
  return <DocLayout page={PAGES['memory-layer']!} />;
}
