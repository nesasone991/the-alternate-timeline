import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the real production build (`vite build` + `vite preview`).
 * Two projects: a desktop browser and a phone-sized one, running the same specs.
 * No retries: a flaky test should fail visibly, not pass on a second try.
 */
const CI = Boolean(process.env.CI);
// Set E2E_BASE_URL to test another server, e.g. the Cloudflare Pages emulator
// (`npx wrangler pages dev dist`) or a deployed preview URL. No local server is started then.
const EXTERNAL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: CI,
  retries: 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['list'], ['json', { outputFile: process.env.PW_RESULTS ?? 'playwright-results.json' }]] : 'list',
  use: {
    baseURL: EXTERNAL ?? 'http://localhost:4173',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: EXTERNAL
    ? undefined
    : {
        command: 'npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !CI,
        timeout: 60_000,
      },
});
