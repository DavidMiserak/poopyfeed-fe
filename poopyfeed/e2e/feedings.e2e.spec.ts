import { test, expect } from './fixtures';
import { createChildAndGoToDashboard } from './child-helpers';
import { createItemsForPagination } from './pagination-helpers';
import { editTrackingItemAndSeeUpdateOnList } from './tracking-helpers';

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
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/);
    await expect(
      page.getByRole('heading', { name: /Add Feeding/ })
    ).toBeVisible();

    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-15T14:00');
    await page.getByLabel('Amount (oz)').fill('4');
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/);
    await expect(
      page.getByText(/Bottle:.*4.*oz/).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('bottle feeding form shows validation when amount is missing', async ({
    page,
  }) => {
    await createChildAndGoToDashboard(page, 'E2E Feedings');
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/create/);
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
      dashboardAddButton: 'Add Feeding',
      createUrlPattern: /\/children\/\d+\/feedings\/create/,
      listUrlPattern: /\/children\/\d+\/feedings$/,
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
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await page.getByRole('radio', { name: 'Bottle' }).click({ force: true });
    await page.getByLabel('Date & Time').fill('2024-06-20T10:00');
    await page.getByLabel('Amount (oz)').fill('3');
    await page.getByRole('button', { name: 'Add Feeding' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/);
    await expect(
      page.getByText(/Bottle:.*3.*oz/).first()
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Delete feeding' }).first().click();
    await expect(page).toHaveURL(/\/children\/\d+\/feedings\/\d+\/delete/);
    await expect(
      page.getByRole('heading', { name: 'Delete Feeding?' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Yes, Delete Forever' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/feedings$/);
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
    await expect(page).toHaveURL(new RegExp(`/children/${childId}/feedings/?$`));

    await expect(
      page.getByRole('heading', { name: /Feedings for/ })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Page 1 of 2')).toBeVisible();
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
