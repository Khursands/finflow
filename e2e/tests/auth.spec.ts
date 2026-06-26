import { test, expect } from '@playwright/test';
import { uniqueEmail, testUser } from '../fixtures/test-data';

// These run without the stored session — exercise the auth screens directly.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('FinFlow — Authentication', () => {
  test('login page renders the form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('invalid credentials show an error and stay on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nobody@finflow.test');
    await page.getByLabel(/password/i).fill('wrong-password');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('a new user can register', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(uniqueEmail('signup'));
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('unauthenticated access to /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
