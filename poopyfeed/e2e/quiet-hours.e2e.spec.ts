import { test, expect } from './fixtures';

/**
 * E2E: Quiet Hours settings on the account settings page.
 * Uses auth fixture; navigates to /account and asserts Quiet Hours section.
 * Covers VERIFICATION.md E2E gap: Quiet hours settings page.
 */
test.describe('Quiet Hours', () => {
  test('account settings page shows Quiet Hours section', async ({ page }) => {
    await page.goto('/account');

    await expect(
      page.getByRole('heading', { name: 'Account Settings' })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByRole('heading', { name: 'Quiet Hours', level: 2 })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByLabel('Enable quiet hours', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Save Quiet Hours' })
    ).toBeVisible();
  });

  test('saving quiet hours shows success feedback', async ({ page }) => {
    await page.goto('/account');

    await expect(
      page.getByRole('heading', { name: 'Quiet Hours', level: 2 })
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Save Quiet Hours' }).click();

    await expect(
      page.getByText('Quiet hours saved').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
