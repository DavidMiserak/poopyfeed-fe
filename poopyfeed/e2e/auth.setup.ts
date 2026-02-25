import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

/**
 * Runs once before any project that depends on "setup".
 * Signs up a fresh user and saves storageState so authenticated projects
 * can reuse the session (no per-test signup).
 */
setup('authenticate', async ({ page }) => {
  const email = `e2e-fixture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'e2e-fixture-password-123';

  await page.goto('/signup');
  await expect(page.locator('#password')).toBeVisible();

  await page.getByLabel('Full name').fill('E2E Fixture User');
  await page.getByLabel('Email address').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page).toHaveURL(/\/children/);
  await expect(
    page.getByRole('heading', { name: 'My Children' })
  ).toBeVisible();

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
