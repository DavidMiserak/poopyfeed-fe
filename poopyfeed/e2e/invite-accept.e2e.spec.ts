import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Invite-accept flow (second user accepts owner's invite).
 * Uses auth fixture for User A; creates invite, logs out, signs up User B, accepts via token.
 * [Test] Happy path + error case (invalid token) per Test Master.
 */
test.describe('Invite Accept', () => {
  test('second user can accept invite link and see shared child', async ({
    page,
  }) => {
    const sharedChildName = await createChildAndGoToDashboard(
      page,
      'E2E Shared'
    );

    // Navigate via advanced tools hub to sharing
    await expect(page.getByText('More tools', { exact: true })).toBeVisible();
    await page.getByText('More tools', { exact: true }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);

    await page.getByRole('link', { name: 'Manage Sharing' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/sharing$/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Create Invite Link' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await page.getByRole('button', { name: 'Create Invite Link' }).click();

    await expect(page.getByTestId('invite-item').first()).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
    const token = await page
      .getByTestId('invite-item')
      .first()
      .getAttribute('data-invite-token');
    expect(token).toBeTruthy();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(
      page.getByRole('link', { name: 'Log in' }).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    const inviteUserEmail = `e2e-invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const inviteUserPassword = 'e2e-invite-password-123';

    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible({ timeout: E2E_TIMEOUT });
    await page.getByLabel('Email address').fill(inviteUserEmail);
    await page.locator('#password').fill(inviteUserPassword);
    await page.locator('#confirmPassword').fill(inviteUserPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/children/, { timeout: E2E_TIMEOUT });

    await page.goto(`/invites/accept/${token!}`);

    await expect(
      page.getByRole('heading', { name: 'Access Granted! 🎉' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByText(/You now have access to .+'s tracking data!/).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await page.getByRole('button', { name: 'View My Children' }).click();
    await expect(page).toHaveURL(/\/children$/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: sharedChildName }).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('invalid invite token shows error', async ({ page }) => {
    await page.goto('/invites/accept/invalid-token-xyz');

    await expect(
      page.getByRole('heading', { name: 'Invalid or Expired Invite' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(page.getByRole('button', { name: 'Go to My Children' })).toBeVisible();
  });
});
