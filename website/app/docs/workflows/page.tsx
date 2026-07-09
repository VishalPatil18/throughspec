import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Workflows' };

export default function WorkflowsPage() {
  return <DocLayout page={PAGES['workflows']!} />;
}
