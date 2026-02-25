import { test, expect } from '@playwright/test';

/**
 * E2E: Invite-accept flow (second user accepts owner's invite).
 * Uses auth fixture for User A; creates invite, logs out, signs up User B, accepts via token.
 * [Test] Happy path + error case (invalid token) per Test Master.
 */
test.describe('Invite Accept', () => {
  const SHARED_CHILD_NAME = 'E2E Shared Baby';

  test('second user can accept invite link and see shared child', async ({
    page,
  }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (await page.getByRole('heading', { name: 'No children yet!' }).isVisible()) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
      await page.getByLabel("Baby's Name").fill(SHARED_CHILD_NAME);
      await page.getByLabel('Date of Birth').fill('2024-06-01');
      await page.getByRole('radio', { name: 'Female' }).click({ force: true });
      await page.getByRole('button', { name: 'Add Baby' }).click();
      await expect(page).toHaveURL(/\/children$/);
    }

    const firstChildHeading = page.getByRole('heading', { level: 3 }).first();
    await firstChildHeading.click();

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/);
    await page.getByRole('link', { name: 'Manage Sharing' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/sharing$/);
    await page.getByRole('button', { name: 'Create Invite Link' }).click();

    await expect(page.getByTestId('invite-item').first()).toBeVisible({
      timeout: 10000,
    });
    const token = await page
      .getByTestId('invite-item')
      .first()
      .getAttribute('data-invite-token');
    expect(token).toBeTruthy();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(
      page.getByRole('link', { name: 'Log in' }).first()
    ).toBeVisible({ timeout: 5000 });

    const inviteUserEmail = `e2e-invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const inviteUserPassword = 'e2e-invite-password-123';

    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible();
    await page.getByLabel('Full name').fill('E2E Invite User');
    await page.getByLabel('Email address').fill(inviteUserEmail);
    await page.locator('#password').fill(inviteUserPassword);
    await page.locator('#confirmPassword').fill(inviteUserPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/children/);

    await page.goto(`/invites/accept/${token!}`);

    await expect(
      page.getByRole('heading', { name: 'Access Granted! 🎉' })
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByText(/You now have access to .+'s tracking data!/)
    ).toBeVisible();

    await page.getByRole('button', { name: 'View My Children' }).click();
    await expect(page).toHaveURL(/\/children$/);
    await expect(
      page.getByRole('heading', { level: 3 }).first()
    ).toBeVisible();
  });

  test('invalid invite token shows error', async ({ page }) => {
    await page.goto('/invites/accept/invalid-token-xyz');

    await expect(
      page.getByRole('heading', { name: 'Invalid or Expired Invite' })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Go to My Children' })).toBeVisible();
  });
});
