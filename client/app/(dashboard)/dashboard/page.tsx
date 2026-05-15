'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { DashboardSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import IncomeExpenseChart from '@/components/dashboard/IncomeExpenseChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import BudgetOverview from '@/components/dashboard/BudgetOverview';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary().then((r) => r.data),
  });

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  if (isLoading) {
    return (
      <div>
        <Header
          title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0] || ''}!`}
          subtitle={`Here's your financial overview for ${monthName}`}
        />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <Header
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0] || ''}!`}
        subtitle={`Here's your financial overview for ${monthName}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Balance"
          value={formatCurrency(data.totalBalance)}
          icon={<Wallet size={18} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          subtitle={`Across ${data.accountCount} account${data.accountCount !== 1 ? 's' : ''}`}
        />
        <StatsCard
          title="Monthly Income"
          value={formatCurrency(data.monthlyIncome)}
          change={data.incomeChange}
          changePositiveIsGood={true}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          subtitle={monthName}
        />
        <StatsCard
          title="Monthly Expenses"
          value={formatCurrency(data.monthlyExpenses)}
          change={data.expensesChange}
          changePositiveIsGood={false}
          icon={<TrendingDown size={18} className="text-red-500" />}
          iconBg="bg-red-50"
          subtitle={monthName}
        />
        <StatsCard
          title="Savings Rate"
          value={`${data.savingsRate}%`}
          icon={<PiggyBank size={18} className="text-violet-600" />}
          iconBg="bg-violet-50"
          subtitle="of income saved"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <IncomeExpenseChart />
        </div>
        <CategoryChart data={data.categoryBreakdown} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <RecentTransactions transactions={data.recentTransactions} />
        </div>
        <BudgetOverview budgets={data.budgetSummary} />
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
