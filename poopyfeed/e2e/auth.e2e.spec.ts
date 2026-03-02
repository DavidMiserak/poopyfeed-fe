import { test, expect } from './fixtures';
import { E2E_TIMEOUT } from './constants';

/**
 * E2E: Auth flows (signup, login) against Angular + Django.
 * Requires backend and frontend running (e.g. make run).
 */
test.describe('Auth', () => {
  const uniqueEmail = () =>
    `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
  const password = 'e2e-test-password-123';

  test('signup redirects to My Children and shows empty state', async ({
    page,
  }) => {
    await page.goto('/signup');
    await expect(
      page.getByRole('heading', { name: 'Join PoopyFeed!' })
    ).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    await page.getByLabel('Full name').fill('E2E User');
    await page.getByLabel('Email address').fill(uniqueEmail());
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/children/);
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No children yet!' })
    ).toBeVisible();
  });

  test('login with valid credentials redirects to My Children', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible();
    await page.getByLabel('Full name').fill('E2E Login User');
    await page.getByLabel('Email address').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/children/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/children/);
    await expect(
      page.getByRole('heading', { name: 'My Children' })
    ).toBeVisible();
  });

  test('login with invalid password shows error', async ({ page }) => {
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: 'Welcome Back!' })
    ).toBeVisible();

    await page.getByLabel('Email address').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-error')).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });

  test('signup with password mismatch shows validation error', async ({
    page,
  }) => {
    await page.goto('/signup');
    await expect(page.locator('#password')).toBeVisible();
    await page.getByLabel('Full name').fill('E2E User');
    await page.getByLabel('Email address').fill(uniqueEmail());
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill('different-password');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});
