import React, { useState, useEffect } from 'react';
import { Activity, Zap } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

export const TradeVelocityGauge = () => {
  const [tradesLastHour, setTradesLastHour] = useState(0);
  const [avgTradesPerHour, setAvgTradesPerHour] = useState(0);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch('/api/bot/state');
        if (res.ok) {
          const data = await res.json();
          if (data.orderHistory && Array.isArray(data.orderHistory)) {
            const now = new Date().getTime();
            const oneHourAgo = now - 60 * 60 * 1000;
            const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

            const recentTrades = data.orderHistory.filter((t: any) => new Date(t.time).getTime() >= oneHourAgo);
            const dailyTrades = data.orderHistory.filter((t: any) => new Date(t.time).getTime() >= twentyFourHoursAgo);

            setTradesLastHour(recentTrades.length);
            setAvgTradesPerHour(dailyTrades.length / 24);
          }
        }
      } catch (e) {}
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, []);

  // Max value for the gauge (e.g., 50 trades/hour)
  const maxValue = 50;
  
  // Calculate color based on activity
  let color = '#3b82f6'; // blue
  if (tradesLastHour > 20) color = '#f59e0b'; // amber
  if (tradesLastHour > 40) color = '#ef4444'; // red

  const data = [
    { name: 'Velocity', value: tradesLastHour, fill: color }
  ];

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:z-10 group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            Trade Velocity
          </h3>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Automated executions per hour</p>
        </div>
        <div className="p-2 bg-gray-900 rounded-lg border border-gray-800 text-gray-400">
          <Activity className="size-4" />
        </div>
      </div>

      <div className="h-[180px] w-full relative mt-4 z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="100%" 
            innerRadius="80%" 
            outerRadius="100%" 
            barSize={15} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, maxValue]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: 'var(--color-gray-900)' }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <span className="text-5xl font-black text-white font-mono tracking-tighter">
            {tradesLastHour}
          </span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
            Trades / Hr
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-800/50 relative z-10">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">24h Average</p>
          <p className="text-sm text-gray-300 font-mono">{avgTradesPerHour.toFixed(1)} / hr</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Status</p>
          <p className={`text-sm font-mono font-bold ${
            tradesLastHour > 40 ? 'text-rose-400' : 
            tradesLastHour > 20 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {tradesLastHour > 40 ? 'HYPERACTIVE' : 
             tradesLastHour > 20 ? 'ACTIVE' : 'NORMAL'}
          </p>
        </div>
      </div>
    </div>
  );
};
