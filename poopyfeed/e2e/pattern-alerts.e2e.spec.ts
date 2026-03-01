import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4200';

/**
 * Create 4 bottle feedings via API so pattern-alerts can compute avg interval.
 * Last feeding is placed so that time-since-last > avg_interval * 1.1 (feeding alert fires).
 * Returns childId from current dashboard URL.
 */
async function createFeedingsForOverdueAlert(page: Page): Promise<string> {
  const match = page.url().match(/\/children\/(\d+)\//);
  if (!match) throw new Error('Expected to be on child dashboard');
  const childId = match[1];

  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  if (!token) throw new Error('No auth token in localStorage');

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  // 4 feedings: 4h ago, 3h ago, 2h ago, 1h10m ago. Avg interval = 1h, threshold 1.1h = 66min. 70min > 66min → alert
  const times = [
    new Date(now - 4 * oneHour),
    new Date(now - 3 * oneHour),
    new Date(now - 2 * oneHour),
    new Date(now - 1 * oneHour - 10 * 60 * 1000),
  ];

  for (const fedAt of times) {
    const resp = await page.request.post(
      `${baseURL}/api/v1/children/${childId}/feedings/`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          feeding_type: 'bottle',
          fed_at: fedAt.toISOString(),
          amount_oz: 4,
        },
      }
    );
    if (resp.status() !== 201) {
      throw new Error(`createFeedingsForOverdueAlert: POST feeding returned ${resp.status()}`);
    }
  }

  return childId;
}

/**
 * Create 3 completed naps via API so pattern-alerts can compute avg wake window.
 * Last nap ended_at is placed so that time-awake-since > avg_wake_window * 1.1 (nap alert fires).
 * Returns childId from current dashboard URL.
 */
async function createNapsForOverdueWakeAlert(page: Page): Promise<string> {
  const match = page.url().match(/\/children\/(\d+)\//);
  if (!match) throw new Error('Expected to be on child dashboard');
  const childId = match[1];

  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  if (!token) throw new Error('No auth token in localStorage');

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  // 3 completed naps. Wake window = nap end → next nap start.
  // Nap1: 6h ago start, 5h30m ago end. Nap2: 4h ago start, 3h30m end (wake 30min). Nap3: 2h30m start, 2h end (wake 60min). Avg wake = 45min, threshold 49.5min. minutes_awake = 2h = 120min → alert
  const naps: Array<{ napped_at: Date; ended_at: Date }> = [
    { napped_at: new Date(now - 6 * oneHour), ended_at: new Date(now - 5.5 * oneHour) },
    { napped_at: new Date(now - 4 * oneHour), ended_at: new Date(now - 3.5 * oneHour) },
    { napped_at: new Date(now - 2.5 * oneHour), ended_at: new Date(now - 2 * oneHour) },
  ];

  for (const { napped_at, ended_at } of naps) {
    const resp = await page.request.post(
      `${baseURL}/api/v1/children/${childId}/naps/`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          napped_at: napped_at.toISOString(),
          ended_at: ended_at.toISOString(),
        },
      }
    );
    if (resp.status() !== 201) {
      throw new Error(`createNapsForOverdueAlert: POST nap returned ${resp.status()}`);
    }
  }

  return childId;
}

/**
 * E2E: Pattern alerts on child dashboard.
 * Pattern alerts show when feeding/nap is overdue vs child's history; they load after
 * main dashboard content and do not block render. When no alerts are active, the
 * Pattern alerts region is not rendered (FR-PAL-014).
 *
 * Tests:
 * - New child (no history): dashboard loads, no pattern alert region/cards.
 * - After quick-log: re-fetch runs (FR-PAL-016); dashboard still works, no spurious alerts.
 * - With 4 feedings and last > 1.1× avg ago: feeding alert card is visible (FR-PAL-013).
 * - With 3 completed naps and wake > 1.1× avg: nap alert card is visible (FR-PAL-013).
 */
test.describe('Pattern alerts', () => {
  test('dashboard shows no pattern alert region for new child with no history', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Pattern Alerts');

    await expect(
      page.getByRole('heading', { name: 'Quick Log', level: 2 })
    ).toBeVisible({ timeout: 15_000 });

    // No feeding/nap history → pattern alerts return all false → region not rendered
    await expect(page.getByRole('region', { name: 'Pattern alerts' })).toHaveCount(0);
  });

  test('after quick-log dashboard still works and pattern alerts re-fetch does not break UI', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Pattern Alerts Refetch');

    await page
      .getByRole('button', {
        name: 'Log a wet diaper change with current timestamp',
      })
      .click();

    await expect(
      page.getByText('Wet diaper recorded successfully')
    ).toBeVisible({ timeout: 15_000 });

    // Dashboard refreshes; pattern alerts re-fetched (FR-PAL-016). Insufficient data = no alert cards
    await expect(
      page.getByRole('heading', { name: 'Quick Log', level: 2 })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('region', { name: 'Pattern alerts' })).toHaveCount(0);
  });

  test('dashboard shows feeding pattern alert when overdue vs history', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Pattern Alerts Overdue');

    await createFeedingsForOverdueAlert(page);

    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Quick Log', level: 2 })
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      page.getByRole('region', { name: 'Pattern alerts' })
    ).toBeVisible({ timeout: 25_000 });
    await expect(
      page.getByRole('alert').filter({ hasText: /usually feeds every|it's been/ })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('dashboard shows nap pattern alert when awake longer than usual', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Pattern Alerts Nap');

    await createNapsForOverdueWakeAlert(page);

    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Quick Log', level: 2 })
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      page.getByRole('region', { name: 'Pattern alerts' })
    ).toBeVisible({ timeout: 35_000 });
    await expect(
      page.getByRole('alert').filter({ hasText: /usually naps after|awake for/ })
    ).toBeVisible({ timeout: 30_000 });
  });
});
