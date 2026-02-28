import { test, expect } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Sharing / invite flow (owner only).
 * Uses auth fixture; ensures one child (owner) then opens sharing and creates an invite link.
 * [Test] Happy path: open sharing page, create invite, see it in list. Per Test Master.
 */
test.describe('Sharing', () => {
  test('owner can open sharing page and see settings', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');

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
    await expect(
      page.getByRole('heading', { name: /Sharing Settings for/ })
    ).toBeVisible({ timeout: 15000 });
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
    await expect(
      page.getByRole('heading', { name: /Sharing Settings for/ })
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByRole('button', { name: 'Create Invite Link' })
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Create Invite Link' }).click();
    await expect(page.getByTestId('invite-item').first()).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText('Co-parent').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Active').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('owner can create a caregiver invite link and see it in the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Sharing');

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
    await expect(
      page.getByRole('heading', { name: /Sharing Settings for/ })
    ).toBeVisible({ timeout: 15000 });

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
