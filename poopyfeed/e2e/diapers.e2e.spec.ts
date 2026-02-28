import { test, expect } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';
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
    await page.getByRole('button', { name: 'Add Diaper' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/create/);
    await expect(
      page.getByRole('heading', { name: /Add Diaper Change/ })
    ).toBeVisible();

    await page.getByRole('radio', { name: 'Both' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-15T16:30');
    await page.locator('form').getByRole('button', { name: 'Add Diaper Change' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/diapers$/, { timeout: 15000 });
    await expect(
      page.getByRole('button', { name: 'Add Diaper Change' })
    ).toBeVisible({ timeout: 15000 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('button', { name: 'Add Diaper Change' })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Wet & Dirty').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('diaper form shows validation when date and time is missing', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Diapers');
    await page.getByRole('button', { name: 'Add Diaper' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/create/);
    await page.getByRole('radio', { name: 'Wet' }).click({ force: true });
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
      dashboardAddButton: 'Add Diaper',
      createUrlPattern: /\/children\/\d+\/diapers\/create/,
      listUrlPattern: /\/children\/\d+\/diapers$/,
      editUrlPattern: /\/children\/\d+\/diapers\/\d+\/edit/,
      createFormSubmitButton: 'Add Diaper Change',
      fillCreateForm: async (p) => {
        await p.getByRole('radio', { name: 'Wet' }).click({ force: true });
        await p.getByLabel('Date & Time').fill('2024-06-15T16:30');
      },
      initialRowText: 'Wet Diaper',
      editButtonLabel: 'Edit diaper change',
      editHeadingPattern: /Edit Diaper Change/,
      changeForm: async (p) => {
        await p.getByRole('radio', { name: 'Dirty' }).click({ force: true });
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
    await page.getByRole('button', { name: 'Add Diaper' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/create/);
    await page.getByRole('radio', { name: 'Both' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-21T11:00');
    await page.locator('form').getByRole('button', { name: 'Add Diaper Change' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers$/, { timeout: 15000 });
    await expect(
      page.getByText('Wet & Dirty').first()
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Delete diaper change' }).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/diapers\/\d+\/delete/);
    await expect(
      page.getByRole('heading', { name: 'Delete Diaper Change?' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Yes, Delete Forever' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/diapers$/, { timeout: 15000 });
  });
});
