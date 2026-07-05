import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  trend: number;
  volume: number;
}

const ASSET_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
};

export function MarketOverview() {
  const [data, setData] = useState<AssetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [pnlTrend, setPnlTrend] = useState<any[]>([]);

  // Quick Action execution state
  const [executing, setExecuting] = useState(false);
  const [allocation, setAllocation] = useState<number>(100);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('');

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/market-data');
      const result = await response.json();
      
      const formatted = Object.entries(result).map(([key, val]) => ({
        symbol: ASSET_MAP[key] || key.toUpperCase(),
        name: key.charAt(0).toUpperCase() + key.slice(1),
        price: (val as any).usd,
        trend: (Math.random() - 0.45) * 0.1, // Simple simulated trend for visualization
        volume: Math.random() * 1000000, // Simulated volume
      }));
      setData(formatted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Fetch every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'dailySummaries'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            date: doc.data().createdAt?.toDate?.().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'N/A',
            pnl: doc.data().totalPnl || 0
        })).reverse();
        setPnlTrend(data);
    });
    return () => unsubscribe();
  }, []);

  // Auto-select the top-performing asset once data is loaded
  useEffect(() => {
    if (data.length > 0 && !selectedAssetSymbol) {
      const sorted = [...data].sort((a, b) => b.trend - a.trend);
      if (sorted[0]) {
        setSelectedAssetSymbol(sorted[0].symbol);
      }
    }
  }, [data, selectedAssetSymbol]);

  const handleQuickOrder = async (side: 'BUY' | 'SELL') => {
    if (!selectedAssetSymbol) {
      toast.error('Vælg venligst et aktiv først');
      return;
    }

    if (allocation <= 0) {
      toast.error('Ugyldigt beløb');
      return;
    }

    setExecuting(true);
    const pair = selectedAssetSymbol.endsWith('USDT') ? selectedAssetSymbol : `${selectedAssetSymbol}USDT`;

    try {
      const userApiKey = localStorage.getItem('user_binance_api_key') || '';
      const userApiSecret = localStorage.getItem('user_binance_api_secret') || '';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (userApiKey) headers['x-binance-api-key'] = userApiKey;
      if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
      
      const user = auth.currentUser;
      if (user?.uid) {
        headers['x-user-uid'] = user.uid;
      }

      const res = await fetch('/api/trade/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbol: pair,
          side,
          allocation,
          isLiveTrading: isLiveMode
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const isPaper = result.isPaper || !isLiveMode;
        const msg = `${side === 'BUY' ? 'Købt' : 'Solgt'} for $${allocation} USDT af ${selectedAssetSymbol} succesfuldt. ${isPaper ? '(Paper Trading)' : '(Real Trading)'}`;
        
        toast.success(`${side === 'BUY' ? 'Købsordre' : 'Salgsordre'} udført!`, {
          description: msg
        });

        // Dispatch global confirmed event so other UI parts update
        window.dispatchEvent(new CustomEvent('trade-confirmed', {
          detail: {
            ticker: pair,
            side,
            price: result.result?.price || 0
          }
        }));
      } else {
        toast.error('Ordrefejl', {
          description: result.error || 'Kunne ikke gennemføre hurtig handel'
        });
      }
    } catch (err: any) {
      console.error('Error executing quick order:', err);
      toast.error('Netværksfejl', {
        description: err.message || 'Der opstod en fejl under kommunikation med serveren'
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg mb-6" id="market-overview-widget">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Market Overview</h2>
        {isFetching && (
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-mono uppercase">Updating</span>
          </div>
        )}
      </div>

      <div className="mb-6 bg-gray-950 p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Portfolio Trend (30 Days)</h3>
          <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pnlTrend}>
                      <XAxis dataKey="date" hide />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-gray-900)', borderColor: 'var(--color-gray-700)', color: 'var(--color-gray-100)' }} />
                      <Line type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
              </ResponsiveContainer>
          </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading market data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map(asset => (
            <div key={asset.symbol} className="bg-gray-950 p-4 rounded-lg border border-gray-800 transition-colors hover:border-amber-500/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-gray-400">{asset.name}</span>
                <span className={`text-xs flex items-center gap-1 ${asset.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {asset.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {(asset.trend * 100).toFixed(2)}%
                </span>
              </div>
              <div className="text-xl font-mono text-white font-semibold mb-2">
                ${asset.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}
              </div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[asset]}>
                    <Bar dataKey="volume" fill="var(--color-gray-600)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions Panel */}
      {!loading && data.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-800 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="size-4 text-amber-500 animate-pulse" />
                Lyn-handel / Quick execution
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Eksekver lynhurtige markedsordrer på top-aktiver uden at åbne trading-panelet.
              </p>
            </div>

            {/* Live vs Paper Toggle */}
            <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-xl border border-gray-800 self-start sm:self-auto">
              <button
                onClick={() => setIsLiveMode(false)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${!isLiveMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Paper Mode
              </button>
              <button
                onClick={() => {
                  const key = localStorage.getItem('user_binance_api_key');
                  if (!key) {
                    toast.warning('Ingen Binance API-nøgler fundet', {
                      description: 'Hurtig handel vil køre i papirtilstand, indtil du indtaster dine API-nøgler i indstillingerne.'
                    });
                  }
                  setIsLiveMode(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${isLiveMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Live Mode
              </button>
            </div>
          </div>

          {/* Input Parameters & Asset Picker */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-950 p-4 rounded-xl border border-gray-850">
            
            {/* Asset Selection Dropdown */}
            <div className="md:col-span-4 space-y-1.5 w-full">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Aktiv</label>
              <div className="grid grid-cols-3 gap-1.5">
                {data.map(asset => {
                  const isSelected = selectedAssetSymbol === asset.symbol;
                  return (
                    <button
                      key={asset.symbol}
                      onClick={() => setSelectedAssetSymbol(asset.symbol)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold' 
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span className="text-xs font-mono">{asset.symbol}</span>
                      <span className="text-[9px] text-gray-500">${asset.price?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allocation Input & Presets */}
            <div className="md:col-span-4 space-y-1.5 w-full">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Beløb (USDT)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-xs font-mono">$</span>
                <input
                  type="number"
                  value={allocation}
                  onChange={(e) => setAllocation(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg py-1.5 pl-7 pr-3 text-xs text-white font-mono font-bold focus:border-amber-500/50 outline-none"
                  placeholder="Indtast beløb"
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[10, 50, 100, 500].map(val => (
                  <button
                    key={val}
                    onClick={() => setAllocation(val)}
                    className={`py-1 rounded-md text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                      allocation === val 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-gray-900/50 border-gray-850 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buy / Sell Buttons */}
            <div className="md:col-span-4 grid grid-cols-2 gap-2.5 w-full">
              {/* BUY */}
              <button
                onClick={() => handleQuickOrder('BUY')}
                disabled={executing || !selectedAssetSymbol}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 group"
              >
                {executing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <TrendingUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
                )}
                <span>Lyn-Køb</span>
              </button>

              {/* SELL */}
              <button
                onClick={() => handleQuickOrder('SELL')}
                disabled={executing || !selectedAssetSymbol}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 group"
              >
                {executing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <TrendingDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                )}
                <span>Lyn-Salg</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

