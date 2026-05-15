'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface Props {
  data: Array<{ _id: string; name: string; icon: string; color: string; total: number }>;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, icon, total } = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700">
          {icon} {name}
        </p>
        <p className="text-slate-600 font-medium">{formatCurrency(total)}</p>
      </div>
    );
  }
  return null;
};

export default function CategoryChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Spending Categories</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-10">
          No spending data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Spending Categories</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="total"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={entry._id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 space-y-2">
        {data.slice(0, 5).map((item) => (
          <div key={item._id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600">
                {item.icon} {item.name}
              </span>
            </div>
            <span className="font-semibold text-slate-700">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
