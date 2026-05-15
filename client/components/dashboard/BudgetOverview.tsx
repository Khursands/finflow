'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BudgetItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  spent: number;
  percentage: string;
}

interface Props {
  budgets: BudgetItem[];
}

export default function BudgetOverview({ budgets }: Props) {
  if (!budgets || budgets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Budget Overview</h3>
          <Link href="/budgets" className="text-xs text-indigo-500 hover:underline">
            Manage
          </Link>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          <p>No budgets set up yet.</p>
          <Link href="/budgets" className="text-indigo-500 hover:underline mt-1 inline-block">
            Create your first budget →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Budget Overview</h3>
        <Link href="/budgets" className="text-xs text-indigo-500 hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {budgets.map((b) => {
          const pct = parseFloat(b.percentage);
          const isOver = pct >= 100;
          const isWarning = pct >= 80 && pct < 100;
          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-700">
                  {b.icon} {b.name}
                </span>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isOver ? 'text-red-500' : isWarning ? 'text-amber-600' : 'text-slate-500'
                    )}
                  >
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {isOver && (
                <p className="text-xs text-red-500 mt-1">
                  Over budget by {formatCurrency(b.spent - b.amount)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
