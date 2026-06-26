import { test, expect } from '@playwright/test';

// Uses the authenticated storage state from the setup project.
test.describe('FinFlow — Dashboard', () => {
  test('dashboard loads with summary widgets', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible();
  });

  test('navigation exposes the core sections', async ({ page }) => {
    await page.goto('/dashboard');
    for (const label of [/transactions/i, /accounts/i, /budgets/i]) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('navigating to Transactions changes the route', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page).toHaveURL(/\/transactions/);
  });
});
