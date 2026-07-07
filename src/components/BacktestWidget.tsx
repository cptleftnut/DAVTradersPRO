import React, { useState } from 'react';
import { Play, TrendingUp, History, Activity, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export function BacktestWidget() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [limit, setLimit] = useState(1000); // 1000 hours ~ 41 days
  const [strategy, setStrategy] = useState('Momentum Swing Trader');
  const [takeProfit, setTakeProfit] = useState(5.0);
  const [stopLoss, setStopLoss] = useState(2.0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    totalReturnPct: number;
    volatilityPct: number;
    sharpeRatio: number;
    maxDrawdownPct: number;
    tradesCount: number;
    winRate: number;
  } | null>(null);

  const runBacktest = async () => {
    setIsLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/bot/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          interval,
          limit,
          strategy,
          takeProfit,
          stopLoss,
          stopLossType: 'percent'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Backtest failed');
      }
      setResults(data);
      toast.success('Backtest completed successfully');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border-white/10 p-6 flex flex-col h-[400px] overflow-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/50 rounded-xl border border-indigo-800/50">
            <History className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Strategy Backtest</h2>
            <p className="text-xs text-gray-400">Simulate historical performance</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto z-10 space-y-4 custom-scrollbar pr-2">
        {!results && !isLoading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Pair</label>
                <div className="relative">
                  <select 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="SOLUSDT">SOL/USDT</option>
                    <option value="XRPUSDT">XRP/USDT</option>
                    <option value="ADAUSDT">ADA/USDT</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Timeframe</label>
                <div className="relative">
                  <select 
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">History</label>
                <div className="relative">
                  <select 
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value={100}>Last 100 Candles</option>
                    <option value={500}>Last 500 Candles</option>
                    <option value={1000}>Last 1000 Candles</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Strategy</label>
                <div className="relative">
                  <select 
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="Momentum Swing Trader">Momentum Swing</option>
                    <option value="Mean Reversion">Mean Reversion</option>
                    <option value="Trend Following">Trend Following</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Take Profit (%)</label>
                <input 
                  type="number" 
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Stop Loss (%)</label>
                <input 
                  type="number" 
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                  step="0.1"
                />
              </div>
            </div>

            <button 
              onClick={runBacktest}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Run Simulation
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-mono animate-pulse">Running Backtest Simulation...</p>
          </div>
        )}

        {results && !isLoading && (
          <div className="space-y-4 h-full flex flex-col">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Total Return</span>
                <span className={`text-2xl font-mono font-bold ${results.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {results.totalReturnPct >= 0 ? '+' : ''}{results.totalReturnPct.toFixed(2)}%
                </span>
              </div>
              <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Win Rate</span>
                <span className="text-xl font-mono font-bold text-cyan-400">
                  {results.winRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-2"><Activity className="w-3 h-3"/> Total Trades</span>
                <span className="text-sm font-mono text-gray-200">{results.tradesCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> Max Drawdown</span>
                <span className="text-sm font-mono text-rose-400">{results.maxDrawdownPct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-2"><TrendingUp className="w-3 h-3"/> Sharpe Ratio</span>
                <span className="text-sm font-mono text-gray-200">{results.sharpeRatio.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => setResults(null)}
              className="mt-auto w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-colors"
            >
              Configure New Test
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
