import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { JournalEntry } from './TradeJournal';
import { motion, AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-950/90 backdrop-blur-md border border-gray-800 p-4 rounded-xl shadow-2xl outline-none min-w-[160px]">
        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-mono mb-2 pb-2 border-b border-gray-800/50">
          {label || data.time}
        </p>
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-6">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest">Balance</span>
            <span className="text-white font-mono font-bold">${data.balance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest">Daily PnL</span>
            <span className={`font-mono font-bold ${data.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.dailyPnL > 0 ? '+' : ''}{data.dailyPnL.toFixed(2)}%
            </span>
          </div>
          {data.tradeCount !== undefined && (
            <div className="flex justify-between items-center gap-6">
              <span className="text-gray-500 text-[10px] uppercase tracking-widest">Trades</span>
              <span className="text-gray-300 font-mono">{data.tradeCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomCursor = (props: any) => {
  const { points, width, height, stroke } = props;
  const { x, y } = points[0];
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={height} stroke={stroke} strokeWidth={1} strokeDasharray="4 4" />
      <line x1={0} y1={y} x2={width} y2={y} stroke={stroke} strokeWidth={1} strokeDasharray="4 4" />
    </g>
  );
};

export function PortfolioPerformanceChart({ 
  data,
  journalEntries = []
}: { 
  data: { time: string; balance: number }[],
  journalEntries?: JournalEntry[]
}) {
  const [showStats, setShowStats] = useState(false);

  const stats = useMemo(() => {
    let wins = 0;
    let totalTrades = 0;
    let totalProfitPercent = 0;
    
    const openPositions: Record<string, number[]> = {};
    
    // Sort chronologically
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    for (const entry of sortedEntries) {
      if (!openPositions[entry.ticker]) {
        openPositions[entry.ticker] = [];
      }
      
      const entryPrice = Number(entry.price) || 0;
      if (entry.side === 'BUY') {
        openPositions[entry.ticker].push(entryPrice);
      } else if (entry.side === 'SELL') {
        const buyPrice = openPositions[entry.ticker].shift();
        if (buyPrice !== undefined && buyPrice > 0) {
          const profitPercent = ((entryPrice - buyPrice) / buyPrice) * 100;
          totalProfitPercent += profitPercent;
          totalTrades++;
          if (profitPercent > 0) wins++;
        }
      }
    }

    return {
      winRate: totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0',
      avgProfit: totalTrades > 0 ? (totalProfitPercent / totalTrades).toFixed(2) : '0.00',
      totalTrades
    };
  }, [journalEntries]);

  const chartData = useMemo(() => {
    const dailyStats: Record<string, { balance: number, dailyPnL: number, tradeCount: number, realizedProfit: number }> = {};
    
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    let currentBalance = 10; 
    let openPositions: Record<string, number[]> = {};

    sortedEntries.forEach(entry => {
      const date = new Date(entry.time).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { balance: currentBalance, dailyPnL: 0, tradeCount: 0, realizedProfit: 0 };
      }
      
      dailyStats[date].tradeCount++;

      if (!openPositions[entry.ticker]) openPositions[entry.ticker] = [];

      const entryPrice = Number(entry.price) || 0;
      if (entry.side === 'BUY') {
        openPositions[entry.ticker].push(entryPrice);
      } else if (entry.side === 'SELL') {
        const buyPrice = openPositions[entry.ticker].shift();
        if (buyPrice !== undefined && buyPrice > 0) {
          const positionSize = currentBalance * 0.1; // Simulated 10% risk
          const profitPercent = ((entryPrice - buyPrice) / buyPrice);
          const profitAmount = positionSize * profitPercent;
          
          currentBalance += profitAmount;
          dailyStats[date].realizedProfit += profitAmount;
          dailyStats[date].balance = currentBalance;
        }
      }
    });

    const dates = Object.keys(dailyStats).sort();
    if (dates.length === 0) {
      if (data && data.length > 0) {
        return data.map(d => ({ ...d, dailyPnL: 0, tradeCount: 0 }));
      }
      const today = new Date();
      return Array.from({length: 30}).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (29 - i));
        return {
          time: d.toISOString().split('T')[0],
          balance: 10,
          dailyPnL: 0,
          tradeCount: 0
        };
      });
    }

    const firstDate = new Date(dates[0]);
    const lastDate = new Date();
    
    const result = [];
    let runningBalance = 10;

    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        runningBalance = dailyStats[dateStr].balance;
        const prevDayBalance = runningBalance - dailyStats[dateStr].realizedProfit;
        const dailyPnL = prevDayBalance > 0 ? (dailyStats[dateStr].realizedProfit / prevDayBalance) * 100 : 0;
        
        result.push({
          time: dateStr,
          balance: runningBalance,
          dailyPnL: dailyPnL,
          tradeCount: dailyStats[dateStr].tradeCount
        });
      } else {
        result.push({
          time: dateStr,
          balance: runningBalance,
          dailyPnL: 0,
          tradeCount: 0
        });
      }
    }
    return result;
  }, [journalEntries, data]);

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 shadow-xl h-[300px] relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Portefølje Vækst</h3>
        
        <div 
          className="relative"
          onMouseEnter={() => setShowStats(true)}
          onMouseLeave={() => setShowStats(false)}
        >
          <button className="text-gray-500 hover:text-amber-400 transition-colors">
            <Info size={16} />
          </button>
          
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-50 pointer-events-none"
              >
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Win Rate</div>
                    <div className={`text-lg font-mono ${Number(stats.winRate) >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {stats.winRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Avg Profit / Trade</div>
                    <div className={`text-lg font-mono ${Number(stats.avgProfit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Number(stats.avgProfit) > 0 ? '+' : ''}{stats.avgProfit}%
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-700">
                    Based on {stats.totalTrades} closed pairs
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={<CustomCursor stroke="#4b5563" />}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#f59e0b" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
              activeDot={{ r: 6, fill: '#f59e0b', stroke: '#030712', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
