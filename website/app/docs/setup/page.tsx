import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Setup & Channels' };

export default function SetupPage() {
  return <DocLayout page={PAGES['setup']!} />;
}
