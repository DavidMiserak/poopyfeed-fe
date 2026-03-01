import { test, expect } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Pediatrician summary — navigate from child context, assert summary and Print.
 * Covers pediatrician-summary.spec.md AC-004 (optional E2E): navigate to Pediatrician
 * summary from child context; assert summary section and Print button visible.
 */
test.describe('Pediatrician summary', () => {
  test('user can open pediatrician summary from advanced and see summary section and Print button', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Pediatrician');
    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/);

    await expect(page.getByText('More tools', { exact: true })).toBeVisible();
    await page.getByText('More tools', { exact: true }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);

    await page.getByRole('link', { name: 'For the Doctor' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/pediatrician-summary$/);

    // Wait for loading to finish (Print button is only shown when content/empty state is ready)
    await expect(
      page.getByRole('button', { name: 'Print' })
    ).toBeVisible({ timeout: 15_000 });

    // Summary section: either period label (content) or empty state message
    const summaryContent = page.getByText(/Last 7 days|No activity in the last 7 days/);
    await expect(summaryContent).toBeVisible({ timeout: 5_000 });
  });
});
