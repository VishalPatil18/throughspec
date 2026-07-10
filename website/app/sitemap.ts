import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASE = 'https://throughspec.dev';

const ROUTES = [
  '/',
  '/why/',
  '/features/',
  '/about/',
  '/hire-the-developer/',
  '/privacy/',
  '/terms/',
  '/changelog/',
  '/docs/',
  '/docs/install/',
  '/docs/quickstart/',
  '/docs/workflows/',
  '/docs/design-prompt-library/',
  '/docs/learning-map/',
  '/docs/customization-recipes/',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path.startsWith('/docs') ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/docs') ? 0.8 : 0.6,
  }));
}
