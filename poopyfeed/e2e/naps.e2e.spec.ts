import { test, expect } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';
import { createItemsForPagination } from './pagination-helpers';
import { editTrackingItemAndSeeUpdateOnList } from './tracking-helpers';

/**
 * E2E: Nap tracking flow (P0 core workflow).
 * Uses auth fixture; ensures one child then adds a nap and verifies it appears.
 * [Test] Happy path + error case (validation) per Test Master.
 */
test.describe('Naps', () => {
  test('user can add a nap and see it on the naps list', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Naps');
    await page.getByRole('button', { name: 'Add Nap' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/);
    await expect(
      page.getByRole('heading', { name: /Add Nap/ })
    ).toBeVisible();

    await page.getByLabel('Date & Time').fill('2024-06-15T13:00');
    await page.getByLabel('End Time (optional)').fill('2024-06-15T14:30');
    await page.getByRole('button', { name: 'Add Nap' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps$/);
    await expect(
      page.getByText('Nap Time').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('nap form shows validation when date and time is missing', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Naps');
    await page.getByRole('button', { name: 'Add Nap' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/);
    await page.getByLabel('Date & Time').fill('');
    await page.getByLabel('Date & Time').blur();

    await expect(page.getByText('Date and time is required')).toBeVisible();
    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/);
  });

  test('user can edit a nap and see update on the naps list', async ({
    page,
  }) => {
    await editTrackingItemAndSeeUpdateOnList(page, {
      childNamePrefix: 'E2E Naps',
      dashboardAddButton: 'Add Nap',
      createUrlPattern: /\/children\/\d+\/naps\/create/,
      listUrlPattern: /\/children\/\d+\/naps$/,
      editUrlPattern: /\/children\/\d+\/naps\/\d+\/edit/,
      createFormSubmitButton: 'Add Nap',
      fillCreateForm: async (p) => {
        await p.getByLabel('Date & Time').fill('2024-06-15T13:00');
        await p.getByLabel('End Time (optional)').fill('2024-06-15T14:30');
      },
      initialRowText: 'Nap Time',
      editButtonLabel: 'Edit nap',
      editHeadingPattern: /Edit Nap/,
      changeForm: async (p) => {
        await p.getByLabel('End Time (optional)').fill('2024-06-15T15:00');
      },
      updateButtonLabel: 'Update Nap',
      listHeaderButton: 'Add Nap',
      updatedRowText: 'Nap Time',
    });
  });

  test('user can delete a nap and return to the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Naps');
    await page.getByRole('button', { name: 'Add Nap' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/);
    await page.getByLabel('Date & Time').fill('2024-06-22T12:00');
    // Submit via the form's submit button so we don't hit the dashboard button
    await page.locator('form').getByRole('button', { name: 'Add Nap' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/naps$/, { timeout: 15000 });
    await expect(
      page.getByText('Nap Time').first()
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Delete nap' }).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/naps\/\d+\/delete/);
    await expect(
      page.getByRole('heading', { name: 'Delete Nap?' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Yes, Delete Forever' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/naps$/);
  });

  test('naps list shows pagination and user can go to next and previous page', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Naps Pagination');
    const childId = await createItemsForPagination(page, 'naps', (at) => ({
      napped_at: at.toISOString(),
    }));

    await page.goto(`/children/${childId}/naps/`);
    await expect(page).toHaveURL(new RegExp(`/children/${childId}/naps/?$`));

    await expect(
      page.getByRole('heading', { name: /Naps for/ })
    ).toBeVisible({ timeout: 15000 });

    // List and pagination load asynchronously; wait for pagination to appear
    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('button', { name: 'Next page' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Previous page' })
    ).toBeDisabled();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Previous page' })
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Next page' })
    ).toBeDisabled();

    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });
});
