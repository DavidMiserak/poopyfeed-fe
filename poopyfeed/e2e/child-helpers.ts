import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as crypto from 'node:crypto';
import { E2E_TIMEOUT } from './constants';

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
      .waitForURL(/\/children\/\d+\/dashboard/, { timeout: E2E_TIMEOUT })
      .then(() => true)
      .catch(() => false);

    if (!navigated) {
      // Child creation failed — retry unless last attempt
      if (attempt < MAX_ATTEMPTS) continue;
      // Final attempt: fail with a clear assertion
      await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, {
        timeout: E2E_TIMEOUT,
      });
    }

    // Dashboard URL reached — wait for "Log with details" section (Feeding, Diaper, Nap buttons)
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    const feedingButton = logWithDetails.getByRole('button', { name: 'Feeding' });
    const contentLoaded = await feedingButton
      .waitFor({ state: 'visible', timeout: E2E_TIMEOUT })
      .then(() => true)
      .catch(() => false);
    if (!contentLoaded) {
      await page.reload();
      const reloadWorked = await feedingButton
        .waitFor({ state: 'visible', timeout: E2E_TIMEOUT })
        .then(() => true)
        .catch(() => false);
      if (!reloadWorked) {
        if (attempt < MAX_ATTEMPTS) continue;
        await expect(feedingButton).toBeVisible({ timeout: E2E_TIMEOUT });
      }
    }

    // Ensure Quick Log section is rendered (avoids flakiness in quick-log, pattern-alerts, etc.)
    const quickLogReady = await page
      .getByRole('heading', { name: 'Quick Log', level: 2 })
      .waitFor({ state: 'visible', timeout: E2E_TIMEOUT })
      .then(() => true)
      .catch(() => false);

    if (quickLogReady) return childName;

    // Quick Log never appeared — return anyway so tests can proceed (they may have their own waits)
    return childName;
  }

  return childName;
}
