import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg mb-6">
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
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
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
                    <Bar dataKey="volume" fill="#4b5563" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
