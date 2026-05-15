export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
}

export interface Account {
  _id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
}

export interface Transaction {
  _id: string;
  account: { _id: string; name: string; color: string } | string;
  category: { _id: string; name: string; icon: string; color: string } | null | string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  notes: string;
  createdAt: string;
}

export interface Budget {
  _id: string;
  category: { _id: string; name: string; icon: string; color: string };
  name: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  month?: string;
  spent: number;
  remaining: number;
  percentage: string;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: string;
  incomeChange: string | null;
  expensesChange: string | null;
  categoryBreakdown: Array<{
    _id: string;
    name: string;
    icon: string;
    color: string;
    total: number;
  }>;
  recentTransactions: Transaction[];
  budgetSummary: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    spent: number;
    percentage: string;
  }>;
  accountCount: number;
}

export interface MonthlyStats {
  month: string;
  year: number;
  income: number;
  expenses: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
