import { test, expect } from '@playwright/test';
import { sampleBudget } from '../fixtures/test-data';

test.describe('FinFlow — Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budgets');
  });

  test('budgets page renders', async ({ page }) => {
    await expect(page).toHaveURL(/\/budgets/);
    await expect(
      page.getByRole('heading', { name: /budget/i }).first(),
    ).toBeVisible();
  });

  test('a budget can be created for a category', async ({ page }) => {
    await page.getByRole('button', { name: /add|new budget|create/i }).click();

    const category = page.getByLabel(/category/i);
    if (await category.count()) await category.fill(sampleBudget.category);
    await page.getByLabel(/limit|amount/i).fill(String(sampleBudget.limit));
    await page.getByRole('button', { name: /save|add|create/i }).click();

    await expect(page.getByText(new RegExp(sampleBudget.category, 'i'))).toBeVisible();
  });
});
