import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export const PortfolioAllocationChart = ({ walletData }: { walletData: any }) => {
  const data = useMemo(() => {
    if (!walletData || !walletData.spot) return [];

    // Aggregate holdings by asset
    const holdings = walletData.spot.map((b: any) => ({
      name: b.asset,
      value: parseFloat(b.free) + parseFloat(b.locked || '0'),
    })).filter((h: any) => h.value > 0);

    return holdings;
  }, [walletData]);

  if (data.length === 0) return <div className="text-gray-400 text-sm">No assets to display</div>;

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg">
      <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Portfolio Allocation</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
