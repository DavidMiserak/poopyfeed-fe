import { test, expect } from '@playwright/test';

/**
 * E2E: Analytics dashboard flow (read-only).
 * Uses auth fixture; ensures one child then opens the analytics dashboard.
 * [Test] Happy path: navigate from dashboard to analytics and see empty-state messaging.
 */
test.describe('Analytics', () => {
  const TRACK_CHILD_NAME = 'E2E Track Baby';

  test('user can open analytics dashboard from advanced tools', async ({ page }) => {
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

    // Go to advanced tools, then open Analytics.
    await expect(page.getByText('More tools', { exact: true })).toBeVisible();
    await page.getByText('More tools', { exact: true }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);

    await page.getByRole('link', { name: 'Trends & Analytics' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/analytics$/);
    await expect(
      page.getByRole('heading', { name: 'Analytics Dashboard' })
    ).toBeVisible();

    // For a new child we expect the empty-state message (no tracked data yet).
    await expect(
      page.getByText('No Activity Data Yet')
    ).toBeVisible({ timeout: 15000 });
  });

  test('user can export CSV and get a download', async ({ page }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (await page.getByRole('heading', { name: 'No children yet!' }).isVisible()) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
      await page.getByLabel("Baby's Name").fill(TRACK_CHILD_NAME);
      await page.getByLabel('Date of Birth').fill('2024-06-01');
      await page.getByRole('radio', { name: 'Female' }).click({ force: true });
      await page.getByRole('button', { name: 'Add Baby' }).click();
      await expect(page).toHaveURL(/\/children$/);
    }

    const firstChildHeading = page.getByRole('heading', { level: 3 }).first();
    await firstChildHeading.click();

    await expect(page).toHaveURL(/\/children\/(\d+)\/dashboard/);
    const url = page.url();
    const childIdMatch = url.match(/\/children\/(\d+)\//);
    expect(childIdMatch).toBeTruthy();
    const childId = childIdMatch![1];

    await page.goto(`/children/${childId}/analytics/export`);

    await expect(
      page.getByRole('heading', { name: 'Export Analytics' })
    ).toBeVisible();
    await expect(
      page.getByRole('radio', { name: /Export as CSV/ })
    ).toBeVisible();
    await page.getByRole('radio', { name: /Export as CSV/ }).check();

    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page
      .getByRole('button', { name: 'Confirm and start export' })
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    await expect(page).toHaveURL(new RegExp(`/children/${childId}/advanced$`), {
      timeout: 10000,
    });
  });
});
