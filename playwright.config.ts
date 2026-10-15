import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the real production build (`vite build` + `vite preview`).
 * Two projects: a desktop browser and a phone-sized one, running the same specs.
 * No retries: a flaky test should fail visibly, not pass on a second try.
 */
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: CI,
  retries: 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['list'], ['json', { outputFile: 'playwright-results.json' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
