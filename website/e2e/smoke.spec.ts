// Smoke test - every top-level route returns 200 and renders an <h1>.
// Runs against the static export in out/ served by `npx serve` (see
// playwright.config.ts webServer). Also covers the 404 route.

import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', headingIncludes: 'idea and shipped software' },
  { path: '/why/', headingIncludes: 'Vibe-coding' },
  { path: '/features/', headingIncludes: 'Everything the Kit installs' },
  { path: '/about/', headingIncludes: 'the rails' },
  { path: '/privacy/', headingIncludes: 'Privacy Policy' },
  { path: '/terms/', headingIncludes: 'Terms of Service' },
  { path: '/changelog/', headingIncludes: 'What’s new' },
  { path: '/docs/', headingIncludes: 'Introduction' },
  { path: '/docs/install/', headingIncludes: 'Install' },
  { path: '/docs/quickstart/', headingIncludes: 'Quickstart' },
  { path: '/docs/workflows/', headingIncludes: 'Workflows' },
  { path: '/docs/design-prompt-library/', headingIncludes: 'Design Prompt Library' },
  { path: '/docs/learning-map/', headingIncludes: 'Learning Map' },
  { path: '/docs/customization-recipes/', headingIncludes: 'Customization Recipes' },
];

test.describe('smoke - every route renders', () => {
  for (const r of ROUTES) {
    test(`GET ${r.path}`, async ({ page }) => {
      const res = await page.goto(r.path);
      expect(res?.status(), `expected 200 for ${r.path}`).toBe(200);
      await expect(page.locator('h1')).toContainText(r.headingIncludes);
    });
  }

  test('unknown route renders the 404 page', async ({ page }) => {
    const res = await page.goto('/does-not-exist/');
    // Static hosts return 404 for unknown static paths; the 404.html body is
    // what we care about, not the specific status the local server chooses.
    expect([200, 404]).toContain(res?.status() ?? 0);
    await expect(page.locator('h1')).toContainText('drifted off the throughline');
  });
});
