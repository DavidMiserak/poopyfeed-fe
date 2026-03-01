import { test as base, expect } from '@playwright/test';

/**
 * Extended test with global fail-fast on API errors.
 * - 5xx: server error → fail immediately.
 * - 429: throttling → fail immediately (backend must use RELAX_E2E_THROTTLES=1 or DEBUG for E2E).
 * Only responses whose URL contains /api/ are considered.
 */
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
          `E2E fail-fast: backend throttled (429) from ${url}. ` +
            'Run backend with RELAX_E2E_THROTTLES=1 or DEBUG=True so E2E does not hit rate limits.'
        );
      }
    });
    await use(page);
  },
});

export { expect };
