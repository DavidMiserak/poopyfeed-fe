import { test, expect } from './fixtures';
import { createChildAndGoToDashboard } from './child-helpers';
import { E2E_TIMEOUT } from './constants';

/**
 * E2E: Pediatrician summary — navigate from child context, assert summary.
 * Covers pediatrician-summary.spec.md AC-004 (optional E2E): navigate from child context;
 * assert summary section visible.
 * Page uses SummaryNavComponent (Back to Advanced) and SummaryEmptyStateComponent when empty.
 */
test.describe('Pediatrician summary', () => {
  test('user can open pediatrician summary from advanced and see summary section', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Pediatrician');
    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, { timeout: E2E_TIMEOUT });

    const moreTools = page.getByText('More tools', { exact: true });
    await expect(moreTools).toBeVisible({ timeout: E2E_TIMEOUT });
    await moreTools.scrollIntoViewIfNeeded();
    await moreTools.click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/, { timeout: E2E_TIMEOUT });

    await expect(page.getByRole('link', { name: 'For the Doctor' })).toBeVisible({ timeout: E2E_TIMEOUT });
    await page.getByRole('link', { name: 'For the Doctor' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/pediatrician-summary$/, { timeout: E2E_TIMEOUT });

    // Wait for SummaryNavComponent (loading finished)
    await expect(page.getByRole('link', { name: 'Back to Advanced' })).toBeVisible({
      timeout: E2E_TIMEOUT,
    });

    // Summary section: either period label (content) or SummaryEmptyStateComponent message
    const summaryContent = page.getByText(/Last 7 days|No activity in the last 7 days/).first();
    await expect(summaryContent).toBeVisible({ timeout: E2E_TIMEOUT });
  });
});
