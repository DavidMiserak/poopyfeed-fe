import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import { createChildAndGoToDashboard } from './child-helpers';
import { createItemsForPagination } from './pagination-helpers';
import { editTrackingItemAndSeeUpdateOnList } from './tracking-helpers';

/**
 * E2E: Diaper change tracking flow (P0 core workflow).
 * Uses auth fixture; ensures one child then adds a diaper change and verifies it appears.
 * [Test] Happy path + error case (validation) per Test Master.
 */
test.describe('Diapers', () => {
  test('user can add a diaper change and see it on the diapers list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Diapers');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Diaper' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/create/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: /Add Diaper Change/ })
    ).toBeVisible();

    await page.locator('form label').filter({ hasText: 'Both' }).click();
    await page.getByLabel('Date & Time').fill('2024-06-15T16:30');
    await page.locator('form').getByRole('button', { name: 'Add Diaper Change' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/diapers$/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Diaper Change' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Add Diaper Change' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByText('Wet & Dirty').first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('diaper form shows validation when date and time is missing', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Diapers');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Diaper' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/create/, { timeout: E2E_TIMEOUT });
    await page.locator('form label').filter({ hasText: 'Wet' }).click();
    await page.getByLabel('Date & Time').fill('');
    await page.getByLabel('Date & Time').blur();

    await expect(page.getByText('Date and time is required')).toBeVisible();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/create/);
  });

  test('user can edit a diaper change and see update on the diapers list', async ({
    page,
  }) => {
    await editTrackingItemAndSeeUpdateOnList(page, {
      childNamePrefix: 'E2E Diapers',
      dashboardButton: 'Diaper',
      createUrlPattern: /\/children\/\d+\/diapers\/create/,
      listUrlPattern: /\/children\/\d+\/diapers$/,
      editUrlPattern: /\/children\/\d+\/diapers\/\d+\/edit/,
      createFormSubmitButton: 'Add Diaper Change',
      fillCreateForm: async (p) => {
        await p.locator('form label').filter({ hasText: 'Wet' }).click();
        await p.getByLabel('Date & Time').fill('2024-06-15T16:30');
      },
      initialRowText: 'Wet Diaper',
      editButtonLabel: 'Edit diaper change',
      editHeadingPattern: /Edit Diaper Change/,
      changeForm: async (p) => {
        // Wait for resource data to load before changing (prevents patchFormWithResource race)
        await expect(p.getByRole('radio', { name: 'Wet' })).toBeChecked({ timeout: E2E_TIMEOUT });
        await p.locator('form label').filter({ hasText: 'Dirty' }).click();
        await p.getByLabel('Date & Time').fill('2024-06-15T16:30');
      },
      updateButtonLabel: 'Update Diaper Change',
      listHeaderButton: 'Add Diaper Change',
      updatedRowText: 'Dirty Diaper',
      successToastAfterUpdate: 'Diaper change updated successfully',
    });
  });

  test('user can delete a diaper change and return to the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Diapers');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Diaper' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/create/, { timeout: E2E_TIMEOUT });
    await page.locator('form label').filter({ hasText: 'Both' }).click();
    await page.getByLabel('Date & Time').fill('2024-06-21T11:00');
    await page.locator('form').getByRole('button', { name: 'Add Diaper Change' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers$/, { timeout: E2E_TIMEOUT });
    // Wait for list to show the new row before clicking delete
    await expect(
      page.getByText('Wet & Dirty').first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Delete diaper change' }).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await page.getByRole('button', { name: 'Delete diaper change' }).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/\d+\/delete/);
    await expect(
      page.getByRole('heading', { name: 'Delete Diaper Change?' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Yes, Delete Forever' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/diapers$/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Diaper Change' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('diapers list shows pagination and user can go to next and previous page', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Diapers Pagination');
    const childId = await createItemsForPagination(page, 'diapers', (at) => ({
      change_type: 'wet',
      changed_at: at.toISOString(),
    }));

    await page.goto(`/children/${childId}/diapers/`);
    await expect(page).toHaveURL(new RegExp(`/children/${childId}/diapers/?$`), { timeout: E2E_TIMEOUT });

    await expect(
      page.getByRole('heading', { name: /Diaper Changes for/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Next page' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Previous page' })
    ).toBeDisabled();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Page 2 of 2')).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Previous page' })
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Next page' })
    ).toBeDisabled();

    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: E2E_TIMEOUT });
  });
});
