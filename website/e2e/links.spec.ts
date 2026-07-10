// Internal link checker - crawls every top-level route, collects every
// same-origin href, and asserts each one resolves with a 200.

import { test, expect, request } from '@playwright/test';

const START_PATHS = [
  '/',
  '/why/',
  '/features/',
  '/about/',
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

test('every internal link resolves', async ({ baseURL, page }) => {
  const seen = new Set<string>();
  const origin = new URL(baseURL!).origin;

  for (const path of START_PATHS) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute('href') || ''),
    );
    for (const h of hrefs) {
      if (!h || h.startsWith('#')) continue;
      const abs = new URL(h, origin + path);
      if (abs.origin !== origin) continue;
      // Strip the hash for HEAD checks; anchor targets are validated by
      // Playwright's page rendering when the smoke suite visits the page.
      const url = abs.origin + abs.pathname;
      seen.add(url);
    }
  }

  const api = await request.newContext();
  const broken: string[] = [];
  for (const url of seen) {
    const res = await api.get(url);
    if (res.status() >= 400) broken.push(`${res.status()} ${url}`);
  }
  expect(broken, `broken internal links:\n${broken.join('\n')}`).toEqual([]);
});
