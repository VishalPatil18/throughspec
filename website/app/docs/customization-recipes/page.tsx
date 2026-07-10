import DocLayout from '@/components/docs/DocLayout';
import { PAGES } from '@/lib/docs-content';

export const metadata = { title: 'Customization Recipes' };

export default function CustomizationRecipesPage() {
  return <DocLayout page={PAGES['customization-recipes']!} />;
}
