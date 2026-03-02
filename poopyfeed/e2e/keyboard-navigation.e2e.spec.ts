import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Keyboard navigation on child list cards (WCAG 2.1 AA).
 * Child cards have role="button", tabindex="0", and respond to Enter and Space.
 * Covers VERIFICATION.md E2E gap: Keyboard navigation (child list cards).
 */
test.describe('Keyboard navigation (child list cards)', () => {
  test('Tab focuses a child card and Enter navigates to dashboard', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Keyboard Enter');
    await page.goto('/children');

    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    const firstCard = page.getByRole('button').first();
    await expect(firstCard).toBeVisible({ timeout: E2E_TIMEOUT });

    await firstCard.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
      timeout: E2E_TIMEOUT,
    });
  });

  test('Tab focuses a child card and Space navigates to dashboard', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Keyboard Space');
    await page.goto('/children');

    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    const firstCard = page.getByRole('button').first();
    await expect(firstCard).toBeVisible({ timeout: E2E_TIMEOUT });

    await firstCard.focus();
    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
      timeout: E2E_TIMEOUT,
    });
  });
});
