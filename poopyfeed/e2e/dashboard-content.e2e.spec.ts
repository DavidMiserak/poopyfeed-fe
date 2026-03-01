import { test, expect } from './fixtures';
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
    ).toBeVisible({ timeout: 15_000 });

    // New child has no activity: empty state or zero counts
    const noActivity = page.getByText('No activity recorded today');
    const feedingsLabel = page.getByText('Feedings Today', { exact: true });
    await expect(noActivity.or(feedingsLabel)).toBeVisible({ timeout: 5_000 });
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
    ).toBeVisible({ timeout: 15_000 });

    // Dashboard refreshes via onQuickLogged(); wait for Recent Activity to appear
    await expect(
      page.getByRole('heading', { name: 'Recent Activity', level: 2 })
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText('Wet', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
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
    ).toBeVisible({ timeout: 15_000 });

    // Summary refreshes; Diapers Today card (inside Today's Summary section card) shows count 1
    await expect(
      page.getByText('Diapers Today', { exact: true })
    ).toBeVisible({ timeout: 15_000 });
    const todaySummarySection = page.getByRole('heading', {
      name: "Today's Summary",
      level: 2,
    });
    await expect(todaySummarySection).toBeVisible({ timeout: 10_000 });
    await expect(todaySummarySection.locator('..').getByText('1')).toBeVisible({
      timeout: 10_000,
    });
  });
});
