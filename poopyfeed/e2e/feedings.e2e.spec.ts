import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';
import { createChildAndGoToDashboard } from './child-helpers';
import { createItemsForPagination } from './pagination-helpers';
import { editTrackingItemAndSeeUpdateOnList, waitForTrackingList200 } from './tracking-helpers';

/**
 * E2E: Feeding tracking flow (P0 core workflow).
 * Uses auth fixture; ensures one child then adds a bottle feeding and verifies it appears.
 * [Test] Happy path + error case (validation) per Test Master.
 */
test.describe('Feedings', () => {
  test('user can add a bottle feeding and see it on the feedings list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Feedings');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Go to feedings list' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: /Add Feeding/ })
    ).toBeVisible();

    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-15T14:00');
    await page.getByLabel('Amount (oz)').fill('4');
    const list200Promise = waitForTrackingList200(page, 'feedings');
    await page.getByRole('button', { name: 'Add Feeding' }).click();
    await list200Promise;

    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/);
    await expect(
      page.getByText(/Bottle:.*4.*oz/).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('bottle feeding form shows validation when amount is missing', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Feedings');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Go to feedings list' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/, { timeout: E2E_TIMEOUT });
    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-15T14:00');
    await page.getByLabel('Amount (oz)').focus();
    await page.getByLabel('Amount (oz)').blur();

    await expect(page.getByText('Amount is required')).toBeVisible();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/);
  });

  test('user can edit a feeding and see update on the feedings list', async ({
    page,
  }) => {
    await editTrackingItemAndSeeUpdateOnList(page, {
      childNamePrefix: 'E2E Feedings',
      dashboardButton: 'Go to feedings list',
      createUrlPattern: /\/children\/\d+\/feedings\/create/,
      listUrlPattern: /\/children\/\d+\/feedings$/,
      listApiSegment: 'feedings',
      editUrlPattern: /\/children\/\d+\/feedings\/\d+\/edit/,
      createFormSubmitButton: 'Add Feeding',
      fillCreateForm: async (p) => {
        await p.getByRole('radio', { name: 'Bottle' }).click({ force: true });
        await p.getByLabel('Date & Time').fill('2024-06-15T14:00');
        await p.getByLabel('Amount (oz)').fill('4');
      },
      initialRowText: /Bottle:.*4.*oz/,
      editButtonLabel: 'Edit feeding',
      editHeadingPattern: /Edit Feeding/,
      changeForm: async (p) => {
        // Wait for resource data to load before changing (prevents patchFormWithResource race).
        // API returns float "4.0", not "4" — use regex to match either format.
        await expect(p.getByLabel('Amount (oz)')).toHaveValue(/^4(\.0)?$/, { timeout: E2E_TIMEOUT });
        await p.getByLabel('Amount (oz)').fill('6');
      },
      updateButtonLabel: 'Update Feeding',
      listHeaderButton: 'Add Feeding',
      updatedRowText: /Bottle:.*6.*oz/,
    });
  });

  test('user can delete a feeding and return to the list', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Feedings');
    const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
    await logWithDetails.getByRole('button', { name: 'Go to feedings list' }).click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/, { timeout: E2E_TIMEOUT });
    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-20T10:00');
    await page.getByLabel('Amount (oz)').fill('3');
    const list200AfterAdd = waitForTrackingList200(page, 'feedings');
    await page.getByRole('button', { name: 'Add Feeding' }).click();
    await list200AfterAdd;

    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Feeding' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByText(/Bottle:.*3.*oz/).first()
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    await page.getByRole('button', { name: 'Delete feeding' }).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/\d+\/delete/);
    await expect(
      page.getByRole('heading', { name: 'Delete Feeding?' })
    ).toBeVisible();

    const list200AfterDelete = waitForTrackingList200(page, 'feedings');
    await page.getByRole('button', { name: 'Yes, Delete Forever' }).click();
    await list200AfterDelete;

    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/, { timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Feeding' })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test('feedings list shows pagination and user can go to next and previous page', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Feedings Pagination');
    const childId = await createItemsForPagination(page, 'feedings', (at) => ({
      feeding_type: 'bottle',
      fed_at: at.toISOString(),
      amount_oz: 4,
    }));

    await page.goto(`/children/${childId}/feedings/`);
    await expect(page).toHaveURL(new RegExp(`/children/${childId}/feedings/?$`), { timeout: E2E_TIMEOUT });

    await expect(
      page.getByRole('heading', { name: /Feedings for/ })
    ).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(
      page.getByRole('button', { name: 'Add Feeding' })
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
