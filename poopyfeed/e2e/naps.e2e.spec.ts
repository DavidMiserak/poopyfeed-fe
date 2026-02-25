import { test, expect } from '@playwright/test';

/**
 * E2E: Nap tracking flow (P0 core workflow).
 * Uses auth fixture; ensures one child then adds a nap and verifies it appears.
 * [Test] Happy path + error case (validation) per Test Master.
 */
test.describe('Naps', () => {
  const TRACK_CHILD_NAME = 'E2E Track Baby';

  test('user can add a nap and see it on the naps list', async ({ page }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (await page.getByRole('heading', { name: 'No children yet!' }).isVisible()) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
    } else {
      await page.getByRole('link', { name: 'Add Baby' }).first().click();
    }
    await expect(page).toHaveURL(/\/children\/create/);

    await page.getByLabel("Baby's Name").fill(TRACK_CHILD_NAME);
    await page.getByLabel('Date of Birth').fill('2024-06-01');
    await page.getByRole('radio', { name: 'Female' }).click({ force: true });
    await page.getByRole('button', { name: 'Add Baby' }).click();

    await expect(page).toHaveURL(/\/children$/);
    await page.getByRole('heading', { name: TRACK_CHILD_NAME }).first().click();

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/);
    await page.getByRole('button', { name: 'Add Nap' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/);
    await expect(
      page.getByRole('heading', { name: /Add Nap/ })
    ).toBeVisible();

    await page.getByLabel('Date & Time').fill('2024-06-15T13:00');
    await page.getByLabel('End Time (optional)').fill('2024-06-15T14:30');
    await page.getByRole('button', { name: 'Add Nap' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps$/);
    await expect(
      page.getByText('Nap Time').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('nap form shows validation when date and time is missing', async ({
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
    await page.getByRole('button', { name: 'Add Nap' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/);
    await page.getByLabel('Date & Time').fill('');
    await page.getByLabel('Date & Time').blur();

    await expect(page.getByText('Date and time is required')).toBeVisible();
    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/);
  });
});
