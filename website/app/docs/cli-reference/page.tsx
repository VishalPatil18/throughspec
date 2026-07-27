import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'CLI Reference' };

export default function Page() {
  return <DocLayout page={PAGES['cli-reference']!} />;
}
