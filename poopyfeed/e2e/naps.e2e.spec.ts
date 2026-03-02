import { test, expect } from './fixtures';
import { createChildAndGoToDashboard } from './child-helpers';
import { createItemsForPagination } from './pagination-helpers';
import { editTrackingItemAndSeeUpdateOnList, waitForTrackingList200 } from './tracking-helpers';
import { E2E_TIMEOUT } from './constants';

/**
 * E2E: Nap tracking flow (P0 core workflow).
 * Uses auth fixture; ensures one child then adds a nap and verifies it appears.
 * [Test] Happy path + error case (validation) per Test Master.
 */
test.describe('Naps', () => {
  test('user can add a nap and see it on the naps list', async ({ page }) => {
    await createChildAndGoToDashboard(page, 'E2E Naps');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Nap' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: /Add Nap/ })
    ).toBeVisible();

    await page.getByLabel('Date & Time').fill('2024-06-15T13:00');
    await page.getByLabel('End Time (optional)').fill('2024-06-15T14:30');
    const list200Promise = waitForTrackingList200(page, 'naps');
    await page.getByRole('button', { name: 'Add Nap' }).click();
    await list200Promise;

    await expect(page).toHaveURL(/\/children\/\d+\/naps$/, { timeout: E2E_TIMEOUT });
    await expect(page.getByText('Loading naps...')).toBeHidden({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Nap' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByText('Nap Time').first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('nap form shows validation when date and time is missing', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Naps');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Nap' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/, { timeout: E2E_TIMEOUT });
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
      dashboardButton: 'Nap',
      createUrlPattern: /\/children\/\d+\/naps\/create/,
      listUrlPattern: /\/children\/\d+\/naps$/,
      listApiSegment: 'naps',
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
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Nap' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/naps\/create/, { timeout: E2E_TIMEOUT });
    await page.getByLabel('Date & Time').fill('2024-06-22T12:00');
    const list200AfterAdd = waitForTrackingList200(page, 'naps');
    await page.locator('form').getByRole('button', { name: 'Add Nap' }).click();
    await list200AfterAdd;
    await expect(page).toHaveURL(/\/children\/\d+\/naps$/, { timeout: E2E_TIMEOUT });
    await expect(page.getByText('Loading naps...')).toBeHidden({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByText('Nap Time').first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await page.getByRole('button', { name: 'Delete nap' }).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/naps\/\d+\/delete/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: 'Delete Nap?' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    const list200AfterDelete = waitForTrackingList200(page, 'naps');
    await page.getByRole('button', { name: 'Yes, Delete Forever' }).click();
    await list200AfterDelete;

    await expect(page).toHaveURL(/\/children\/\d+\/naps$/, { timeout: E2E_TIMEOUT });
    await expect(page.getByText('Loading naps...')).toBeHidden({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Nap' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('naps list shows pagination and user can go to next and previous page', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Naps Pagination');
    const childId = await createItemsForPagination(page, 'naps', (at) => ({
      napped_at: at.toISOString(),
    }));

    await page.goto(`/children/${childId}/naps/`);
    await expect(page).toHaveURL(new RegExp(`/children/${childId}/naps/?$`), { timeout: E2E_TIMEOUT });

    await expect(
      page.getByRole('heading', { name: /Naps for/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(page.getByText('Loading naps...')).toBeHidden({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Nap' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: E2E_TIMEOUT });
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
