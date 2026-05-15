'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api';
import { Account } from '@/types';
import { formatCurrency, ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2, CreditCard, Wallet, PiggyBank, Banknote, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['checking', 'savings', 'credit', 'cash', 'investment']),
  balance: z.coerce.number(),
  color: z.string(),
});

type FormData = z.infer<typeof schema>;

const AccountIcon = ({ type, size = 18 }: { type: string; size?: number }) => {
  const icons: Record<string, React.ReactNode> = {
    checking: <Wallet size={size} />,
    savings: <PiggyBank size={size} />,
    credit: <CreditCard size={size} />,
    cash: <Banknote size={size} />,
    investment: <TrendingUp size={size} />,
  };
  return <>{icons[type] || <Wallet size={size} />}</>;
};

function AccountForm({
  account,
  onSuccess,
}: {
  account?: Account;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!account;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name || '',
      type: account?.type || 'checking',
      balance: account?.balance || 0,
      color: account?.color || '#6366f1',
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => accountsApi.create(data).then((r) => r.data),
    onSuccess: () => { toast.success('Account created'); invalidate(); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create account'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => accountsApi.update(account!._id, data).then((r) => r.data),
    onSuccess: () => { toast.success('Account updated'); invalidate(); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update account'),
  });

  const { mutate, isPending } = isEdit ? updateMutation : createMutation;
  const selectedColor = watch('color');

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Account name</label>
        <input
          {...register('name')}
          type="text"
          placeholder="e.g. Main Checking"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select
            {...register('type')}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {isEdit ? 'Balance adjustment' : 'Starting balance'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              {...register('balance')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={cn(
                'w-7 h-7 rounded-full transition-all',
                selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition text-sm"
      >
        {isPending ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
      </button>
    </form>
  );
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountsApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      toast.success('Account deleted');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete account'),
  });

  const handleEdit = (a: Account) => {
    setEditAccount(a);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditAccount(null);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div>
      <Header
        title="Accounts"
        subtitle="Manage your financial accounts"
        action={
          <button
            onClick={() => { setEditAccount(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} />
            Add account
          </button>
        }
      />

      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-5 mb-6 shadow-md">
          <p className="text-indigo-200 text-sm mb-1">Total Net Worth</p>
          <p className="text-white text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-indigo-200 text-xs mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 shadow-sm text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CreditCard size={22} className="text-indigo-400" />
          </div>
          <p className="text-slate-700 font-medium mb-1">No accounts yet</p>
          <p className="text-slate-400 text-sm mb-4">Add an account to start tracking your finances</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Add first account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {accounts.map((a) => (
            <div
              key={a._id}
              className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm group"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: a.color }}
                  >
                    <AccountIcon type={a.type} size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{a.type}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEdit(a)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${a.name}"? This will fail if the account has transactions.`)) {
                        deleteMutation.mutate(a._id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Balance</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    a.balance < 0 ? 'text-red-600' : 'text-slate-900'
                  )}
                >
                  {formatCurrency(a.balance)}
                </p>
              </div>
              {a.isDefault && (
                <span className="mt-2 inline-block text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={editAccount ? 'Edit Account' : 'Add Account'}
      >
        <AccountForm account={editAccount || undefined} onSuccess={handleClose} />
      </Modal>
    </div>
  );
}
