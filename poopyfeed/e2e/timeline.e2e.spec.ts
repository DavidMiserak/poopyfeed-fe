import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import type { Page } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

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
    await expect(
      page.getByRole('link', { name: 'Back to advanced tools' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // Page shows timeline content: heading contains "Timeline" and either empty state or day section
    await expect(
      page.getByRole('heading', { name: /'s Timeline$/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    const noEvents = page.getByText('No events logged on this day.');
    const daySection = page.getByRole('heading', { level: 2 });
    await expect(noEvents.or(daySection)).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('timeline shows day navigation (Previous and Next)', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Timeline Nav');
    await goToTimeline(page);

    await expect(
      page.getByRole('heading', { name: /'s Timeline$/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await expect(
      page.getByRole('button', { name: /View previous day|Cannot go before/ })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /View next day|Already viewing today/ })
    ).toBeVisible();
  });

  test('timeline shows today’s activity after quick-log', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Timeline Activity');

    await page
      .getByRole('button', {
        name: 'Log a wet diaper change with current timestamp',
      })
      .click();
    await expect(
      page.getByText('Wet diaper recorded successfully')
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await goToTimeline(page);

    await expect(
      page.getByRole('heading', { name: /'s Timeline$/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(page.getByText('Wet', { exact: true }).first()).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });
});
