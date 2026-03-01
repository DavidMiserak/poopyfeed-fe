import type { Page } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4200';

/** Number of items to create so a list with page size 50 shows two pages. */
const PAGINATION_ITEM_COUNT = 21;

/** Max events per batch request (backend limit). */
const BATCH_SIZE = 20;

/** Map path segment to batch API event type. */
const SEGMENT_TO_BATCH_TYPE: Record<string, string> = {
  feedings: 'feeding',
  diapers: 'diaper',
  naps: 'nap',
};

/**
 * Create 21 items via batch API so a tracking list has two pages (page size 50).
 * Uses the batch endpoint (up to 20 events per request) to avoid rate limiting (120/hour).
 * Uses recent timestamps (last 21 minutes) so items are within any default date filter.
 * Call when already on a child dashboard. Returns childId.
 *
 * @param page - Playwright page (must be on child dashboard)
 * @param pathSegment - API segment: 'feedings' | 'diapers' | 'naps'
 * @param buildPayload - Function returning the POST body for each item (receives timestamp)
 */
export async function createItemsForPagination(
  page: Page,
  pathSegment: 'feedings' | 'diapers' | 'naps',
  buildPayload: (timestamp: Date) => Record<string, unknown>
): Promise<string> {
  const match = page.url().match(/\/children\/(\d+)\//);
  if (!match) throw new Error('Expected to be on child dashboard');
  const childId = match[1];

  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  if (!token) throw new Error('No auth token in localStorage');

  const eventType = SEGMENT_TO_BATCH_TYPE[pathSegment];
  const baseTime = Date.now() - PAGINATION_ITEM_COUNT * 60 * 1000;
  const events: Array<{ type: string; data: Record<string, unknown> }> = [];
  for (let i = 0; i < PAGINATION_ITEM_COUNT; i++) {
    const at = new Date(baseTime + i * 60 * 1000);
    events.push({ type: eventType, data: buildPayload(at) });
  }

  for (let offset = 0; offset < events.length; offset += BATCH_SIZE) {
    const chunk = events.slice(offset, offset + BATCH_SIZE);
    const response = await page.request.post(
      `${baseURL}/api/v1/children/${childId}/batch/`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        data: { events: chunk },
      }
    );
    if (response.status() !== 201) {
      const body = await response.text();
      throw new Error(
        `Pagination setup: batch POST returned ${response.status()}, expected 201. Body: ${body.slice(0, 500)}`
      );
    }
  }

  return childId;
}
