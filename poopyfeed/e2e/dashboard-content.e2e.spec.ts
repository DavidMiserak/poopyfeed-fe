import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Child dashboard content — Today's Summary and Recent Activity.
 * Uses auth fixture; creates a child and asserts dashboard sections render.
 * Section headings are rendered by DashboardSectionCardComponent (title input).
 * Covers VERIFICATION.md E2E gap: Child dashboard content (Today Summary, Recent Activity).
 */
test.describe('Dashboard content', () => {
  test('dashboard shows Today\'s Summary section', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Dashboard Summary');

    await expect(
      page.getByRole('heading', { name: "Today's Summary", level: 2 })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // New child has no activity: empty state or zero counts
    const noActivity = page.getByText('No activity recorded today');
    const feedingsLabel = page.getByText('Feedings Today', { exact: true });
    await expect(noActivity.or(feedingsLabel)).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('dashboard shows Recent Activity after quick-logging a diaper', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Dashboard Activity');

    await page
      .getByRole('button', {
        name: 'Log a wet diaper change with current timestamp',
      })
      .click();

    await expect(
      page.getByText('Wet diaper recorded successfully')
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // Dashboard refreshes via onQuickLogged(); wait for Recent Activity to appear
    await expect(
      page.getByRole('heading', { name: 'Recent Activity', level: 2 })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await expect(page.getByText('Wet', { exact: true }).first()).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });

  test('Today\'s Summary shows diaper count after quick-log', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Dashboard Diaper Count');

    await page
      .getByRole('button', {
        name: 'Log a wet diaper change with current timestamp',
      })
      .click();

    await expect(
      page.getByText('Wet diaper recorded successfully')
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // Summary refreshes; Diapers Today card (inside Today's Summary section card) shows count 1
    await expect(
      page.getByText('Diapers Today', { exact: true })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    const todaySummarySection = page.getByRole('heading', {
      name: "Today's Summary",
      level: 2,
    });
    await expect(todaySummarySection).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(todaySummarySection.locator('..').getByText('1')).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });
});
