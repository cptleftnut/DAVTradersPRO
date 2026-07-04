import { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, AlertTriangle, Loader2, ArrowUp, ArrowDown, Minus, Eye, EyeOff, X, ZoomIn, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function MarketCorrelation() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [correlationData, setCorrelationData] = useState<Record<string, Record<string, { value: number, trend: 'up' | 'down' | 'flat', pValue: number, timestamp: number }>>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'30D' | '90D' | '1Y'>('30D');
  const [highlightTop, setHighlightTop] = useState(false);
  const [zoomedPair, setZoomedPair] = useState<{t1: string, t2: string} | null>(null);

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const topCorrelations = useMemo(() => {
    if (!highlightTop) return null;
    
    const pairs: { t1: string, t2: string, value: number }[] = [];
    const availableTickers = Object.keys(correlationData);
    
    for (let i = 0; i < availableTickers.length; i++) {
      for (let j = i + 1; j < availableTickers.length; j++) {
        const t1 = availableTickers[i];
        const t2 = availableTickers[j];
        const val = correlationData[t1]?.[t2]?.value;
        if (val !== undefined) {
          pairs.push({ t1, t2, value: val });
        }
      }
    }
    
    // Sort by physical value
    const sortedPos = [...pairs].sort((a, b) => b.value - a.value);
    const sortedNeg = [...pairs].sort((a, b) => a.value - b.value);
    
    // Top 3 positive
    const posPairs = sortedPos.slice(0, 3);
    // Top 3 negative
    const negPairs = sortedNeg.slice(0, 3);
    
    return [...posPairs, ...negPairs].reduce((acc, pair) => {
        acc[`${pair.t1}-${pair.t2}`] = true;
        acc[`${pair.t2}-${pair.t1}`] = true;
        return acc;
    }, {} as Record<string, boolean>);
  }, [correlationData, highlightTop]);

  useEffect(() => {
    let watchList: string[] = [];
    try {
      const stored = localStorage.getItem('watchlist');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) watchList = parsed;
      }
    } catch (e) {}

    // Ensure we have at least some default crypto pairs if empty or very small, as Binance only accepts proper symbols.
    // Also limit it to max 6-8 to avoid UI clutter
    if (!watchList || watchList.length < 2) {
      const defaults = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
      watchList = Array.from(new Set([...watchList, ...defaults]));
    }
    watchList = watchList.slice(0, 8); // Max 8 assets for the grid
    setTickers(watchList);
  }, []);

  const [isTabActive, setIsTabActive] = useState(() => typeof document !== 'undefined' ? !document.hidden : true);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (tickers.length === 0) return;

    let isActive = true;
    const fetchMatrix = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      else setIsRefreshing(true);
      setError(null);
      try {
        const returnsData: Record<string, number[]> = {};

        let limit = 30;
        if (period === '90D') limit = 90;
        else if (period === '1Y') limit = 365;

        // Fetch prices concurrently
        await Promise.all(
          tickers.map(async (ticker) => {
            try {
              const res = await fetch(`/api/binance-proxy/klines?symbol=${ticker}&interval=1d&limit=${limit}`);
              if (res.ok) {
                const data = await res.json();
                const prices: number[] = data.map((d: any) => parseFloat(d[4])); // Closing prices
                
                // Calculate percentage returns
                const returns: number[] = [];
                for (let i = 1; i < prices.length; i++) {
                  returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
                }
                returnsData[ticker] = returns;
              }
            } catch (err) {
              // Ignore failed tickers
            }
          })
        );

        if (!isActive) return;

        // Ensure all have same length
        const minLen = Math.min(...Object.values(returnsData).map(arr => arr.length));
        if (minLen === Infinity || minLen < 5) {
           throw new Error('Not enough valid market data to calculate correlation.');
        }

        // Calculate correlation matrix
        const matrix: Record<string, Record<string, { value: number, trend: 'up' | 'down' | 'flat', pValue: number, timestamp: number }>> = {};
        const availableTickers = Object.keys(returnsData);
        const currentTimestamp = Date.now();
        
        availableTickers.forEach((t1) => {
          matrix[t1] = {};
          availableTickers.forEach((t2) => {
            if (t1 === t2) {
              matrix[t1][t2] = { value: 1, trend: 'flat', pValue: 0, timestamp: currentTimestamp };
            } else {
              const r1 = returnsData[t1].slice(0, minLen);
              const r2 = returnsData[t2].slice(0, minLen);
              const overall = getPearsonCorrelation(r1, r2);
              const pValue = getPValue(overall, minLen);

              const mid = Math.floor(minLen / 2);
              const older1 = r1.slice(0, mid);
              const older2 = r2.slice(0, mid);
              const recent1 = r1.slice(mid);
              const recent2 = r2.slice(mid);

              const olderCorr = getPearsonCorrelation(older1, older2);
              const recentCorr = getPearsonCorrelation(recent1, recent2);

              let trend: 'up' | 'down' | 'flat' = 'flat';
              if (Math.abs(recentCorr) > Math.abs(olderCorr) + 0.05) {
                trend = 'up'; // Strengthening
              } else if (Math.abs(recentCorr) < Math.abs(olderCorr) - 0.05) {
                trend = 'down'; // Weakening
              }
              
              matrix[t1][t2] = { value: overall, trend, pValue, timestamp: currentTimestamp };
            }
          });
        });

        // Filter tickers to only those we successfully fetched
        setTickers(availableTickers);
        setCorrelationData(matrix);
      } catch (err: any) {
        if (isActive && !isBackground) setError(err.message || 'Error fetching correlation data');
      } finally {
        if (isActive) {
           if (!isBackground) setLoading(false);
           else setIsRefreshing(false);
        }
      }
    };

    fetchMatrix(false);

    // Refresh every 30 seconds active, 5 mins inactive
    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        fetchMatrix(true);
      }
    }, isTabActive ? 30000 : 300000);

    return () => { 
      isActive = false; 
      clearInterval(interval);
    };
  }, [tickers.length === 0, period, isTabActive]); 

  // Approximation of 2-tailed P-value for Pearson correlation
  const getPValue = (r: number, n: number) => {
    if (Math.abs(r) === 1) return 0;
    const t = Math.abs(r) * Math.sqrt((n - 2) / (1 - r * r));
    const z = t;
    const x = z / Math.sqrt(2);
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p =  0.3275911;
    const absX = Math.abs(x);
    const t2 = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t2 + a4) * t2) + a3) * t2 + a2) * t2 + a1) * t2 * Math.exp(-x * x);
    return 1 - y;
  };

  // Pearson Correlation Coefficient calculation
  const getPearsonCorrelation = (x: number[], y: number[]) => {
    const n = x.length;
    if (n === 0) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(Math.max(0, n * sumX2 - sumX * sumX) * Math.max(0, n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getColor = (value: number) => {
    if (value === 1) return 'bg-blue-500/80 text-white'; // Exact match
    if (value > 0.8) return 'bg-blue-600/60 text-white'; // Strong Positive
    if (value > 0.4) return 'bg-blue-700/40 text-gray-200'; // Moderate Positive
    if (value > 0.1) return 'bg-blue-900/40 text-gray-400'; // Weak Positive
    if (value >= -0.1 && value <= 0.1) return 'bg-gray-800 text-gray-500'; // Neutral
    if (value < -0.8) return 'bg-red-700/80 text-white'; // Strong Negative
    if (value < -0.4) return 'bg-red-800/60 text-gray-200'; // Moderate Negative
    return 'bg-red-900/40 text-gray-400'; // Weak Negative
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-fuchsia-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Market Correlation</h2>
          
          <div className="flex items-center gap-2 ml-2">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isPaused ? 'bg-orange-500/20 border-orange-500/50' : isRefreshing ? 'bg-fuchsia-500/20 border-fuchsia-500/50' : 'bg-gray-800 border-gray-700'}`}>
               <div className={`size-1.5 rounded-full ${isPaused ? 'bg-orange-400' : isRefreshing ? 'bg-fuchsia-400 animate-pulse' : 'bg-emerald-400'}`}></div>
               <span className={`text-[8px] uppercase tracking-widest font-bold ${isPaused ? 'text-orange-400' : isRefreshing ? 'text-fuchsia-400' : 'text-gray-400'}`}>
                   {isPaused ? 'Paused' : isRefreshing ? 'Updating...' : 'Live'}
               </span>
            </div>
            
            <button
               onClick={() => setIsPaused(!isPaused)}
               className={`p-1 rounded-md transition-colors ${isPaused ? 'text-orange-400 hover:bg-orange-500/20' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
               title={isPaused ? "Resume Refresh" : "Pause Refresh"}
            >
               {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
             onClick={() => setHighlightTop(!highlightTop)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${highlightTop ? 'bg-fuchsia-600/20 border-fuchsia-500/50 text-fuchsia-400' : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'}`}
             title="Highlight Top 3 Correlations"
          >
             {highlightTop ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
             Top 3
          </button>
          
          <div className="flex bg-gray-950/50 p-1 rounded-lg border border-gray-800/50">
            {(['30D', '90D', '1Y'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 flex-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors ${period === p ? 'bg-fuchsia-600/20 text-fuchsia-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex flex-col items-center justify-center p-8 text-center text-gray-400">
           <Loader2 className="size-8 text-fuchsia-500 animate-spin mb-4" />
           <p className="text-xs uppercase font-bold tracking-widest">Calculating Matrix...</p>
        </div>
      ) : error ? (
        <div className="h-48 flex flex-col items-center justify-center p-8 text-center text-rose-400 border border-dashed border-rose-900/50 rounded-2xl bg-rose-950/20">
           <AlertTriangle className="size-8 mb-3 opacity-50" />
           <p className="text-xs font-mono">{error}</p>
        </div>
      ) : tickers.length < 2 ? (
        <div className="h-48 flex flex-col items-center justify-center p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-950/20">
           <p className="text-xs font-mono">Not enough valid assets to calculate correlation.</p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-fit">
              <div className="flex mb-1">
                <div className="w-16 sm:w-20"></div> {/* Empty corner */}
                {tickers.map(t => (
                  <div key={`header-${t}`} className="w-12 sm:w-16 text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate px-1">
                    {t.replace('USDT','')}
                  </div>
                ))}
              </div>
              
              <AnimatePresence mode="popLayout">
                {tickers.map((t1, rowIdx) => (
                  <motion.div 
                    key={`row-${period}-${t1}`} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: rowIdx * 0.05, duration: 0.3 }}
                    className="flex items-center mb-1 gap-1"
                  >
                    <div className="w-16 sm:w-20 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate pr-2 text-right">
                      {t1.replace('USDT','')}
                    </div>
                    {tickers.map((t2, colIdx) => {
                      const data = correlationData[t1]?.[t2];
                      if (!data) {
                          return <div key={`cell-${t1}-${t2}`} className="w-12 sm:w-16 h-8 sm:h-10 bg-gray-800/50 rounded border border-gray-800"></div>;
                      }
                      
                      const isHighlighted = highlightTop && topCorrelations ? topCorrelations[`${t1}-${t2}`] : true;
                      const isSelf = t1 === t2;
                      const opacityClass = (highlightTop && !isHighlighted && !isSelf) ? 'opacity-20 grayscale saturate-0 pointer-events-none' : 'opacity-100';

                      return (
                        <div 
                           key={`cell-${t1}-${t2}`} 
                           className={`group relative w-12 sm:w-16 h-8 sm:h-10 rounded flex items-center justify-center border border-gray-800/50 transition-all duration-500 text-[10px] sm:text-xs font-mono cursor-pointer hover:border-gray-400/50 hover:shadow-lg hover:z-10 ${getColor(data.value)} gap-1 ${opacityClass}`}
                           onClick={() => setZoomedPair({ t1, t2 })}
                        >
                          <span>{data.value.toFixed(2)}</span>
                          {t1 !== t2 && (
                            <span className={`flex items-center justify-center ${data.trend === 'up' ? 'text-emerald-400' : data.trend === 'down' ? 'text-rose-400' : 'text-gray-400'}`}>
                              {data.trend === 'up' ? <ArrowUp className="size-3" strokeWidth={3} /> : data.trend === 'down' ? <ArrowDown className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
                            </span>
                          )}
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-gray-950 border border-gray-700 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50 w-max flex flex-col items-center">
                             <span className="text-[10px] text-gray-400 font-sans tracking-widest uppercase mb-1">{t1.replace('USDT','')} <span className="text-gray-600 mx-1">vs</span> {t2.replace('USDT','')}</span>
                             <span className="text-sm font-mono font-bold text-white">{data.value.toFixed(3)}</span>
                             {t1 !== t2 && (
                               <>
                                 <span className="text-[9px] mt-1.5 text-gray-400 font-mono">P-value: <span className={data.pValue < 0.05 ? 'text-emerald-400' : 'text-gray-500'}>{data.pValue < 0.001 ? '< 0.001' : data.pValue.toFixed(3)}</span></span>
                                 <span className="text-[9px] mt-1 uppercase tracking-widest font-bold text-gray-500">
                                   {data.trend === 'up' ? 'Strengthening' : data.trend === 'down' ? 'Weakening' : 'Stable'}
                                 </span>
                               </>
                             )}
                             <span className="text-[8px] mt-1.5 text-gray-500 font-mono">Updated: {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(data.timestamp))}</span>
                             <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-700"></div>
                             <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-4 border-transparent border-t-gray-950"></div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col mt-8 pt-6 border-t border-gray-800/50">
               <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4 text-center sm:text-left">Correlation Legend</span>
               <div className="flex w-full items-stretch justify-between gap-2 overflow-x-auto custom-scrollbar pb-2">
                 
                 <div className="flex flex-col gap-1.5 items-center min-w-[55px]">
                    <div className="w-full h-2 rounded bg-red-700/80"></div>
                    <span className="text-[9px] text-gray-400 font-mono font-bold">-1.0 to -0.8</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest text-center">Strong Neg</span>
                 </div>

                 <div className="flex flex-col gap-1.5 items-center min-w-[55px]">
                    <div className="w-full h-2 rounded bg-red-800/60"></div>
                    <span className="text-[9px] text-gray-400 font-mono font-bold">-0.8 to -0.4</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest text-center">Mod Neg</span>
                 </div>

                 <div className="flex flex-col gap-1.5 items-center min-w-[55px]">
                    <div className="w-full h-2 rounded bg-red-900/40"></div>
                    <span className="text-[9px] text-gray-400 font-mono font-bold">-0.4 to -0.1</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest text-center">Weak Neg</span>
                 </div>

                 <div className="flex flex-col gap-1.5 items-center min-w-[55px]">
                    <div className="w-full h-2 rounded bg-gray-800"></div>
                    <span className="text-[9px] text-gray-400 font-mono font-bold">-0.1 to +0.1</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest text-center">Neutral</span>
                 </div>

                 <div className="flex flex-col gap-1.5 items-center min-w-[55px]">
                    <div className="w-full h-2 rounded bg-blue-900/40"></div>
                    <span className="text-[9px] text-gray-400 font-mono font-bold">+0.1 to +0.4</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest text-center">Weak Pos</span>
                 </div>

                 <div className="flex flex-col gap-1.5 items-center min-w-[55px]">
                    <div className="w-full h-2 rounded bg-blue-700/40"></div>
                    <span className="text-[9px] text-gray-400 font-mono font-bold">+0.4 to +0.8</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest text-center">Mod Pos</span>
                 </div>

                 <div className="flex flex-col gap-1.5 items-center min-w-[55px]">
                    <div className="w-full h-2 rounded bg-blue-500/80"></div>
                    <span className="text-[9px] text-gray-400 font-mono font-bold">+0.8 to +1.0</span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest text-center">Strong Pos</span>
                 </div>

               </div>
            </div>
        </div>
      )}

      {/* Expanded / Zoomed Modal */}
      <AnimatePresence>
        {zoomedPair && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4"
            onClick={() => setZoomedPair(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
               <button 
                  onClick={() => setZoomedPair(null)} 
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
               >
                 <X className="size-5" />
               </button>

               <div className="flex items-center gap-3 mb-8 bg-gray-950/50 p-3 rounded-2xl border border-gray-800/50 justify-center">
                  <div className="flex items-center gap-2">
                     <span className="text-xl font-bold text-white uppercase tracking-widest">{zoomedPair.t1.replace('USDT','')}</span>
                     <span className="text-xs text-gray-500 font-mono">VS</span>
                     <span className="text-xl font-bold text-white uppercase tracking-widest">{zoomedPair.t2.replace('USDT','')}</span>
                  </div>
               </div>

               {(() => {
                 const data = correlationData[zoomedPair.t1]?.[zoomedPair.t2];
                 if (!data) return <p className="text-center text-gray-500">Data unavailable</p>;

                 return (
                   <div className="flex flex-col gap-6">
                      <div className="flex flex-col items-center justify-center p-6 bg-gray-950 rounded-2xl border border-gray-800 shadow-inner">
                         <span className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2 text-center">Pearson Correlation<br />({period})</span>
                         <div className={`text-5xl font-mono font-bold tracking-tighter ${getColor(data.value).split(' ')[1] || 'text-white'}`}>
                            {data.value.toFixed(3)}
                         </div>
                      </div>

                      {zoomedPair.t1 !== zoomedPair.t2 && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-950 rounded-xl border border-gray-800">
                               <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Trend</span>
                               <span className={`flex items-center gap-1 text-sm font-bold uppercase tracking-widest ${data.trend === 'up' ? 'text-emerald-400' : data.trend === 'down' ? 'text-rose-400' : 'text-gray-400'}`}>
                                  {data.trend === 'up' ? <ArrowUp className="size-4" strokeWidth={3} /> : data.trend === 'down' ? <ArrowDown className="size-4" strokeWidth={3} /> : <Minus className="size-4" strokeWidth={3} />}
                                  {data.trend === 'up' ? 'Strengthening' : data.trend === 'down' ? 'Weakening' : 'Stable'}
                               </span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-950 rounded-xl border border-gray-800">
                               <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Significance</span>
                               <span className={`text-sm font-bold uppercase tracking-widest ${data.pValue < 0.05 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                  {data.pValue < 0.001 ? '< 0.001' : data.pValue.toFixed(3)}
                               </span>
                               <span className="text-[8px] text-gray-600 mt-1 uppercase tracking-widest">(P-Value)</span>
                            </div>
                         </div>
                      )}
                   </div>
                 );
               })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
