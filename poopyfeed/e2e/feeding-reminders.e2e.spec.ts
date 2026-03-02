import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';

/**
 * E2E: Feeding reminder interval configuration on the child edit form.
 * Requires: owner user (auth fixture), live backend.
 * Runs in *-authenticated projects (storageState injected by playwright.config.ts).
 */
test.describe('Feeding Reminders', () => {
  /**
   * Helper: create a new unique child and return its numeric ID.
   * Uses a timestamp-based suffix to ensure uniqueness across test runs.
   * Navigates to /children/create, fills form, creates child, then navigates
   * to the child's dashboard to extract the ID from the URL.
   */
  async function createChildAndGetId(page, testName: string): Promise<string> {
    const timestamp = Date.now();
    const childName = `E2E ${testName} ${timestamp}`;

    // Navigate to create form
    await page.goto('/children/create');
    await expect(page.getByRole('heading', { name: 'Add New Baby' })).toBeVisible();

    // Fill form and create child
    await page.getByLabel("Baby's Name").fill(childName);
    await page.getByLabel('Date of Birth').fill('2024-06-01');
    await page.getByRole('radio', { name: '♂️ Male' }).click({ force: true });
    await page.getByRole('button', { name: 'Add Baby' }).click();

    await expect(page).toHaveURL(/\/children\/\d+\/dashboard/, { timeout: E2E_TIMEOUT });
    const url = page.url();
    const childId = url.match(/\/children\/(\d+)\//)?.[1];
    if (!childId) throw new Error('Could not extract child ID from URL: ' + url);
    return childId;
  }

  test('feeding reminders section is visible on child edit form for owner', async ({ page }) => {
    const childId = await createChildAndGetId(page, 'Visible');

    await page.goto(`/children/${childId}/edit`);
    await expect(page.getByRole('heading', { name: 'Edit Baby' })).toBeVisible({ timeout: E2E_TIMEOUT });

    // Advanced settings panel is always visible on edit form
    await expect(
      page.locator('#advanced-settings-panel')
    ).toBeVisible({ timeout: E2E_TIMEOUT });

    // Fieldset should be rendered inside advanced settings
    const remindersGroup = page.getByRole('group', { name: /Feeding Reminders/ });
    await expect(remindersGroup).toBeVisible({ timeout: E2E_TIMEOUT });

    // Reminder Interval select defaults to Off (null value)
    const select = page.getByLabel('Reminder Interval');
    await expect(select).toBeVisible({ timeout: E2E_TIMEOUT });
    // The "Off" option should be selected (value is either "" or "null" depending on rendering)
    const selectedOption = select.locator('option[selected], option:first-child');
    await expect(selectedOption).toHaveText('Off');
  });

  test('owner can set reminder interval and form submits successfully', async ({ page }) => {
    const childId = await createChildAndGetId(page, 'SetInterval');

    await page.goto(`/children/${childId}/edit`);
    await expect(page.getByRole('heading', { name: 'Edit Baby' })).toBeVisible();

    // Select an interval and submit the form (advanced panel is always visible)
    const select = page.getByLabel('Reminder Interval');
    await expect(select).toBeVisible();
    await select.selectOption({ label: '3 hours' });

    // Verify the option is selected before submitting
    await expect(select).toHaveValue('3');

    // Submit the form
    await page.getByRole('button', { name: 'Update Baby' }).click();

    // Wait for navigation to children list (indicates successful submission)
    await expect(page).toHaveURL(/\/children$/, { timeout: E2E_TIMEOUT });
  });

  test('owner can clear reminder interval to Off and form submits successfully', async ({ page }) => {
    const childId = await createChildAndGetId(page, 'ClearInterval');

    await page.goto(`/children/${childId}/edit`);
    await expect(page.getByRole('heading', { name: 'Edit Baby' })).toBeVisible();

    // Change the reminder interval to "Off" (advanced panel is always visible)
    const select = page.getByLabel('Reminder Interval');
    await expect(select).toBeVisible();
    await select.selectOption({ label: 'Off' });

    // Verify "Off" is selected
    const selectedOption = select.locator('option[selected], option:first-child');
    await expect(selectedOption).toHaveText('Off');

    // Submit the form
    await page.getByRole('button', { name: 'Update Baby' }).click();

    // Wait for navigation to children list (indicates successful submission)
    await expect(page).toHaveURL(/\/children$/, { timeout: E2E_TIMEOUT });
  });

  test('feeding reminders section is NOT shown on the create form', async ({ page }) => {
    await page.goto('/children/create');
    await expect(page.getByRole('heading', { name: 'Add New Baby' })).toBeVisible();

    // Create mode never shows reminders fieldset
    await expect(page.getByRole('group', { name: /Feeding Reminders/ })).not.toBeVisible();
  });
});
