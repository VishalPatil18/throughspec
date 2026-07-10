import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Learning Map' };

export default function LearningMapPage() {
  return <DocLayout page={PAGES['learning-map']!} />;
}
