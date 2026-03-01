import { test, expect } from './fixtures';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Quick Log flow (dashboard one-tap logging for diaper, nap, bottle).
 * Uses auth fixture; ensures one child then uses Quick Log buttons and verifies success toasts.
 * Quick Log section is rendered by DashboardSectionCardComponent (title "Quick Log").
 * Covers VERIFICATION.md E2E gap: Quick-Log buttons (Mom, Maria primary daily UI).
 */
test.describe('Quick Log', () => {
  test('dashboard shows Quick Log section with Diaper, Nap, and Bottle', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Quick Log');

    await expect(
      page.getByRole('heading', { name: 'Quick Log', level: 2 })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Diaper', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Nap', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Bottle', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByRole('button', { name: 'Log a wet diaper change with current timestamp' })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: 'Log a nap with current timestamp' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('quick log Wet diaper shows success toast', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Quick Log');

    const wetButton = page.getByRole('button', {
      name: 'Log a wet diaper change with current timestamp',
    });
    await expect(wetButton).toBeVisible({ timeout: 15_000 });
    await expect(wetButton).toBeEnabled({ timeout: 5_000 });
    await wetButton.click();

    await expect(
      page.getByText('Wet diaper recorded successfully')
    ).toBeVisible({ timeout: 20_000 });
  });

  test('quick log Nap shows success toast', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Quick Log');

    const napButton = page.getByRole('button', {
      name: 'Log a nap with current timestamp',
    });
    await expect(napButton).toBeVisible({ timeout: 20_000 });
    await expect(napButton).toBeEnabled({ timeout: 10_000 });
    await napButton.click();

    await expect(
      page.getByText('Nap recorded successfully')
    ).toBeVisible({ timeout: 30_000 });
  });

  test('quick log Bottle shows success toast when amount available', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Quick Log');

    const bottleButton = page.getByRole('button', {
      name: /Log a bottle feeding with \d+ oz/,
    }).first();
    await expect(bottleButton).toBeVisible({ timeout: 15_000 });

    const isDisabled = await bottleButton.isDisabled();
    test.skip(isDisabled, 'Bottle amount not available for this child');

    await bottleButton.click();

    await expect(
      page.getByText(/Bottle feeding recorded: \d+ oz/)
    ).toBeVisible({ timeout: 20_000 });
  });
});
