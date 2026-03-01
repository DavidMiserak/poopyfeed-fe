import { test, expect } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Notification bell, dropdown, and two-user notification delivery.
 *
 * [Test] Covers:
 *  - Bell icon visible for authenticated users
 *  - Empty notification dropdown
 *  - Full two-user flow: User A shares child → User B logs feeding → User A sees notification
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

    // Click bell → dropdown shows list (empty or with notifications from other runs)
    await bell.click();
    const dialog = page.getByRole('dialog', { name: 'Notification list' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog
        .getByText('No notifications yet.')
        .or(dialog.getByRole('list'))
    ).toBeVisible({ timeout: 10000 });
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
      page.getByRole('heading', { name: /Sharing Settings for/ })
    ).toBeVisible({ timeout: 25000 });
    await expect(
      page.getByRole('button', { name: 'Create Invite Link' })
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Create Invite Link' }).click();
    await expect(page.getByTestId('invite-item').first()).toBeVisible({
      timeout: 10000,
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
    ).toBeVisible({ timeout: 5000 });

    const userBEmail = `e2e-notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const userBPassword = 'e2e-notif-password-123';

    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
    await page.locator('#name').fill('User B');
    await page.getByLabel('Email address').fill(userBEmail);
    await page.locator('#password').fill(userBPassword);
    await page.locator('#confirmPassword').fill(userBPassword);
    await expect(
      page.getByRole('button', { name: 'Create Account' })
    ).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/children/, { timeout: 15000 });

    await page.goto(`/invites/accept/${token!.trim()}`);
    await expect(
      page.getByRole('heading', { name: 'Access Granted! 🎉' })
    ).toBeVisible({ timeout: 25000 });

    // ── Step 4: User B navigates to shared child and logs a feeding ──
    await page.getByRole('button', { name: 'View My Children' }).click();
    await expect(page).toHaveURL(/\/children$/);

    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole('heading', { name: childName }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
      timeout: 10000,
    });

    await page.getByRole('button', { name: 'Add Feeding' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create$/);
    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Amount (oz)').fill('4');
    await page
      .getByRole('button', { name: /Add Feeding|Save Feeding/ })
      .click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/, {
      timeout: 15000,
    });

    // ── Step 5: Restore User A with saved auth token (faster than full storage state) ──
    const { token: savedToken } = JSON.parse(
      fs.readFileSync(tokenPath, 'utf-8')
    ) as { token: string };
    await page.evaluate(
      (t) => localStorage.setItem('auth_token', t),
      savedToken
    );

    // ── Step 6: User A (restored) opens bell and sees notification ──
    // Notification is created async by Celery; poll by opening the dropdown until it appears.
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible({ timeout: 10000 });

    const bell = page.getByRole('button', { name: 'Notifications' }).first();
    await expect(bell).toBeVisible();
    await expect
      .poll(
        async () => {
          await bell.click();
          const dialog = page.getByRole('dialog', { name: 'Notification list' });
          const dialogVisible = await dialog.isVisible().catch(() => false);
          if (!dialogVisible) return false;
          const hasNotification = await page
            .getByText(/logged a feeding/i)
            .first()
            .isVisible();
          if (!hasNotification) {
            await page.keyboard.press('Escape');
          }
          return hasNotification;
        },
        { timeout: 25000, intervals: [2000] }
      )
      .toBe(true);
  });

  test('child edit page shows notification preference toggles', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Notify');

    const url = page.url();
    const childId = url.match(/\/children\/(\d+)\//)?.[1];
    expect(childId).toBeTruthy();

    async function openAdvancedAndWaitForToggles() {
      await page.goto(`/children/${childId}/edit`);
      await expect(page.getByLabel("Baby's Name")).toBeVisible({ timeout: 10000 });
      await page.getByRole('button', { name: /Show advanced/ }).click();
      await expect(
        page.locator('#advanced-settings-panel')
      ).toBeVisible({ timeout: 5000 });
      const prefsGroup = page.getByRole('group', {
        name: /Notification Preferences/,
      });
      await expect(prefsGroup).toBeVisible({ timeout: 10000 });
      await expect(
        prefsGroup.getByText('Choose which activities trigger notifications')
      ).toBeVisible();
      await expect
        .poll(
          async () => {
            const loadingVisible = await prefsGroup
              .getByText('Loading notification preferences...')
              .isVisible()
              .catch(() => false);
            if (loadingVisible) return false;
            return await prefsGroup.getByText('Feedings').isVisible().catch(() => false);
          },
          { timeout: 45000, intervals: [1000] }
        )
        .toBe(true);
      return prefsGroup;
    }

    let prefsGroup: Awaited<ReturnType<typeof openAdvancedAndWaitForToggles>>;
    try {
      prefsGroup = await openAdvancedAndWaitForToggles();
    } catch {
      // Retry once: reload edit page (preferences API may return child on second load)
      prefsGroup = await openAdvancedAndWaitForToggles();
    }

    await expect(prefsGroup.getByText('Diaper changes')).toBeVisible();
    await expect(prefsGroup.getByText('Naps')).toBeVisible();
  });
});
