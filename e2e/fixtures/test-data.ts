/** Shared test data and helpers for the FinFlow suite. */

export const testUser = {
  name: 'QA Tester',
  email: process.env.TEST_EMAIL ?? 'qa.tester@finflow.test',
  password: process.env.TEST_PASSWORD ?? 'Sup3rSecret!23',
};

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}+${Date.now()}@finflow.test`;
}

export const sampleTransaction = {
  description: 'Grocery shopping',
  amount: 42.5,
  type: 'expense' as const,
  category: 'Food',
};

export const sampleBudget = {
  category: 'Food',
  limit: 400,
};
