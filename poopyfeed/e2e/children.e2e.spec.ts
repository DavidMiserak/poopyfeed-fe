import { test, expect } from '@playwright/test';

/**
 * E2E: Children flow (add child, list, validation) against Angular + Django.
 * Uses auth fixture (storageState from auth.setup.ts); runs in *-authenticated projects.
 */
test.describe('Children', () => {
  test('add child form shows validation when required name is empty', async ({
    page,
  }) => {
    await page.goto('/children/create');
    await expect(
      page.getByRole('heading', { name: 'Add New Baby' })
    ).toBeVisible();

    await page.getByLabel("Baby's Name").focus();
    await page.getByRole('heading', { name: 'Add New Baby' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page).toHaveURL(/\/children\/create/);
  });

  test('signed-in user can add a child and see them on My Children', async ({
    page,
  }) => {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    await page.getByRole('link', { name: 'Add Baby' }).first().click();
    await expect(page).toHaveURL(/\/children\/create/);
    await expect(
      page.getByRole('heading', { name: 'Add New Baby' })
    ).toBeVisible();

    await page.getByLabel("Baby's Name").fill('E2E Baby');
    await page.getByLabel('Date of Birth').fill('2024-06-01');
    await page.getByRole('radio', { name: 'Female' }).click({ force: true });
    await page.getByRole('button', { name: 'Add Baby' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
      timeout: 15000,
    });
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: 'E2E Baby' }).first()
    ).toBeVisible({ timeout: 15000 });
  });
});
