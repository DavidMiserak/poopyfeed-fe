import { test, expect } from '@playwright/test';

/**
 * E2E: Children flow (add child, list, validation) against Angular + Django.
 * Uses a fresh signup so the test is self-contained and does not depend on seed data.
 */
test.describe('Children', () => {
  const uniqueEmail = () =>
    `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
  const password = 'e2e-test-password-123';

  test('add child form shows validation when required name is empty', async ({
    page,
  }) => {
    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible();
    await page.getByLabel('Full name').fill('E2E Parent');
    await page.getByLabel('Email address').fill(uniqueEmail());
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/children/);

    await page.getByRole('link', { name: 'Add Your First Baby' }).click();
    await expect(page).toHaveURL(/\/children\/create/);

    await page.getByLabel("Baby's Name").focus();
    await page.getByRole('heading', { name: 'Add New Baby' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page).toHaveURL(/\/children\/create/);
  });

  test('signed-in user can add a child and see them on My Children', async ({
    page,
  }) => {
    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible();
    await page.getByLabel('Full name').fill('E2E Parent');
    await page.getByLabel('Email address').fill(uniqueEmail());
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/children/);
    await expect(
      page.getByRole('heading', { name: 'No children yet!' })
    ).toBeVisible();

    await page.getByRole('link', { name: 'Add Your First Baby' }).click();
    await expect(page).toHaveURL(/\/children\/create/);
    await expect(
      page.getByRole('heading', { name: 'Add New Baby' })
    ).toBeVisible();

    await page.getByLabel("Baby's Name").fill('E2E Baby');
    await page.getByLabel('Date of Birth').fill('2024-06-01');
    await page.getByRole('radio', { name: 'Female' }).click({ force: true });
    await page.getByRole('button', { name: 'Add Baby' }).click();

    await expect(page).toHaveURL(/\/children$/);
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();
    await expect(page.getByText('E2E Baby')).toBeVisible();
  });
});
