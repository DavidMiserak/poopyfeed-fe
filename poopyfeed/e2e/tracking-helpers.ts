import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createChildAndGoToDashboard } from './child-helpers';
import { E2E_TIMEOUT } from './constants';

/** Path segments for tracking list APIs. */
export type TrackingListSegment = 'feedings' | 'diapers' | 'naps';

/**
 * Returns a promise that resolves when a GET request to the tracking list API
 * (e.g. /api/v1/children/1/feedings/) returns 200. Start this before submitting
 * the create form so the list response is not missed. Reduces flakiness by
 * waiting for the API instead of relying on DOM timeouts.
 */
export function waitForTrackingList200(
  page: Page,
  pathSegment: TrackingListSegment,
  timeout: number = E2E_TIMEOUT
): Promise<void> {
  const listPattern = new RegExp(
    `/api/v1/children/\\d+/${pathSegment}/?($|\\?)`
  );
  return page.waitForResponse(
    (resp) =>
      resp.request().method() === 'GET' &&
      listPattern.test(resp.url()) &&
      resp.status() === 200,
    { timeout }
  ).then(() => {});
}

export interface EditTrackingItemAndSeeUpdateOptions {
  childNamePrefix: string;
  /** Dashboard "Log with details" button aria-label: "Go to feedings list" | "Go to diapers list" | "Go to naps list". */
  dashboardButton: string;
  createUrlPattern: RegExp;
  listUrlPattern: RegExp;
  /** API path segment for list GET (feedings | diapers | naps) — used to wait for 200 before asserting list. */
  listApiSegment: TrackingListSegment;
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
  /** List page header button label (e.g. Add Feeding) — used to assert list is visible after create/edit. */
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
    dashboardButton,
    createUrlPattern,
    listUrlPattern,
    listApiSegment,
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
  const logWithDetails = page.getByText('Log with details', { exact: true }).locator('..');
  await logWithDetails.getByRole('button', { name: dashboardButton }).click();
  await expect(page).toHaveURL(createUrlPattern, { timeout: E2E_TIMEOUT });

  await fillCreateForm(page);
  const list200Promise = waitForTrackingList200(page, listApiSegment);
  await page.locator('form').getByRole('button', { name: createFormSubmitButton }).click();
  await list200Promise;

  await expect(page).toHaveURL(listUrlPattern, { timeout: E2E_TIMEOUT });
  await expect(
    page.getByRole('button', { name: listHeaderButton })
  ).toBeVisible({ timeout: E2E_TIMEOUT });
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
  const list200AfterUpdate = waitForTrackingList200(page, listApiSegment);
  await page.locator('form').getByRole('button', { name: updateButtonLabel }).click();
  await list200AfterUpdate;

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
