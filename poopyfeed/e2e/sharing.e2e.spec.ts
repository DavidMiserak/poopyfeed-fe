import { test, expect } from '@playwright/test';

/**
 * E2E: Sharing / invite flow (owner only).
 * Uses auth fixture; ensures one child (owner) then opens sharing and creates an invite link.
 * [Test] Happy path: open sharing page, create invite, see it in list. Per Test Master.
 */
test.describe('Sharing', () => {
  const TRACK_CHILD_NAME = 'E2E Track Baby';

  test('owner can open sharing page and see settings', async ({ page }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (await page.getByRole('heading', { name: 'No children yet!' }).isVisible()) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
      await page.getByLabel("Baby's Name").fill(TRACK_CHILD_NAME);
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
    await expect(
      page.getByRole('heading', { name: /Sharing Settings for/ })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Invite Links/ })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Invite Link' })).toBeVisible();
  });

  test('owner can create a co-parent invite link and see it in the list', async ({
    page,
  }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (await page.getByRole('heading', { name: 'No children yet!' }).isVisible()) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
      await page.getByLabel("Baby's Name").fill(TRACK_CHILD_NAME);
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
    await expect(
      page.getByRole('heading', { name: /Sharing Settings for/ })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Create Invite Link' }).click();

    await expect(page.getByText('Co-parent').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Active').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('owner can create a caregiver invite link and see it in the list', async ({
    page,
  }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (await page.getByRole('heading', { name: 'No children yet!' }).isVisible()) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
      await page.getByLabel("Baby's Name").fill(TRACK_CHILD_NAME);
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

    await page.getByRole('combobox').selectOption('caregiver');
    await page.getByRole('button', { name: 'Create Invite Link' }).click();

    await expect(page.getByText('Caregiver').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Active').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
