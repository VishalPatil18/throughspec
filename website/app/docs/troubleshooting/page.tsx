import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Troubleshooting' };

export default function Page() {
  return <DocLayout page={PAGES['troubleshooting']!} />;
}
