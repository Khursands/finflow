'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetsApi, categoriesApi } from '@/lib/api';
import { Budget, Category } from '@/types';
import { BUDGET_PERIODS, getCurrentMonth } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  month: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  budget?: Budget;
  onSuccess: () => void;
}

export default function BudgetForm({ budget, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!budget;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: budget?.category._id || '',
      name: budget?.name || '',
      amount: budget?.amount || undefined,
      period: budget?.period || 'monthly',
      month: budget?.month || getCurrentMonth(),
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => budgetsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Budget created');
      invalidate();
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create budget'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => budgetsApi.update(budget!._id, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Budget updated');
      invalidate();
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update budget'),
  });

  const { mutate, isPending } = isEdit ? updateMutation : createMutation;

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const period = watch('period');

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select
          {...register('categoryId')}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Select a category</option>
          {expenseCategories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Budget name <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="e.g. Monthly groceries"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Budget amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
          <select
            {...register('period')}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {BUDGET_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {period === 'monthly' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
          <input
            {...register('month')}
            type="month"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition text-sm"
      >
        {isPending ? 'Saving...' : isEdit ? 'Update Budget' : 'Create Budget'}
      </button>
    </form>
  );
}
