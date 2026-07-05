import React from 'react';
import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ArrowRight, Loader2, RefreshCw, AlertCircle, Clock, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScannerChatBubble } from './ScannerChatBubble';

const TOP_CRYPTO_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDC', 'BNBUSDT', 'XRPUSDT', 
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'LTCUSDT', 
  'SHIBUSDT', 'BCHUSDT', 'DOTUSDT', 'NEARUSDT', 'UNIUSDT', 
  'ATOMUSDT', 'XLMUSDT', 'APTUSDT', 'FILUSDT', 'RNDRUSDT'
];

interface ScannerAlert {
  symbol: string;
  rsi: number;
  condition: 'Oversold' | 'Overbought';
  price: number;
}

interface ArchivedAlert extends ScannerAlert {
  id: string;
  timestamp: Date;
}

export const MarketScanner = React.memo(function MarketScanner({ onSelectPair }: { onSelectPair?: (symbol: string) => void }) {
  const [activeTab, setActiveTab] = useState<'live' | 'archive'>('live');
  const [alerts, setAlerts] = useState<ScannerAlert[]>([]);
  const [archivedAlerts, setArchivedAlerts] = useState<ArchivedAlert[]>(() => {
    try {
      const stored = localStorage.getItem('binance_scanner_archive');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) }));
        }
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getBadgeInfo = (alert: ScannerAlert) => {
    if (alert.condition === 'Oversold') {
      if (alert.rsi < 20) {
        return {
          label: 'Strongly Oversold',
          colorClass: 'text-emerald-400',
          borderClass: 'border-emerald-500/50',
          bgClass: 'bg-emerald-950/60',
          icon: <AlertCircle className="size-3 text-emerald-400" />
        };
      } else {
        return {
          label: 'Mildly Oversold',
          colorClass: 'text-emerald-500/90',
          borderClass: 'border-emerald-700/30',
          bgClass: 'bg-emerald-950/30',
          icon: <AlertCircle className="size-3 text-emerald-500/90" />
        };
      }
    } else {
      if (alert.rsi > 80) {
        return {
          label: 'Strongly Overbought',
          colorClass: 'text-rose-400',
          borderClass: 'border-rose-500/50',
          bgClass: 'bg-rose-950/60',
          icon: <AlertTriangle className="size-3 text-rose-400" />
        };
      } else {
        return {
          label: 'Mildly Overbought',
          colorClass: 'text-rose-500/90',
          borderClass: 'border-rose-700/30',
          bgClass: 'bg-rose-950/30',
          icon: <AlertTriangle className="size-3 text-rose-500/90" />
        };
      }
    }
  };

  const calculateRSI = (prices: number[], period: number = 14) => {
    if (prices.length <= period) return 50;
    
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;
        
        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const scanMarkets = async () => {
    setLoading(true);
    const newAlerts: ScannerAlert[] = [];
    
    await Promise.all(
      TOP_CRYPTO_PAIRS.map(async (symbol) => {
        try {
          const res = await fetch(`/api/binance-proxy/klines?symbol=${symbol}&interval=1h&limit=50`);
          if (res.ok) {
            const data = await res.json();
            if (!Array.isArray(data)) return;
            const closes = data.map((d: any) => parseFloat(d[4]));
            if (closes.length > 20) {
                const rsi = calculateRSI(closes, 14);
                const currentPrice = closes[closes.length - 1];
                
                if (rsi < 30) {
                    newAlerts.push({ symbol, rsi, condition: 'Oversold', price: currentPrice });
                } else if (rsi > 70) {
                    newAlerts.push({ symbol, rsi, condition: 'Overbought', price: currentPrice });
                }
            }
          }
        } catch (e) {
            // Silently ignore failed symbols
        }
      })
    );

    // Sort alerts: most extreme RSI first (furthest from 50)
    newAlerts.sort((a, b) => Math.abs(50 - b.rsi) - Math.abs(50 - a.rsi));
    
    setAlerts(prevAlerts => {
       const now = new Date();
       const newArchived: ArchivedAlert[] = [];
       
       newAlerts.forEach(na => {
          // Check if this symbol/condition was already active in the previous scan
          const wasActive = prevAlerts.some(pa => pa.symbol === na.symbol && pa.condition === na.condition);
          if (!wasActive) {
             newArchived.push({
                ...na,
                id: Math.random().toString(36).substring(2, 11),
                timestamp: now
             });
          }
       });

       if (newArchived.length > 0) {
          setArchivedAlerts(prev => {
             // Keep only last 24 hours
             const ms24h = 24 * 60 * 60 * 1000;
             const filtered = [...newArchived, ...prev].filter(a => now.getTime() - a.timestamp.getTime() < ms24h);
             localStorage.setItem('binance_scanner_archive', JSON.stringify(filtered));
             return filtered;
          });
       }
       return newAlerts;
    });

    setLastUpdated(new Date());
    setLoading(false);
  };

  const [isTabActive, setIsTabActive] = useState(() => typeof document !== 'undefined' ? !document.hidden : true);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    scanMarkets();
    const interval = setInterval(scanMarkets, isTabActive ? 5 * 60 * 1000 : 15 * 60 * 1000); // 5 minutes active, 15 minutes inactive
    return () => clearInterval(interval);
  }, [isTabActive]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl relative">
       <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
               <Activity className="size-5 md:size-6" />
             </div>
             <div>
               <div className="flex items-center gap-4 mb-1">
                 <h2 className="text-white font-bold tracking-tight text-lg">Market Scanner</h2>
                 <div className="flex bg-gray-950 rounded-lg p-0.5 border border-gray-800">
                    <button 
                       onClick={() => setActiveTab('live')}
                       className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${activeTab === 'live' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                       Live
                    </button>
                    <button 
                       onClick={() => setActiveTab('archive')}
                       className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${activeTab === 'archive' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                       Historik (24T)
                    </button>
                 </div>
               </div>
               <p className="text-gray-400 text-xs">
                 {activeTab === 'live' ? 'Aktiv RHS scanning på top 20 crypto aktiver (1t interval)' : 'Arkiv over overkøbte og oversolgte signaler fra de seneste 24 timer'}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {lastUpdated && (
                <span className="text-[10px] sm:text-xs text-gray-500 font-mono">
                   Sidst opdateret: {lastUpdated.toLocaleTimeString()}
                </span>
             )}
             <button 
               onClick={scanMarkets}
               disabled={loading}
               className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors"
             >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-900/50">
          {activeTab === 'live' ? (
             <>
                {loading && alerts.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-48 space-y-4">
                      <Loader2 className="size-8 text-purple-500 animate-spin" />
                      <p className="text-sm text-gray-500 font-mono animate-pulse">Analyserer kurser og udregner RSI...</p>
                   </div>
                ) : alerts.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-gray-900 border border-dashed border-gray-800 rounded-xl text-gray-500">
                      <Activity className="size-8 opacity-50" />
                      <p className="text-sm font-medium">Ingen aktiver er overkøbte/oversolgte lige nu</p>
                      <span className="text-xs font-mono">Prøv igen senere (RSI er mellem 30 og 70 for alle)</span>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                         {alerts.map((alert) => (
                            <motion.div
                               key={alert.symbol}
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               exit={{ opacity: 0, scale: 0.9 }}
                               className={`p-4 rounded-xl border relative overflow-hidden group transition-colors cursor-pointer ${
                                  alert.condition === 'Oversold' 
                                     ? 'bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-900/20 hover:border-emerald-700/50' 
                                     : 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-900/20 hover:border-rose-700/50'
                               }`}
                               onClick={() => onSelectPair && onSelectPair(alert.symbol)}
                            >
                               <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ArrowRight className="size-4 text-gray-400" />
                               </div>
                               <div className="flex justify-between items-start mb-3">
                                  <div>
                                     <h3 className="text-lg font-black tracking-widest text-white">{alert.symbol.replace('USDT', '')}</h3>
                                     <p className="text-cyan-400 font-mono text-sm">${alert.price.toFixed(4).replace(/\.?0+$/, '')}</p>
                                  </div>
                                  {(() => {
                                     const badge = getBadgeInfo(alert);
                                     return (
                                        <div className={`px-2 py-1 rounded border flex items-center gap-1.5 ${badge.bgClass} ${badge.borderClass}`}>
                                           {badge.icon}
                                           <span className={`text-[10px] font-bold uppercase tracking-wider ${badge.colorClass}`}>
                                              {badge.label}
                                           </span>
                                        </div>
                                     );
                                  })()}
                               </div>
                               
                               <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                                  <span className="text-xs text-gray-500 font-medium">1H RSI</span>
                                  <span className={`text-xl font-black font-mono ${
                                     alert.condition === 'Oversold' ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                     {alert.rsi.toFixed(1)}
                                  </span>
                               </div>
                            </motion.div>
                         ))}
                      </AnimatePresence>
                   </div>
                )}
             </>
          ) : (
             <div className="space-y-4">
                {archivedAlerts.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-gray-900 border border-dashed border-gray-800 rounded-xl text-gray-500">
                      <History className="size-8 opacity-50" />
                      <p className="text-sm font-medium">Ingen gemte signaler de seneste 24 timer</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {archivedAlerts.map(alert => (
                         <div
                            key={alert.id}
                            className={`p-4 rounded-xl border relative overflow-hidden transition-colors ${
                               alert.condition === 'Oversold' 
                                  ? 'bg-emerald-950/10 border-emerald-900/40' 
                                  : 'bg-rose-950/10 border-rose-900/40'
                            }`}
                         >
                            <div className="flex justify-between items-start mb-3">
                               <div>
                                  <h3 className="text-lg font-black tracking-widest text-white">{alert.symbol.replace('USDT', '')}</h3>
                                  <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[10px]">
                                     <Clock className="size-3" />
                                     {alert.timestamp.toLocaleTimeString()}
                                  </div>
                               </div>
                               {(() => {
                                  const badge = getBadgeInfo(alert);
                                  return (
                                     <div className={`px-2 py-1 rounded border flex items-center gap-1.5 ${badge.bgClass} ${badge.borderClass}`}>
                                        {badge.icon}
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${badge.colorClass}`}>
                                           {badge.label}
                                        </span>
                                     </div>
                                  );
                               })()}
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                               <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 font-medium">PRIS VED SIGNAL</span>
                                  <span className="text-sm text-cyan-400 font-mono">${alert.price.toFixed(4).replace(/\.?0+$/, '')}</span>
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-gray-500 font-medium">1H RSI</span>
                                  <span className={`text-sm font-black font-mono ${
                                     alert.condition === 'Oversold' ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                     {alert.rsi.toFixed(1)}
                                  </span>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          )}
       </div>
    </div>
  );
});

