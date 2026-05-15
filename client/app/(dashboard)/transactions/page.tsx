'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, accountsApi, categoriesApi } from '@/lib/api';
import { Transaction, Account, Category, Pagination } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import TransactionForm from '@/components/transactions/TransactionForm';
import Badge from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    account: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery<TransactionsResponse>({
    queryKey: ['transactions', page, filters],
    queryFn: () =>
      transactionsApi
        .getAll({ page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
        .then((r) => r.data),
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll().then((r) => r.data),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      toast.success('Transaction deleted');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: () => toast.error('Failed to delete transaction'),
  });

  const handleDelete = (tx: Transaction) => {
    if (confirm(`Delete "${tx.description}"?`)) {
      deleteMutation.mutate(tx._id);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditTx(tx);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTx(null);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', category: '', account: '', startDate: '', endDate: '', search: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <Header
        title="Transactions"
        subtitle="Track every dollar in and out"
        action={
          <button
            onClick={() => { setEditTx(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} />
            Add transaction
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition',
                showFilters || hasActiveFilters
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <SlidersHorizontal size={15} />
              Filters {hasActiveFilters && <span className="bg-indigo-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1">
              <select
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                value={filters.account}
                onChange={(e) => updateFilter('account', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="From date"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="To date"
              />
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-500 hover:text-slate-700 underline col-span-full text-left"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
        ) : !data?.transactions.length ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <p className="text-lg mb-1">No transactions found</p>
            <p>Add your first transaction to get started.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {data.transactions.map((tx) => {
                const category = typeof tx.category === 'object' ? tx.category : null;
                const account = typeof tx.account === 'object' ? tx.account : null;
                return (
                  <div key={tx._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 group transition">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${category?.color || '#6b7280'}18` }}
                    >
                      {category?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{tx.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(tx.date)} · {account?.name}
                        {category && ` · ${category.name}`}
                      </p>
                    </div>
                    <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                      {tx.type}
                    </Badge>
                    <span
                      className={cn(
                        'text-sm font-semibold w-28 text-right',
                        tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                      )}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(tx)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.pagination.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.pagination.total)} of{' '}
                  {data.pagination.total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, data.pagination.pages))}
                    disabled={page === data.pagination.pages}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm transaction={editTx || undefined} onSuccess={handleCloseModal} />
      </Modal>
    </div>
  );
}
