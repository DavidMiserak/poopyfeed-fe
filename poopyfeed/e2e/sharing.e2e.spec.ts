import { test, expect } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Sharing / invite flow (owner only).
 * Uses auth fixture; ensures one child (owner) then opens sharing and creates an invite link.
 * [Test] Happy path: open sharing page, create invite, see it in list. Per Test Master.
 */

/**
 * Navigate from child dashboard to the sharing page and wait for it to load.
 * Handles transient backend failures (blank page on 500) by retrying with a reload.
 */
async function navigateToSharingPage(page: import('@playwright/test').Page) {
  const moreTools = page.getByRole('button', {
    name: 'View advanced options for this child',
  });
  await expect(moreTools).toBeVisible({ timeout: 15000 });
  await moreTools.click();
  await expect(page).toHaveURL(/\/children\/\d+\/advanced$/, { timeout: 10000 });
  await expect(
    page.getByRole('link', { name: 'Manage Sharing' })
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole('link', { name: 'Manage Sharing' }).click();

  await expect(page).toHaveURL(/\/children\/\d+\/sharing$/, { timeout: 15000 });

  // Wait for loading to finish first, then check for the heading.
  // On transient 500s the page can go blank (error with empty message);
  // detect that and reload once.
  await expect(
    page.getByText('Loading sharing settings...')
  ).toBeHidden({ timeout: 20000 });

  const heading = page.getByRole('heading', { name: /Sharing Settings for/ });
  const headingVisible = await heading
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (!headingVisible) {
    // Blank page (transient backend error) — reload and retry
    await page.reload();
    await expect(
      page.getByText('Loading sharing settings...')
    ).toBeHidden({ timeout: 20000 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  }
}

test.describe('Sharing', () => {
  test('owner can open sharing page and see settings', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');
    await navigateToSharingPage(page);

    await expect(
      page.getByRole('heading', { name: /Invite Links/ })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: 'Create Invite Link' })
    ).toBeVisible({ timeout: 10000 });

    // Verify back arrow text and navigation
    await page.getByRole('button', { name: 'Back to advanced tools' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);
  });

  test('owner can create a co-parent invite link and see it in the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');
    await navigateToSharingPage(page);

    await expect(
      page.getByRole('button', { name: 'Create Invite Link' })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Create Invite Link' }).click();
    // New invite is prepended; wait for it and assert within first invite item
    // (avoids matching "Co-parent" in the role dropdown)
    const firstInvite = page.getByTestId('invite-item').first();
    await expect(firstInvite).toBeVisible({ timeout: 15000 });
    await expect(firstInvite.getByText('Co-parent')).toBeVisible();
    await expect(firstInvite.getByText('Active')).toBeVisible();
  });

  test('owner can create a caregiver invite link and see it in the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');
    await navigateToSharingPage(page);

    await expect(
      page.getByRole('combobox').first()
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole('combobox').first().selectOption('caregiver');
    await page.getByRole('button', { name: 'Create Invite Link' }).click();

    await expect(page.getByText('Caregiver').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Active').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
