import { test, expect } from '@playwright/test';

/**
 * E2E: Feeding tracking flow (P0 core workflow).
 * Uses auth fixture; ensures one child then adds a bottle feeding and verifies it appears.
 * [Test] Happy path + error case (validation) per Test Master.
 */
test.describe('Feedings', () => {
  const TRACK_CHILD_NAME = 'E2E Track Baby';

  test('user can add a bottle feeding and see it on the feedings list', async ({
    page,
  }) => {
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
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/);
    await expect(
      page.getByRole('heading', { name: /Add Feeding/ })
    ).toBeVisible();

    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-15T14:00');
    await page.getByLabel('Amount (oz)').fill('4');
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/);
    await expect(
      page.getByText(/Bottle:.*4.*oz/).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('bottle feeding form shows validation when amount is missing', async ({
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
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/);
    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-15T14:00');
    await page.getByLabel('Amount (oz)').focus();
    await page.getByLabel('Amount (oz)').blur();

    await expect(page.getByText('Amount is required')).toBeVisible();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/);
  });
});
