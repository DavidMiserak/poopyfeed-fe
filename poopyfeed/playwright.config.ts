import { defineConfig, devices } from '@playwright/test';
import { E2E_TIMEOUT } from './e2e/constants';

/**
 * End-to-end tests for PoopyFeed (Angular front-end + Django back-end).
 *
 * Prerequisites: Full stack must be running (e.g. `make run` from repo root).
 * Frontend at baseURL proxies /api to the backend; E2E runs against the app as a user would.
 *
 * Rate limiting: Backend must run with RELAX_E2E_THROTTLES=1 or DEBUG=True so E2E does not
 * hit 429. Use `make run` (sets this in podman-compose) then make test-e2e-local. Any 429
 * fails the test (see fixtures).
 *
 * Auth fixture: "setup" runs first (signup + save storageState). Projects that need a
 * logged-in user use storageState and depend on "setup"; auth tests run without state.
 *
 * Browsers: Firefox is default. In container (make test-e2e): BASE_URL=http://frontend:4200.
 *
 * Mobile-network friendly: Tests use element-based waits (e.g. toBeVisible with timeout)
 * instead of waitForLoadState('networkidle'), so they remain reliable on slow or flaky networks.
 *
 * Fail-fast: All specs use e2e/fixtures.ts. Any API 5xx or 429 fails the test immediately.
 *
 * Run from repo root: make test-e2e (container) or make test-e2e-local (host)
 * Run from front-end/poopyfeed: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
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
      testMatch: /(children|feedings|diapers|naps|sharing|analytics|invite-accept|notifications|feeding-reminders|quick-log|catch-up|pediatrician-summary|pattern-alerts)\.e2e\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      testMatch: /(children|feedings|diapers|naps|sharing|analytics|invite-accept|notifications|feeding-reminders|quick-log|catch-up|pediatrician-summary|pattern-alerts)\.e2e\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  timeout: 60_000,
  expect: { timeout: E2E_TIMEOUT },
});
