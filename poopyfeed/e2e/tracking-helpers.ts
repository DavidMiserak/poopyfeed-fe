import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';
import { E2E_TIMEOUT } from './constants';

export interface EditTrackingItemAndSeeUpdateOptions {
  childNamePrefix: string;
  dashboardAddButton: string;
  createUrlPattern: RegExp;
  listUrlPattern: RegExp;
  editUrlPattern: RegExp;
  createFormSubmitButton: string;
  /** Fill the create form before submitting (e.g. select type, date, amount). */
  fillCreateForm: (page: Page) => Promise<void>;
  initialRowText: string | RegExp;
  editButtonLabel: string;
  editHeadingPattern: RegExp;
  /** Change the edit form before submitting (e.g. change type or amount). */
  changeForm: (page: Page) => Promise<void>;
  updateButtonLabel: string;
  listHeaderButton: string;
  updatedRowText: string | RegExp;
  /** If set, wait for this success toast after update before proceeding (confirms API success). */
  successToastAfterUpdate?: string;
}

/**
 * Shared E2E flow: create child, add one tracking item, edit it, return to list and assert updated row.
 * Uses form-scoped submit, reload, and element-based waits (no networkidle) for mobile-network reliability.
 */
export async function editTrackingItemAndSeeUpdateOnList(
  page: Page,
  options: EditTrackingItemAndSeeUpdateOptions
): Promise<void> {
  const {
    childNamePrefix,
    dashboardAddButton,
    createUrlPattern,
    listUrlPattern,
    editUrlPattern,
    createFormSubmitButton,
    fillCreateForm,
    initialRowText,
    editButtonLabel,
    editHeadingPattern,
    changeForm,
    updateButtonLabel,
    listHeaderButton,
    updatedRowText,
    successToastAfterUpdate,
  } = options;

  await createChildAndGoToDashboard(page, childNamePrefix);
  await page.getByRole('button', { name: dashboardAddButton }).click();

  await expect(page).toHaveURL(createUrlPattern);
  await fillCreateForm(page);
  await page.locator('form').getByRole('button', { name: createFormSubmitButton }).click();

  await expect(page).toHaveURL(listUrlPattern, { timeout: E2E_TIMEOUT });
  await expect(
    page.getByText(initialRowText).first()
  ).toBeVisible({ timeout: E2E_TIMEOUT });

  await page.getByRole('button', { name: editButtonLabel }).first().click();
  await expect(page).toHaveURL(editUrlPattern);
  await expect(
    page.getByRole('heading', { name: editHeadingPattern })
  ).toBeVisible();

  // Wait for the edit form to be ready (update button visible) so resource data has loaded
  // before making changes (prevents race where patchFormWithResource overwrites user edits).
  // Element-based wait is reliable on slow/flaky mobile networks; avoid networkidle.
  await expect(
    page.getByRole('button', { name: updateButtonLabel })
  ).toBeVisible({ timeout: E2E_TIMEOUT });

  await changeForm(page);
  await page.locator('form').getByRole('button', { name: updateButtonLabel }).click();

  if (successToastAfterUpdate) {
    await expect(page.getByText(successToastAfterUpdate)).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  }
  await expect(page).toHaveURL(listUrlPattern, { timeout: E2E_TIMEOUT });
  await expect(
    page.getByRole('button', { name: listHeaderButton })
  ).toBeVisible({ timeout: E2E_TIMEOUT });

  const updatedLocator = page.getByText(updatedRowText).first();
  const updatedVisible = await updatedLocator
    .waitFor({ state: 'visible', timeout: E2E_TIMEOUT })
    .then(() => true)
    .catch(() => false);
  if (!updatedVisible) {
    try {
      await page.reload({ timeout: E2E_TIMEOUT });
      await expect(
        page.getByRole('button', { name: listHeaderButton })
      ).toBeVisible({ timeout: E2E_TIMEOUT });
    } catch {
      // Reload failed; still assert updated row in case it appeared
    }
  }
  await expect(updatedLocator).toBeVisible({ timeout: E2E_TIMEOUT });
}
