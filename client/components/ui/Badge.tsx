import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'income' | 'expense' | 'neutral' | 'warning';
  className?: string;
}

export default function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variantClass = {
    income: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    expense: 'bg-red-50 text-red-700 border-red-100',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variantClass,
        className
      )}
    >
      {children}
    </span>
  );
}
