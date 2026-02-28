import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as crypto from 'node:crypto';

/**
 * Creates a child with a unique name and navigates to that child's dashboard.
 * Use this to avoid shared mutable state and "first child" flakiness across tests.
 * @param page - Playwright page
 * @param baseName - Prefix for the child name (e.g. 'E2E Feedings')
 * @returns The full child name used (e.g. 'E2E Feedings a1b2c3d4')
 */
export async function createChildAndGoToDashboard(
  page: Page,
  baseName: string
): Promise<string> {
  const childName = `${baseName} ${crypto.randomUUID().slice(0, 8)}`;
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

  // App navigates to new child's dashboard on create success (no list race)
  await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, { timeout: 15000 });
  await expect(
    page.getByRole('button', { name: 'Add Feeding' })
  ).toBeVisible({ timeout: 25000 });
  return childName;
}
