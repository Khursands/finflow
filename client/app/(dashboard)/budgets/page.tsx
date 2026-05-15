'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '@/lib/api';
import { Budget } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import BudgetForm from '@/components/budgets/BudgetForm';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.getAll().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      toast.success('Budget deleted');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to delete budget'),
  });

  const handleEdit = (b: Budget) => {
    setEditBudget(b);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditBudget(null);
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter((b) => parseFloat(b.percentage) >= 100).length;

  return (
    <div>
      <Header
        title="Budgets"
        subtitle="Set spending limits and stay on track"
        action={
          <button
            onClick={() => { setEditBudget(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} />
            New budget
          </button>
        }
      />

      {!isLoading && budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total Budgeted</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
          </div>
          <div className={cn(
            'rounded-xl border p-4 shadow-sm',
            overBudgetCount > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
          )}>
            <p className={cn('text-xs mb-1', overBudgetCount > 0 ? 'text-red-500' : 'text-emerald-600')}>
              Over Budget
            </p>
            <p className={cn('text-xl font-bold', overBudgetCount > 0 ? 'text-red-700' : 'text-emerald-700')}>
              {overBudgetCount} budget{overBudgetCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 shadow-sm text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Target size={22} className="text-indigo-400" />
          </div>
          <p className="text-slate-700 font-medium mb-1">No budgets yet</p>
          <p className="text-slate-400 text-sm mb-4">Create budgets to control your spending</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Create first budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {budgets.map((b) => {
            const pct = parseFloat(b.percentage);
            const isOver = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;
            const barColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';

            return (
              <div key={b._id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${b.category.color}18` }}
                    >
                      {b.category.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {b.name || b.category.name}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">{b.period}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${b.name || b.category.name}" budget?`)) {
                          deleteMutation.mutate(b._id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="text-sm text-slate-400">of {formatCurrency(b.amount)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isOver ? 'text-red-500' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                    )}
                  >
                    {isOver
                      ? `${formatCurrency(b.spent - b.amount)} over budget`
                      : `${formatCurrency(b.remaining)} remaining`}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isOver ? 'text-red-500' : isWarning ? 'text-amber-600' : 'text-slate-500'
                    )}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={editBudget ? 'Edit Budget' : 'Create Budget'}
      >
        <BudgetForm budget={editBudget || undefined} onSuccess={handleClose} />
      </Modal>
    </div>
  );
}
