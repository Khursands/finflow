import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string | null;
  changePositiveIsGood?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changePositiveIsGood = true,
  icon,
  iconBg,
  subtitle,
}: StatsCardProps) {
  const changeNum = change ? parseFloat(change) : null;
  const changeColor =
    changeNum === null
      ? ''
      : changePositiveIsGood
      ? changeNum >= 0
        ? 'text-emerald-600'
        : 'text-red-500'
      : changeNum >= 0
      ? 'text-red-500'
      : 'text-emerald-600';

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        {change !== null && change !== undefined && (
          <span className={cn('text-xs font-medium', changeColor)}>
            {changeNum !== null && changeNum > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
