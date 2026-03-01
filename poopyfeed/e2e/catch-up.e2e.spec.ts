import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';

/**
 * E2E: Catch-Up Mode wizard flow (bulk logging for Maria / nanny persona).
 * Uses auth fixture; creates a dedicated child then navigates:
 * Dashboard → Advanced → Catch-Up → wizard steps.
 *
 * Covers VERIFICATION.md E2E gap: Catch-Up mode (zero tests).
 */

/** Navigate from dashboard to catch-up page. */
async function goToCatchUp(page: Page): Promise<void> {
  await expect(page.getByText('More tools', { exact: true })).toBeVisible();
  await page.getByText('More tools', { exact: true }).click();
  await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);

  await page.getByRole('link', { name: /Catch.Up Mode/ }).click();
  await expect(page).toHaveURL(/\/children\/\d+\/catch-up$/);
}

test.describe('Catch-Up Mode', () => {
  test('can navigate to catch-up from advanced page', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E CatchUp');
    await goToCatchUp(page);

    await expect(
      page.getByRole('heading', { name: 'Step 1: Choose Time Window' })
    ).toBeVisible();
  });

  test('step 1: select time window and continue', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E CatchUp');
    await goToCatchUp(page);

    await expect(
      page.getByRole('heading', { name: 'Step 1: Choose Time Window' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Last 4 hours' }).click();
    await page.getByRole('button', { name: 'Continue to Activities' }).click();

    await expect(
      page.getByRole('heading', { name: 'Step 2: Add Activities' })
    ).toBeVisible();
  });

  test('full happy path: add events, review, submit', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E CatchUp');
    await goToCatchUp(page);

    // Step 1: select time window
    await page.getByRole('button', { name: 'Last 4 hours' }).click();
    await page.getByRole('button', { name: 'Continue to Activities' }).click();
    await expect(
      page.getByRole('heading', { name: 'Step 2: Add Activities' })
    ).toBeVisible({ timeout: 15_000 });

    // Step 2: add a diaper and a nap (these have simple defaults that pass validation)
    await page.getByRole('button', { name: 'Add diaper event' }).click();
    await page.getByRole('button', { name: 'Add nap event' }).click();

    // Click review (button text includes event count)
    await page.getByRole('button', { name: /Review \d+ Activit/ }).click();

    // Step 3: review
    await expect(
      page.getByRole('heading', { name: 'Step 3: Review & Save' })
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Confirm & Save' }).click();

    await expect(page.getByText('Saving...')).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/2 Activities Saved!/)
    ).toBeVisible({ timeout: 25_000 });

    // Navigate back to advanced
    await page.getByRole('button', { name: 'Back to advanced tools' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);
  });

  test('step 2: can remove an event', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E CatchUp');
    await goToCatchUp(page);

    // Step 1
    await page.getByRole('button', { name: 'Last 4 hours' }).click();
    await page.getByRole('button', { name: 'Continue to Activities' }).click();
    await expect(
      page.getByRole('heading', { name: 'Step 2: Add Activities' })
    ).toBeVisible();

    // Add 2 events
    await page.getByRole('button', { name: 'Add diaper event' }).click();
    await page.getByRole('button', { name: 'Add nap event' }).click();

    // Verify review button shows 2
    await expect(
      page.getByRole('button', { name: /Review 2 Activit/ })
    ).toBeVisible();

    // Click the first new event to open the editor
    // New event cards have aria-label like "diaper event at ..."
    await page.getByRole('button', { name: /diaper event at/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Edit Activity' })
    ).toBeVisible();

    // Click remove; styled confirm dialog appears — confirm with Delete
    await page.getByRole('button', { name: /Delete diaper event/ }).click();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Delete' })
    ).toBeVisible({ timeout: 5_000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();

    // Verify only 1 event remains
    await expect(
      page.getByRole('button', { name: /Review 1 Activit/ })
    ).toBeVisible();
  });

  test('step 2: back returns to step 1', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E CatchUp');
    await goToCatchUp(page);

    // Complete step 1
    await page.getByRole('button', { name: 'Last 4 hours' }).click();
    await page.getByRole('button', { name: 'Continue to Activities' }).click();
    await expect(
      page.getByRole('heading', { name: 'Step 2: Add Activities' })
    ).toBeVisible();

    // Click back
    await page.getByRole('button', { name: 'Back' }).click();

    await expect(
      page.getByRole('heading', { name: 'Step 1: Choose Time Window' })
    ).toBeVisible();
  });

  test('step 1: cancel returns to advanced page', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E CatchUp');
    await goToCatchUp(page);

    await expect(
      page.getByRole('heading', { name: 'Step 1: Choose Time Window' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/advanced$/);
  });
});
