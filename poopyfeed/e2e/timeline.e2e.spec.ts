import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import type { Page } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4200';

/**
 * E2E: Timeline view (7-day activity history).
 * Uses auth fixture; creates a child then navigates: Dashboard → Advanced → Timeline.
 * Covers VERIFICATION.md E2E gap: Timeline view (Dad — core feature).
 */

/** Navigate from dashboard to timeline page. */
async function goToTimeline(page: Page): Promise<void> {
  await expect(page.getByText('More tools', { exact: true })).toBeVisible();
  await page.getByText('More tools', { exact: true }).click();
  await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);

  await page.getByRole('link', { name: /7.?Day Timeline/ }).click();
  await expect(page).toHaveURL(/\/children\/\d+\/timeline$/);
}

test.describe('Timeline view', () => {
  test('can navigate to timeline from advanced page', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Timeline');
    await goToTimeline(page);

    await expect(page).toHaveURL(/\/children\/\d+\/timeline$/);
    await expect(page.getByRole('link', { name: 'Back to Advanced' })).toBeVisible({
      timeout: E2E_TIMEOUT,
    });

    // Page shows timeline content: heading contains "Timeline" and either empty state or day section
    await expect(page.getByRole('heading', { name: /'s Timeline$/ })).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
    const noEvents = page.getByText('No events logged on this day.');
    const daySection = page.getByRole('heading', { level: 2 });
    await expect(noEvents.or(daySection)).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('timeline shows day navigation (Previous and Next)', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Timeline Nav');
    await goToTimeline(page);

    await expect(page.getByRole('heading', { name: /'s Timeline$/ })).toBeVisible({
      timeout: E2E_TIMEOUT,
    });

    await expect(
      page.getByRole('button', { name: /View previous day|Cannot go before/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /View next day|Already viewing today/ }),
    ).toBeVisible();
  });

  test('timeline shows today’s activity after quick-log', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Timeline Activity');

    await page
      .getByRole('button', {
        name: 'Log a wet diaper change with current timestamp',
      })
      .click();
    await expect(page.getByText('Wet diaper recorded successfully')).toBeVisible({
      timeout: E2E_TIMEOUT,
    });

    await goToTimeline(page);

    await expect(page.getByRole('heading', { name: /'s Timeline$/ })).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
    await expect(page.getByText('Wet', { exact: true }).first()).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });

  test('Add nap button replaces gap with nap entry', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Timeline AddNap');

    // Create two feedings 2.5 hours apart via API to produce a nap-eligible gap
    const match = page.url().match(/\/children\/(\d+)\//);
    if (!match) throw new Error('Expected to be on child dashboard');
    const childId = match[1];
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    if (!token) throw new Error('No auth token in localStorage');

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const times = [new Date(now - 3 * oneHour), new Date(now - 30 * 60 * 1000)];

    for (const fedAt of times) {
      const resp = await page.request.post(`${baseURL}/api/v1/children/${childId}/feedings/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          feeding_type: 'bottle',
          fed_at: fedAt.toISOString(),
          amount_oz: 4,
        },
      });
      if (resp.status() !== 201) {
        throw new Error(`POST feeding returned ${resp.status()}`);
      }
    }

    await goToTimeline(page);

    // Wait for timeline to load
    await expect(page.getByRole('heading', { name: /'s Timeline$/ })).toBeVisible({
      timeout: E2E_TIMEOUT,
    });

    // Should see the "Add nap" button in the gap
    const addNapButton = page.getByRole('button', { name: /Add nap/ });
    await expect(addNapButton).toBeVisible({ timeout: E2E_TIMEOUT });

    // Click the "Add nap" button
    await addNapButton.click();

    // Should see success toast
    await expect(page.getByText('Nap recorded')).toBeVisible({ timeout: E2E_TIMEOUT });

    // After reload: "Add nap" button should be gone and a nap entry should appear
    await expect(addNapButton).not.toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(page.getByText(/Nap:/).first()).toBeVisible({ timeout: E2E_TIMEOUT });
  });
});
