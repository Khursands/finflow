import { test as setup, expect } from '@playwright/test';
import { testUser } from '../fixtures/test-data';
import fs from 'node:fs';

const STORAGE = 'storage/user.json';

/**
 * Authentication setup project. Registers (idempotently) and logs in a test
 * user once, then persists the session so the main projects start signed in.
 */
setup('authenticate', async ({ page }) => {
  fs.mkdirSync('storage', { recursive: true });

  // Attempt login; if the account does not exist, register first.
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/password/i).fill(testUser.password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  const onDashboard = page.waitForURL(/\/dashboard/, { timeout: 4000 }).then(() => true).catch(() => false);
  if (!(await onDashboard)) {
    await page.goto('/register');
    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await page.waitForURL(/\/dashboard/);
  }

  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: STORAGE });
});
