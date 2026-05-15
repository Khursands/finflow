'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, accountsApi, categoriesApi } from '@/lib/api';
import { Account, Category, Transaction } from '@/types';
import { formatDateInput } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  transaction?: Transaction;
  onSuccess: () => void;
}

export default function TransactionForm({ transaction, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!transaction;

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll().then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const getDefaultAccount = () => {
    if (transaction) {
      const acc = typeof transaction.account === 'object' ? transaction.account : null;
      return acc?._id || '';
    }
    return accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || '';
  };

  const getDefaultCategory = () => {
    if (transaction?.category) {
      const cat = typeof transaction.category === 'object' ? transaction.category : null;
      return cat?._id || '';
    }
    return '';
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: transaction?.type || 'expense',
      description: transaction?.description || '',
      amount: transaction?.amount || undefined,
      accountId: getDefaultAccount(),
      categoryId: getDefaultCategory(),
      date: transaction ? formatDateInput(transaction.date) : formatDateInput(new Date()),
      notes: transaction?.notes || '',
    },
  });

  const selectedType = watch('type');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi
        .create({ ...data, categoryId: data.categoryId || null })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Transaction added');
      invalidate();
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add transaction'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi
        .update(transaction!._id, { ...data, categoryId: data.categoryId || null })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Transaction updated');
      invalidate();
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update transaction'),
  });

  const { mutate, isPending } = isEdit ? updateMutation : createMutation;

  const filteredCategories = categories.filter(
    (c) => c.type === selectedType || c.type === 'both'
  );

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <label
              key={t}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition ${
                watch('type') === t
                  ? t === 'expense'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <input {...register('type')} type="radio" value={t} className="sr-only" />
              {t === 'expense' ? '↓ Expense' : '↑ Income'}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            {...register('date')}
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <input
          {...register('description')}
          type="text"
          placeholder="e.g. Grocery shopping"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
          <select
            {...register('accountId')}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            {...register('categoryId')}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <option value="">No category</option>
            {filteredCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notes <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Additional notes..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          {isPending ? 'Saving...' : isEdit ? 'Update Transaction' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}
