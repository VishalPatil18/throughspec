import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Docs' };

export default function DocsIndex() {
  return <DocLayout page={PAGES['']!} />;
}
