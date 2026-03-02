import { test, expect } from './fixtures';
import { createChildAndGoToDashboard } from './child-helpers';
import { E2E_TIMEOUT } from './constants';

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
  const moreTools = page.getByText('More tools', { exact: true });
  await expect(moreTools).toBeVisible({ timeout: E2E_TIMEOUT });
  await moreTools.scrollIntoViewIfNeeded();
  await moreTools.click();
  await expect(page).toHaveURL(/\/children\/\d+\/advanced$/, { timeout: E2E_TIMEOUT });
  await expect(
    page.getByRole('link', { name: 'Manage Sharing' })
  ).toBeVisible({ timeout: E2E_TIMEOUT });
  await page.getByRole('link', { name: 'Manage Sharing' }).click();

  await expect(page).toHaveURL(/\/children\/\d+\/sharing$/, { timeout: E2E_TIMEOUT });
  await expect(
    page.getByText('Loading sharing settings...')
  ).toBeHidden({ timeout: E2E_TIMEOUT });

  const heading = page.getByRole('heading', { name: /Sharing Settings for/ });
  const headingVisible = await heading
    .waitFor({ state: 'visible', timeout: E2E_TIMEOUT })
    .then(() => true)
    .catch(() => false);

  if (!headingVisible) {
    await page.reload({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByText('Loading sharing settings...')
    ).toBeHidden({ timeout: E2E_TIMEOUT });
    await expect(heading).toBeVisible({ timeout: E2E_TIMEOUT });
  }
}

test.describe('Sharing', () => {
  test('owner can open sharing page and see settings', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');
    await navigateToSharingPage(page);

    await expect(
      page.getByRole('heading', { name: /Invite Links/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Create Invite Link' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // Verify back arrow text and navigation
    await page.getByRole('button', { name: 'Back to Advanced' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);
  });

  test('owner can create a co-parent invite link and see it in the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');
    await navigateToSharingPage(page);

    await expect(
      page.getByRole('heading', { name: /Invite Links/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Create Invite Link' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await page.getByRole('button', { name: 'Create Invite Link' }).click();
    const coParentInvite = page
      .getByTestId('invite-item')
      .filter({ hasText: 'Co-parent' })
      .first();
    await expect
      .poll(
        async () => await coParentInvite.isVisible(),
        { timeout: E2E_TIMEOUT, intervals: [800] }
      )
      .toBe(true);
    await expect(coParentInvite.getByText('Active')).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('owner can create a caregiver invite link and see it in the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');
    await navigateToSharingPage(page);

    await expect(
      page.getByRole('combobox').first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await page.getByRole('combobox').first().selectOption('caregiver');
    await page.getByRole('button', { name: 'Create Invite Link' }).click();

    const caregiverInvite = page
      .getByTestId('invite-item')
      .filter({ hasText: 'Caregiver' })
      .first();
    await expect
      .poll(
        async () => await caregiverInvite.isVisible(),
        { timeout: E2E_TIMEOUT, intervals: [800] }
      )
      .toBe(true);
    await expect(caregiverInvite.getByText('Active')).toBeVisible({ timeout: E2E_TIMEOUT });
  });
});
