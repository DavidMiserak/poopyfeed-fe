import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests for PoopyFeed (Angular front-end + Django back-end).
 *
 * Prerequisites: Full stack must be running (e.g. `make run` from repo root).
 * Frontend at baseURL proxies /api to the backend; E2E runs against the app as a user would.
 *
 * Auth fixture: "setup" runs first (signup + save storageState). Projects that need a
 * logged-in user use storageState and depend on "setup"; auth tests run without state.
 *
 * Browsers: Firefox is default. In container (make test-e2e): BASE_URL=http://frontend:4200.
 *
 * Run from repo root: make test-e2e (container) or make test-e2e-local (host)
 * Run from front-end/poopyfeed: npm run test:e2e
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
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /auth\.e2e\.spec\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\.e2e\.spec\.ts/,
    },
    {
      name: 'firefox-authenticated',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/user.json',
      },
      testMatch: /(children|feedings|diapers|naps|sharing|analytics|invite-accept|notifications|feeding-reminders|quick-log)\.e2e\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testMatch: /(children|feedings|diapers|naps|sharing|analytics|invite-accept|notifications|feeding-reminders|quick-log)\.e2e\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
});
