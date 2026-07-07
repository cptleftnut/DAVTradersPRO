import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, TrendingDown, Activity, DollarSign, Percent, RefreshCw } from 'lucide-react';

export function SessionSummaryWidget() {
  const [totalTrades, setTotalTrades] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/bot/state');
      if (res.ok) {
        const state = await res.json();
        const history = state.orderHistory || [];
        setTotalTrades(history.length);
        
        const wins = history.filter((t: any) => t.pnl > 0).length;
        setWinRate(history.length > 0 ? (wins / history.length) * 100 : 0);
        
        const pnl = history.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
        setTotalPnl(pnl);
        
        setIsLive(state.isLiveTrading || false);
      }
    } catch (e) {
      console.error("Failed to fetch session summary", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border-white/10 p-6 flex flex-col h-[400px] overflow-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800 rounded-xl border border-gray-700">
            <Target className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Session Summary</h2>
            <p className="text-xs text-gray-400">Current trading performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {loading ? (
             <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
          ) : (
             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-950 border border-gray-800">
               <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
               <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                 {isLive ? 'Live' : 'Paper'}
               </span>
             </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 z-10">
        
        {/* Total PNL */}
        <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl p-5 relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20 ${totalPnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Net Profit/Loss
              </p>
              <h3 className={`text-3xl font-mono font-black tracking-tight ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                <span className="text-sm text-gray-500 ml-1">USDT</span>
              </h3>
            </div>
            <div className={`p-3 rounded-full ${totalPnl >= 0 ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' : 'bg-rose-950/50 text-rose-400 border border-rose-900/50'}`}>
              {totalPnl >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Win Rate */}
          <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" /> Win Rate
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-mono font-black text-white tracking-tight">
                {winRate.toFixed(1)}<span className="text-sm text-gray-500">%</span>
              </h3>
            </div>
            
            {/* Mini progress bar */}
            <div className="mt-3 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>

          {/* Total Trades */}
          <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Total Trades
            </p>
            <h3 className="text-2xl font-mono font-black text-white tracking-tight">
              {totalTrades}
            </h3>
            <p className="text-[10px] text-gray-500 mt-2">Executed this session</p>
          </div>
        </div>

      </div>
    </div>
  );
}
