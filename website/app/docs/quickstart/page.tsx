import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Quickstart' };

export default function QuickstartPage() {
  return <DocLayout page={PAGES['quickstart']!} />;
}
