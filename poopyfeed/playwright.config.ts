import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests for PoopyFeed (Angular front-end + Django back-end).
 *
 * Prerequisites: Full stack must be running (e.g. `make run` from repo root).
 * Frontend at baseURL proxies /api to the backend; E2E runs against the app as a user would.
 *
 * Browsers: Firefox is default (reliable on Linux). Use --project=chromium for Chrome.
 * In container (make test-e2e): runs with BASE_URL=http://frontend:4200.
 *
 * Run from repo root: make test-e2e (container) or make test-e2e-local (host, Firefox)
 * Run from front-end/poopyfeed: npm run test:e2e
 *
 * Override base URL: BASE_URL=http://localhost:4200 npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'dot' : 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
});
