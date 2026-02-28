import { test, expect } from '@playwright/test';

/**
 * E2E: Quick Log flow (dashboard one-tap logging for diaper, nap, bottle).
 * Uses auth fixture; ensures one child then uses Quick Log buttons and verifies success toasts.
 * Covers VERIFICATION.md E2E gap: Quick-Log buttons (Mom, Maria primary daily UI).
 */
test.describe('Quick Log', () => {
  const TRACK_CHILD_NAME = 'E2E Quick Log Baby';

  async function ensureOnChildDashboard(page: import('@playwright/test').Page) {
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
  }

  test('dashboard shows Quick Log section with Diaper, Nap, and Bottle', async ({
    page,
  }) => {
    await ensureOnChildDashboard(page);

    await expect(
      page.getByRole('heading', { name: 'Quick Log', level: 2 })
    ).toBeVisible();
    await expect(page.getByText('Diaper', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Nap', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Bottle', { exact: true }).first()).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Log a wet diaper change with current timestamp' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Log a nap with current timestamp' })
    ).toBeVisible();
  });

  test('quick log Wet diaper shows success toast', async ({ page }) => {
    await ensureOnChildDashboard(page);

    await page
      .getByRole('button', { name: 'Log a wet diaper change with current timestamp' })
      .click();

    await expect(
      page.getByText('Wet diaper recorded successfully')
    ).toBeVisible({ timeout: 15_000 });
  });

  test('quick log Nap shows success toast', async ({ page }) => {
    await ensureOnChildDashboard(page);

    await page
      .getByRole('button', { name: 'Log a nap with current timestamp' })
      .click();

    await expect(
      page.getByText('Nap recorded successfully')
    ).toBeVisible({ timeout: 15_000 });
  });

  test('quick log Bottle shows success toast when amount available', async ({
    page,
  }) => {
    await ensureOnChildDashboard(page);

    const bottleButton = page.getByRole('button', {
      name: /Log a bottle feeding with \d+ oz/,
    }).first();
    await expect(bottleButton).toBeVisible({ timeout: 5_000 });

    const isDisabled = await bottleButton.isDisabled();
    test.skip(isDisabled, 'Bottle amount not available for this child');

    await bottleButton.click();

    await expect(
      page.getByText(/Bottle feeding recorded: \d+ oz/)
    ).toBeVisible({ timeout: 15_000 });
  });
});
