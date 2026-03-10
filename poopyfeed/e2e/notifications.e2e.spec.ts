import { test, expect } from './fixtures';
import { createChildAndGoToDashboard } from './child-helpers';
import { E2E_TIMEOUT } from './constants';

/**
 * E2E: Notification bell, dropdown, notification page, and two-user delivery.
 *
 * [Test] Covers:
 *  - Bell icon visible for authenticated users
 *  - Empty notification dropdown and "View all notifications" → notification page
 *  - Notification page: empty state or list, URL /notifications
 *  - Full two-user flow: User A shares child → User B logs feeding → User A sees notification on
 *    notification page and can click through to child dashboard
 *  - Notification preferences visible on child edit page
 *
 * Prerequisites:
 *  - Full stack running (make run). Celery worker must be running for the
 *    "shared user logging an activity creates a notification" test (notification creation is async).
 */
test.describe('Notifications', () => {
  test('bell icon is visible and dropdown shows empty state', async ({
    page,
  }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    // Bell button should be in the header
    const bell = page.getByRole('button', { name: 'Notifications' }).first();
    await expect(bell).toBeVisible();

    // Click bell → wait for notification list API before asserting dropdown content.
    // The dropdown shows "Loading…" until the API responds; asserting before that is flaky under load.
    const listResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/notifications/') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
      { timeout: E2E_TIMEOUT }
    );
    await bell.click();
    await listResponse;
    const dialog = page.getByRole('dialog', { name: 'Notification list' });
    await expect(dialog).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      dialog
        .getByText('No notifications yet.')
        .or(dialog.getByRole('list'))
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // View all notifications goes to notification page (button when dropdown open)
    await page.getByRole('button', { name: 'View all notifications' }).click();
    await expect(page).toHaveURL(/\/notifications$/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: 'Notifications', exact: true })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    // Page shows empty state or list (same as dropdown).
    // Use exact match to avoid matching the h2 "No notifications yet" heading.
    await expect(
      page
        .getByText('No notifications yet', { exact: true })
        .or(page.getByRole('list'))
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('shared user logging an activity creates a notification for the owner', async ({
    page,
  }) => {
    test.setTimeout(60_000); // Two users + Celery async notification
    const fs = await import('fs');
    const path = await import('path');
    const tokenPath = path.join(process.cwd(), 'e2e', '.auth', 'token.json');

    // ── Step 1: User A creates a dedicated child ──
    const childName = await createChildAndGoToDashboard(page, 'E2E Notify');

    // ── Step 2: User A creates an invite link ──

    // Navigate via advanced tools hub to sharing
    await expect(page.getByText('More tools', { exact: true })).toBeVisible();
    await page.getByText('More tools', { exact: true }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);

    await page.getByRole('link', { name: 'Manage Sharing' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/sharing$/);
    await expect(
      page.getByRole('heading', { name: /Sharing Settings/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
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

    // ── Step 3: User A logs out; User B signs up and accepts invite (same flow as invite-accept) ──
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(
      page.getByRole('link', { name: 'Log in' }).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    const userBEmail = `e2e-notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const userBPassword = 'e2e-notif-password-123';

    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible({ timeout: E2E_TIMEOUT });
    await page.getByLabel('Email address').fill(userBEmail);
    await page.locator('#password').fill(userBPassword);
    await page.locator('#confirmPassword').fill(userBPassword);
    await expect(
      page.getByRole('button', { name: 'Create Account' })
    ).toBeEnabled({ timeout: E2E_TIMEOUT });
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/children/, { timeout: E2E_TIMEOUT });

    await page.goto(`/invites/accept/${token!.trim()}`);
    await expect(
      page.getByRole('heading', { name: 'Access Granted! 🎉' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // ── Step 4: User B navigates to shared child and logs a feeding ──
    await page.getByRole('button', { name: 'View My Children' }).click();
    await expect(page).toHaveURL(/\/children$/);

    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await page.getByRole('heading', { name: childName }).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
      timeout: E2E_TIMEOUT,
    });

    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Go to feedings list' }).click();
    // Button now navigates to list, not create form
    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/, { timeout: E2E_TIMEOUT });
    await page.getByRole('button', { name: 'Add Feeding' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create$/, { timeout: E2E_TIMEOUT });
    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Amount (oz)').fill('4');
    await page
      .getByRole('button', { name: /Add Feeding|Save Feeding/ })
      .click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/, {
      timeout: E2E_TIMEOUT,
    });

    // ── Step 5: Restore User A with saved auth token (faster than full storage state) ──
    const { token: savedToken } = JSON.parse(
      fs.readFileSync(tokenPath, 'utf-8')
    ) as { token: string };
    await page.evaluate(
      (t) => localStorage.setItem('auth_token', t),
      savedToken
    );

    // ── Step 6: User A (restored) goes to notification page and sees notification ──
    // Notification is created async by Celery; poll the notification page until it appears.
    await page.goto('/notifications');
    await expect(
      page.getByRole('heading', { name: 'Notifications' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await expect
      .poll(
        async () => {
          await page.reload({ waitUntil: 'networkidle' });
          const hasNotification = await page
            .getByText(/logged a feeding/i)
            .first()
            .isVisible();
          return hasNotification;
        },
        { timeout: E2E_TIMEOUT, intervals: [2000] }
      )
      .toBe(true);

    // Click notification navigates to child dashboard
    await page.getByText(/logged a feeding/i).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
      timeout: E2E_TIMEOUT,
    });
  });

  test('child edit page shows notification preferences', async ({
    page,
  }) => {
    test.setTimeout(120_000); // Extra time for retry on transient API failures
    await createChildAndGoToDashboard(page, 'E2E Notify');

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, { timeout: E2E_TIMEOUT });
    const url = page.url();
    const childId = url.match(/\/children\/(\d+)/)?.[1];
    expect(childId).toBeTruthy();

    const preferencesResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/notifications/preferences/') &&
        resp.status() === 200,
      { timeout: E2E_TIMEOUT }
    );
    await page.goto(`/children/${childId}/edit`);
    await expect(page).toHaveURL(new RegExp(`/children/${childId}/edit`), {
      timeout: E2E_TIMEOUT,
    });
    await expect(page.getByRole('heading', { name: 'Edit Baby' })).toBeVisible(
      { timeout: E2E_TIMEOUT }
    );
    await expect(page.getByLabel("Baby's Name")).toHaveValue(/\S/, {
      timeout: E2E_TIMEOUT,
    });
    await preferencesResponse;

    const panel = page.locator('#advanced-settings-panel');
    await expect(panel).toBeVisible({ timeout: E2E_TIMEOUT });
    await panel.scrollIntoViewIfNeeded();
    await expect(
      panel.getByText('Choose which activities trigger notifications')
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await expect
      .poll(
        async () => {
          const loading = await panel
            .getByText('Loading notification preferences...')
            .isVisible()
            .catch(() => false);
          if (loading) return false;
          const err = await panel
            .locator('.border-red-500')
            .isVisible()
            .catch(() => false);
          if (err) throw new Error('Notification preferences API error');
          return await panel.getByText('Feedings').isVisible().catch(() => false);
        },
        { timeout: E2E_TIMEOUT * 2, intervals: [500] }
      )
      .toBe(true);

    await expect(panel.getByText('Diaper changes')).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
    await expect(panel.getByText('Naps')).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });
});
