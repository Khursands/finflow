'use client';

import Link from 'next/link';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
        <Link href="/transactions" className="text-xs text-indigo-500 hover:underline">
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          <p>No transactions yet.</p>
          <Link href="/transactions" className="text-indigo-500 hover:underline mt-1 inline-block">
            Add your first transaction →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {transactions.map((tx) => {
            const category = typeof tx.category === 'object' ? tx.category : null;
            const account = typeof tx.account === 'object' ? tx.account : null;
            return (
              <div key={tx._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: `${category?.color || '#6b7280'}18` }}
                >
                  {category?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(tx.date)} · {account?.name || 'Account'}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold flex-shrink-0',
                    tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                  )}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
