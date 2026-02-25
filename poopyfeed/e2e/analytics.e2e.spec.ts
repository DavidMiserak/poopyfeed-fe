import { test, expect } from '@playwright/test';

/**
 * E2E: Analytics dashboard flow (read-only).
 * Uses auth fixture; ensures one child then opens the analytics dashboard.
 * [Test] Happy path: navigate from dashboard to analytics and see empty-state messaging.
 */
test.describe('Analytics', () => {
  const TRACK_CHILD_NAME = 'E2E Track Baby';

  test('user can open analytics dashboard from child dashboard', async ({ page }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    // Ensure at least one child exists (owner).
    if (await page.getByRole('heading', { name: 'No children yet!' }).isVisible()) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
      await expect(page).toHaveURL(/\/children\/create/);

      await page.getByLabel("Baby's Name").fill(TRACK_CHILD_NAME);
      await page.getByLabel('Date of Birth').fill('2024-06-01');
      await page.getByRole('radio', { name: 'Female' }).click({ force: true });
      await page.getByRole('button', { name: 'Add Baby' }).click();

      await expect(page).toHaveURL(/\/children$/);
    }

    // Open the first child's dashboard.
    const firstChildHeading = page.getByRole('heading', { level: 3 }).first();
    await firstChildHeading.click();

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/);

    // Navigate to Analytics from the dashboard CTA.
    await page.getByRole('button', { name: 'Analytics' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/analytics$/);
    await expect(
      page.getByRole('heading', { name: 'Analytics Dashboard' })
    ).toBeVisible();

    // For a new child we expect the empty-state message (no tracked data yet).
    await expect(
      page.getByText('No Activity Data Yet')
    ).toBeVisible({ timeout: 15000 });
  });
});
