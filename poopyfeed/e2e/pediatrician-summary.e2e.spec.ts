import { test, expect } from './fixtures';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Pediatrician summary — navigate from child context, assert summary and Print.
 * Covers pediatrician-summary.spec.md AC-004 (optional E2E): navigate from child context;
 * assert summary section and Print button visible.
 * Page uses SummaryNavComponent (Back to Advanced + Print) and SummaryEmptyStateComponent when empty.
 */
test.describe('Pediatrician summary', () => {
  test('user can open pediatrician summary from advanced and see summary section and Print button', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Pediatrician');
    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/);

    await expect(page.getByText('More tools', { exact: true })).toBeVisible({ timeout: 15_000 });
    await page.getByText('More tools', { exact: true }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/, { timeout: 10_000 });

    // Advanced page uses AdvancedToolsGridComponent for tool links
    await expect(page.getByRole('link', { name: 'For the Doctor' })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('link', { name: 'For the Doctor' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/pediatrician-summary$/, { timeout: 10_000 });

    // SummaryNavComponent: back link and Print button
    await expect(page.getByRole('link', { name: 'Back to Advanced' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole('button', { name: /Print/ })
    ).toBeVisible({ timeout: 25_000 });

    // Summary section: either period label (content) or SummaryEmptyStateComponent message
    const summaryContent = page.getByText(/Last 7 days|No activity in the last 7 days/);
    await expect(summaryContent).toBeVisible({ timeout: 10_000 });
  });
});
