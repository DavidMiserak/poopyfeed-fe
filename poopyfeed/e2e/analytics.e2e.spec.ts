import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Analytics dashboard flow (read-only).
 * Uses auth fixture. Isolated state: create a dedicated child with no activity
 * so empty-state assertion is deterministic (no dependency on other tests' data).
 */
test.describe('Analytics', () => {
  const TRACK_CHILD_NAME = 'E2E Track Baby';

  test('user can open analytics dashboard from advanced tools', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Analytics');
    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/);

    await expect(page.getByText('More tools', { exact: true })).toBeVisible();
    await page.getByText('More tools', { exact: true }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);

    await page.getByRole('link', { name: 'Trends & Analytics' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/analytics$/);
    await expect(
      page.getByRole('heading', { name: 'Analytics Dashboard' })
    ).toBeVisible();

    await expect(
      page.getByText('No Activity Data Yet')
    ).toBeVisible({ timeout: E2E_TIMEOUT });
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
      await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, { timeout: E2E_TIMEOUT });
    } else {
      const firstChildHeading = page.getByRole('heading', { level: 3 }).first();
      await firstChildHeading.click();
      await expect(page).toHaveURL(/\/children\/(\d+)\/dashboard/, { timeout: E2E_TIMEOUT });
    }

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

    const downloadPromise = page.waitForEvent('download', { timeout: E2E_TIMEOUT });
    await page
      .getByRole('button', { name: 'Confirm and start export' })
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    await expect(page).toHaveURL(new RegExp(`/children/${childId}/advanced$`), {
      timeout: E2E_TIMEOUT,
    });
  });

  test('user can export PDF and see job complete with download', async ({
    page,
  }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (
      await page.getByRole('heading', { name: 'No children yet!' }).isVisible()
    ) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
      await page.getByLabel("Baby's Name").fill(TRACK_CHILD_NAME);
      await page.getByLabel('Date of Birth').fill('2024-06-01');
      await page.getByRole('radio', { name: 'Female' }).click({ force: true });
      await page.getByRole('button', { name: 'Add Baby' }).click();
      await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
        timeout: E2E_TIMEOUT,
      });
    } else {
      const firstChildHeading = page.getByRole('heading', { level: 3 }).first();
      await firstChildHeading.click();
      await expect(page).toHaveURL(/\/children\/(\d+)\/dashboard/, {
        timeout: E2E_TIMEOUT,
      });
    }

    const url = page.url();
    const childIdMatch = url.match(/\/children\/(\d+)\//);
    expect(childIdMatch).toBeTruthy();
    const childId = childIdMatch![1];

    await page.goto(`/children/${childId}/analytics/export`);

    await expect(
      page.getByRole('heading', { name: 'Export Analytics' })
    ).toBeVisible();
    await expect(
      page.getByRole('radio', { name: /Export as PDF/ })
    ).toBeVisible();
    await page.getByRole('radio', { name: /Export as PDF/ }).check();

    await page
      .getByRole('button', { name: 'Confirm and start export' })
      .click();

    // Job status card shows "PDF ready for download!"; toast may say "PDF export ready for download!"
    await expect(
      page.getByText(/PDF.*ready for download/).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await expect(
      page.getByRole('button', { name: 'Download PDF' })
    ).toBeVisible();
  });
});
