import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STRATEGIES = ['Momentum Trading', 'Mean Reversion', 'Simple Moving Average (SMA)', 'High-Frequency Scalper (HFT)', 'Grid Trading Arbitrage'];

export function StrategyBacktester({ currentStrategy, defaultTicker = "BTCUSDT" }: { currentStrategy: string, defaultTicker?: string }) {
  const [ticker, setTicker] = useState(defaultTicker);
  const [strategy, setStrategy] = useState(STRATEGIES.includes(currentStrategy) ? currentStrategy : STRATEGIES[2]);
  const [interval, setInterval] = useState('1d');
  const [loading, setLoading] = useState(false);
  const [backtestData, setBacktestData] = useState<{ date: string; price: number; pnl: number; signal: 'BUY'|'SELL'|'HOLD' }[]>([]);
  const [metrics, setMetrics] = useState<{ totalReturn: number, winRate: number, trades: number, sharpeRatio: number, maxDrawdown: number } | null>(null);

  const performBacktest = async () => {
    if (!ticker) return;
    setLoading(true);
    let finalTicker = ticker;
    if (finalTicker.length >= 2 && !finalTicker.endsWith('USDT') && !finalTicker.endsWith('USDC') && !finalTicker.endsWith('BTC') && !finalTicker.endsWith('ETH')) {
        finalTicker = finalTicker + 'USDT';
        setTicker(finalTicker);
    }
    try {
      const res = await fetch(`/api/backtest-data?symbol=${finalTicker}&interval=${interval}&limit=100`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Kunne ikke hente historiske data for backtest.`);
      }
      const data = await res.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Ingen data returneret for denne ticker og interval. Måske ugyldig ticker?');
      }
      
      let capital = 10;
      let position = 0;
      let tradesCount = 0;
      let wins = 0;
      let buyPrice = 0;
      
      let maxPortfolioValue = 10;
      let maxDrawdown = 0;
      let dailyReturns: number[] = [];
      let previousTotalValue = 10;
      
      const results: { date: string; price: number; pnl: number; signal: 'BUY'|'SELL'|'HOLD' }[] = [];
      
      const prices = data.map((d: any) => parseFloat(d[4]));
      const dates = data.map((d: any) => new Date(d[0]).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}));
      
      for (let i = 0; i < prices.length; i++) {
        const currentPrice = prices[i];
        let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        
        if (i >= 20) {
           if (strategy === 'Simple Moving Average (SMA)') {
             const sma10 = prices.slice(i-10, i).reduce((a:number, b:number) => a+b, 0) / 10;
             const sma20 = prices.slice(i-20, i).reduce((a:number, b:number) => a+b, 0) / 20;
             
             if (sma10 > sma20 && position === 0) signal = 'BUY';
             else if (sma10 < sma20 && position > 0) signal = 'SELL';
           } 
           else if (strategy === 'Momentum Trading') {
             const lookbackPrice = prices[i-5];
             const momentum = (currentPrice - lookbackPrice) / lookbackPrice;
             if (momentum > 0.02 && position === 0) signal = 'BUY';
             else if (momentum < -0.01 && position > 0) signal = 'SELL';
           }
           else if (strategy === 'Mean Reversion') {
             const sma20 = prices.slice(i-20, i).reduce((a:number, b:number) => a+b, 0) / 20;
             if (currentPrice < sma20 * 0.95 && position === 0) signal = 'BUY';
             else if (currentPrice > sma20 * 1.05 && position > 0) signal = 'SELL';
             else if (position > 0 && currentPrice > buyPrice * 1.05) signal = 'SELL'; // take profit
           }
           else if (strategy === 'High-Frequency Scalper (HFT)') {
             const len = prices.slice(0, i + 1).length;
             const subPrices = prices.slice(0, i + 1);
             if (len >= 3) {
               if (subPrices[len - 1] > subPrices[len - 2] && subPrices[len - 2] > subPrices[len - 3] && position === 0) {
                 signal = 'BUY';
               } else if (position > 0 && subPrices[len - 1] < subPrices[len - 2]) {
                 signal = 'SELL';
               }
             }
           }
           else if (strategy === 'Grid Trading Arbitrage') {
             const subPrices = prices.slice(0, i + 1);
             const lookbackIndex = Math.max(0, subPrices.length - 8);
             const refereePrice = subPrices[lookbackIndex];
             if (currentPrice < refereePrice * 0.9985 && position === 0) {
               signal = 'BUY';
             } else if (position > 0 && currentPrice > buyPrice * 1.0015) {
               signal = 'SELL';
             }
           }

           if (signal === 'BUY' && position === 0) {
              position = capital / currentPrice;
              buyPrice = currentPrice;
              capital = 0;
           } else if (signal === 'SELL' && position > 0) {
              capital = position * currentPrice;
              tradesCount++;
              if (currentPrice > buyPrice) wins++;
              position = 0;
           }
        }
        
        const currentTotalValue = position > 0 ? position * currentPrice : capital;
        
        // Metrics Calculation for Max Drawdown and Sharpe
        if (currentTotalValue > maxPortfolioValue) {
           maxPortfolioValue = currentTotalValue;
        }
        const drawdown = (maxPortfolioValue - currentTotalValue) / maxPortfolioValue;
        if (drawdown > maxDrawdown) {
           maxDrawdown = drawdown;
        }
        
        const dailyReturn = (currentTotalValue - previousTotalValue) / previousTotalValue;
        dailyReturns.push(dailyReturn);
        previousTotalValue = currentTotalValue;
        
        results.push({
           date: dates[i],
           price: currentPrice,
           pnl: ((currentTotalValue - 10) / 10) * 100,
           signal
        });
      }
      
      const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const stdDev = Math.sqrt(dailyReturns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / dailyReturns.length);
      const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(365); // Approx annualized sharpe
      
      if (results.length === 0) {
        throw new Error("Ikke nok data til at simulere handler.");
      }

      setBacktestData(results);
      setMetrics({
         totalReturn: results[results.length - 1].pnl,
         winRate: tradesCount > 0 ? Math.round((wins / tradesCount) * 100) : 0,
         trades: tradesCount,
         sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
         maxDrawdown: maxDrawdown * 100
      });
      toast.success('Backtest fuldført på rigtig markedsdata.');
    } catch(err: any) {
      toast.error(err.message || 'Fejl under backtest.');
      setBacktestData([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Play className="size-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Strategy Backtester</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 min-w-0">
           <input 
              type="text" 
              value={ticker} 
              onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white max-w-[100px]"
              placeholder="BTCUSDT"
           />
           <select 
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-white truncate max-w-[150px]"
           >
              {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           <select 
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300 w-[80px]"
           >
              <option value="1h">1 Time</option>
              <option value="4h">4 Timer</option>
              <option value="1d">1 Dag</option>
           </select>
           <button 
              onClick={performBacktest}
              disabled={loading || !ticker}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
           >
              {loading ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
              Kør
           </button>
        </div>
      </div>

      {!metrics ? (
         <div className="h-48 flex flex-col items-center justify-center border border-dashed border-gray-800/50 rounded-2xl bg-gray-950/20">
            <TrendingUp className="size-8 text-gray-700 mb-3" />
            <p className="text-xs text-gray-500 font-mono text-center">Brug historiske data (sidste 100 perioder) <br/> for at teste "{strategy}" effektiviteten.</p>
         </div>
      ) : (
         <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
               <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 truncate">Total PnL</span>
                  <span className={`text-lg font-mono tracking-tight font-bold ${metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                  </span>
               </div>
               <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 truncate">Trades</span>
                  <span className="text-lg font-mono tracking-tight font-bold text-white">
                     {metrics.trades}
                  </span>
               </div>
               <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 truncate">Win Rate</span>
                  <span className={`text-lg font-mono tracking-tight font-bold ${metrics.winRate > 50 ? 'text-emerald-400' : (metrics.winRate === 0 ? 'text-gray-400' : 'text-amber-400')}`}>
                     {metrics.winRate}%
                  </span>
               </div>
               <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 truncate">Max Drawdown</span>
                  <span className="text-lg font-mono tracking-tight font-bold text-rose-400">
                     -{metrics.maxDrawdown.toFixed(2)}%
                  </span>
               </div>
               <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col col-span-2 lg:col-span-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 truncate">Sharpe Ratio</span>
                  <span className={`text-lg font-mono tracking-tight font-bold ${metrics.sharpeRatio > 1 ? 'text-emerald-400' : 'text-white'}`}>
                     {metrics.sharpeRatio.toFixed(2)}
                  </span>
               </div>
            </div>

            <div className="h-64 sm:h-72 w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={backtestData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                     <XAxis 
                        dataKey="date" 
                        stroke="#4b5563" 
                        fontSize={10} 
                        tickMargin={10}
                        minTickGap={20}
                     />
                     <YAxis 
                        stroke="#4b5563" 
                        fontSize={10}
                        tickFormatter={(val) => `${val}%`}
                        yAxisId="pnl"
                     />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#e5e7eb' }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'PnL']}
                     />
                     <Line 
                        yAxisId="pnl"
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="#4f46e5" 
                        strokeWidth={2} 
                        dot={(props) => {
                           const { payload, cx, cy } = props;
                           if (payload.signal === 'BUY') return <circle cx={cx} cy={cy} r={4} fill="#10b981" key={`buy-${cx}`} stroke="none" />;
                           if (payload.signal === 'SELL') return <circle cx={cx} cy={cy} r={4} fill="#f43f5e" key={`sell-${cx}`} stroke="none" />;
                           return <circle cx={cx} cy={cy} r={0} key={`none-${cx}`} />;
                        }}/>
                  </LineChart>
               </ResponsiveContainer>
            </div>
            <div className="flex gap-4 justify-center mt-2 pb-2">
               <span className="flex items-center gap-2 text-[10px] uppercase font-mono text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Køb (Long) Signal
               </span>
               <span className="flex items-center gap-2 text-[10px] uppercase font-mono text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Salg (Exit) Signal
               </span>
            </div>
         </div>
      )}
    </div>
  );
}
