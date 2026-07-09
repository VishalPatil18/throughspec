import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Install' };

export default function InstallPage() {
  return <DocLayout page={PAGES['install']!} />;
}
