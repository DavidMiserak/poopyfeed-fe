import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as crypto from 'node:crypto';

/**
 * Creates a child with a unique name and navigates to that child's dashboard.
 * Use this to avoid shared mutable state and "first child" flakiness across tests.
 *
 * Includes retry logic for transient backend errors (500s) that occur when many
 * parallel E2E workers hit the backend simultaneously. Two failure modes handled:
 * 1. Child creation API returns 500 → stays on create page → retry creation
 * 2. Dashboard loads but data fetch fails → shows error page → reload
 *
 * @param page - Playwright page
 * @param baseName - Prefix for the child name (e.g. 'E2E Feedings')
 * @returns The full child name used (e.g. 'E2E Feedings a1b2c3d4')
 */
export async function createChildAndGoToDashboard(
  page: Page,
  baseName: string
): Promise<string> {
  const childName = `${baseName} ${crypto.randomUUID().slice(0, 8)}`;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await page.goto('/children');
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();

    if (
      await page.getByRole('heading', { name: 'No children yet!' }).isVisible()
    ) {
      await page.getByRole('link', { name: 'Add Your First Baby' }).click();
    } else {
      await page.getByRole('link', { name: 'Add Baby' }).first().click();
    }
    await expect(page).toHaveURL(/\/children\/create/);

    await page.getByLabel("Baby's Name").fill(childName);
    await page.getByLabel('Date of Birth').fill('2024-06-01');
    await page.getByRole('radio', { name: /Female/ }).click({ force: true });
    await page.getByRole('button', { name: 'Add Baby' }).click();

    // Wait for navigation to dashboard (child creation may fail with 500)
    const navigated = await page
      .waitForURL(/\/children\/\d+\/dashboard/, { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!navigated) {
      // Child creation failed — retry unless last attempt
      if (attempt < MAX_ATTEMPTS) continue;
      // Final attempt: fail with a clear assertion
      await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
        timeout: 5_000,
      });
    }

    // Dashboard URL reached — wait for main content (dashboard may show skeleton first, then
    // DashboardSectionCardComponent sections with Add Feeding / Add Diaper / Add Nap)
    const feedingButton = page.getByRole('button', { name: 'Add Feeding' });

    const contentLoaded = await feedingButton
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (contentLoaded) return childName;

    // Dashboard showed an error — try reloading
    await page.reload();
    const reloadWorked = await feedingButton
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (reloadWorked) return childName;

    // Reload didn't help — retry from scratch unless last attempt
    if (attempt < MAX_ATTEMPTS) continue;

    // Final attempt: fail with a clear assertion
    await expect(feedingButton).toBeVisible({ timeout: 5_000 });
  }

  return childName;
}
