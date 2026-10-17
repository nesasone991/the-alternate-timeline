import { expect, test, type Page } from '@playwright/test';
import { SAVE_KEY, decide, openAlternateWorkspace } from './helpers';

/**
 * Deployment checks: every route works when opened directly and after a reload,
 * saves survive reloads on nested routes, the beta is labelled and kept out of
 * search engines, and the site talks to no other host.
 *
 * Runs against `vite preview` by default. With E2E_BASE_URL it runs against
 * another server; with E2E_CLOUDFLARE=1 (CI: `wrangler pages dev dist`, the
 * Cloudflare Pages emulator) it also checks the headers from dist/_headers.
 */

const ROUTES = [
  { path: '/', title: 'The Alternate Timeline', h1: 'The Alternate Timeline' },
  { path: '/explore', title: 'Explore History — The Alternate Timeline', h1: 'Explore History' },
  { path: '/how-it-works', title: 'How It Works — The Alternate Timeline', h1: 'How It Works' },
  { path: '/about', title: 'About — The Alternate Timeline', h1: 'About' },
  { path: '/privacy', title: 'Privacy — The Alternate Timeline', h1: 'Privacy' },
  { path: '/campaigns/fall-of-rome', title: 'The Fall of Rome — The Alternate Timeline', h1: 'The Fall of Rome — 476 AD' },
  { path: '/campaigns/fall-of-rome/workspace', title: 'The Fall of Rome workspace — The Alternate Timeline', h1: 'The Fall of Rome' },
  {
    path: '/campaigns/fall-of-rome/workspace?mode=alternate',
    title: 'The Fall of Rome workspace — The Alternate Timeline',
    h1: 'The Fall of Rome',
  },
  {
    path: '/campaigns/fall-of-rome/ending',
    title: 'The Fall of Rome: no ending yet — The Alternate Timeline',
    h1: 'There is no finished campaign here yet',
  },
  { path: '/campaigns/fall-of-rome/no-such-page', title: 'Page not found — The Alternate Timeline', h1: 'Page not found' },
  { path: '/no/such/page', title: 'Page not found — The Alternate Timeline', h1: 'Page not found' },
] as const;

/** Records console errors, failed page errors and requests to any other host. */
function watch(page: Page, baseURL: string) {
  const problems: string[] = [];
  const host = new URL(baseURL).host;
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.host !== host) problems.push(`request to another host: ${url.href}`);
  });
  return problems;
}

for (const route of ROUTES) {
  test(`direct visit and reload: ${route.path}`, async ({ page, baseURL }) => {
    const problems = watch(page, baseURL!);
    for (const attempt of ['visit', 'reload'] as const) {
      const response = attempt === 'visit' ? await page.goto(route.path) : await page.reload();
      // The server answers 200 with the app for every route; the app shows its own not-found page.
      expect(response?.status(), `${attempt} status`).toBe(200);
      expect(response?.headers()['content-type'] ?? '').toContain('text/html');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.h1);
      await expect(page).toHaveTitle(route.title);
    }
    expect(problems).toEqual([]);
  });
}

test('a save made on a nested route survives reloads and direct visits', async ({ page }) => {
  await openAlternateWorkspace(page);
  await decide(page, 'Reform taxation');
  await expect(page.getByRole('heading', { name: 'Border defence' })).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  expect(JSON.parse(saved!).choices).toEqual(['reform-taxation']);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Border defence' })).toBeVisible();
  await expect(page.getByText(/Your progress was restored/)).toBeVisible();

  await page.goto('/campaigns/fall-of-rome/ending');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your campaign has not reached an ending yet');
  await page.getByRole('link', { name: 'Continue your campaign' }).click();
  await expect(page.getByRole('heading', { name: 'Border defence' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
});

test('the beta is labelled and asks search engines not to index it', async ({ page, request }) => {
  await page.goto('/campaigns/fall-of-rome');
  await expect(page.getByTestId('beta-notice')).toContainText('Private beta.');
  await expect(page.getByTestId('build-label')).toContainText('Private beta');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /The Alternate Timeline/);

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Disallow: /');
});

test('a whole campaign talks to no other host and logs no errors', async ({ page, baseURL }) => {
  const problems = watch(page, baseURL!);
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore Campaign' }).first().click();
  await page.getByRole('link', { name: 'Open the workspace' }).click();
  await page.getByRole('tab', { name: /Alternate History/ }).click();
  for (const choice of [
    'Reform taxation',
    'Settle allies as federates',
    'Give up Africa and fortify what remains',
    'Strike a bargain with the regional powers',
    'Hand government to successor rulers under Constantinople',
  ]) {
    await decide(page, choice);
  }
  await page.getByRole('link', { name: 'See the fate of your empire' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fragmented Survival');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fragmented Survival');
  expect(problems).toEqual([]);
});

test('Cloudflare Pages headers: security, no indexing, long cache for hashed assets', async ({ page, request }) => {
  // Set from E2E_CLOUDFLARE in playwright.config.ts (kept out of this file, which the app's tsconfig checks without Node types).
  test.skip(!test.info().config.metadata.cloudflare, 'Only meaningful against the Cloudflare Pages emulator or a real Pages deployment.');
  for (const path of ['/', '/campaigns/fall-of-rome/ending', '/privacy']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-robots-tag']).toContain('noindex');
  }
  await page.goto('/');
  const script = await page.locator('script[type="module"][src^="/assets/"]').getAttribute('src');
  const asset = await request.get(script!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['cache-control']).toContain('immutable');
});
