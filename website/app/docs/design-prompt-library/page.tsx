import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Design Prompt Library' };

export default function DesignPromptsPage() {
  return <DocLayout page={PAGES['design-prompt-library']!} />;
}
