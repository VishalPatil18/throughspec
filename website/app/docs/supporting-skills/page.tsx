import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Skills' };

export default function SupportingSkillsPage() {
  return <DocLayout page={PAGES['supporting-skills']!} />;
}
