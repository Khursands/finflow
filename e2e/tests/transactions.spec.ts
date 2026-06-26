import { test, expect } from '@playwright/test';
import { sampleTransaction } from '../fixtures/test-data';

test.describe('FinFlow — Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  test('transactions page renders a list or empty state', async ({ page }) => {
    await expect(
      page.getByRole('table').or(page.getByText(/no transactions/i)),
    ).toBeVisible();
  });

  test('a new transaction can be added and appears in the list', async ({ page }) => {
    await page.getByRole('button', { name: /add|new transaction/i }).click();

    await page.getByLabel(/description/i).fill(sampleTransaction.description);
    await page.getByLabel(/amount/i).fill(String(sampleTransaction.amount));

    const category = page.getByLabel(/category/i);
    if (await category.count()) {
      await category.fill(sampleTransaction.category);
    }

    await page.getByRole('button', { name: /save|add|create/i }).click();
    await expect(page.getByText(sampleTransaction.description)).toBeVisible();
  });

  test('amount field rejects non-numeric input', async ({ page }) => {
    await page.getByRole('button', { name: /add|new transaction/i }).click();
    await page.getByLabel(/amount/i).fill('abc');
    await page.getByRole('button', { name: /save|add|create/i }).click();
    await expect(page.getByText(/valid|number|required/i).first()).toBeVisible();
  });
});
