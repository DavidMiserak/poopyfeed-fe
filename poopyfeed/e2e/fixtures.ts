import { test as base, expect } from '@playwright/test';

/**
 * Extended test with global fail-fast on API errors.
 * - 5xx: server error → fail immediately.
 * - 429: throttling → fail immediately. Start backend with `make run` (sets RELAX_E2E_THROTTLES=1)
 *   so E2E does not hit rate limits. See Makefile targets test-e2e / test-e2e-local.
 * Only responses whose URL contains /api/ are considered.
 */
const THROTTLE_MSG =
  'Start the backend with `make run` so it uses RELAX_E2E_THROTTLES=1, or run E2E via `make test-e2e-local` (requires `make run`).';

export const test = base.extend({
  page: async ({ page }, use) => {
    page.on('response', (response) => {
      const url = response.url();
      if (!url.includes('/api/')) return;

      const status = response.status();
      if (status >= 500) {
        throw new Error(`E2E fail-fast: server error ${status} from ${url}`);
      }
      if (status === 429) {
        throw new Error(
          `E2E fail-fast: backend throttled (429) from ${url}. ${THROTTLE_MSG}`
        );
      }
    });
    await use(page);
  },
});

export { expect };
