'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { mutate: logout, isPending } = useLogout();

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col min-h-screen">
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,17 7,12 11,14 16,8 21,5" stroke="white" strokeWidth="2.2"/>
              <circle cx="21" cy="5" r="1.5" fill="white"/>
            </svg>
          </div>
          <div>
            <span className="text-white font-bold text-[15px] leading-none tracking-tight">FinFlow</span>
            <p className="text-slate-500 text-[11px] mt-0.5 tracking-wide uppercase">Finance Tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
        >
          <LogOut size={17} />
          {isPending ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
