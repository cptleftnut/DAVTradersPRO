import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerData {
  symbol: string;
  priceChangePercent: number;
  lastPrice: number;
  volume?: number;
}

export const TickerTape = React.memo(function TickerTape() {
  const [tickers, setTickers] = useState<TickerData[]>([]);

  useEffect(() => {
    let active = true;
    const fetchTickers = async () => {
      try {
        const res = await fetch('/api/market/scan');
        if (!res.ok) throw new Error("Failed to fetch market scan");
        const data = await res.json();
        if (active && data.success && data.allScanned) {
          const formatted = data.allScanned.map((item: any) => ({
            symbol: item.symbol,
            priceChangePercent: parseFloat(item.priceChangePercent),
            lastPrice: parseFloat(item.lastPrice)
          }));
          setTickers(formatted);
        }
      } catch (err) {
        if (String(err).includes('Failed to fetch')) return; console.error("Ticker tape fetch error:", err);
      }
    };
    
    fetchTickers();
    const interval = setInterval(fetchTickers, 30000); // refresh every 30s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (tickers.length === 0) return null;

  return (
    <div className="w-full overflow-hidden bg-gray-950 border-b border-gray-800/60 py-2 relative flex items-center">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none"></div>
      
      <div className="flex space-x-8 whitespace-nowrap animate-marquee">
        {/* Double the array for seamless infinite scrolling loop */}
        {[...tickers, ...tickers].map((ticker, i) => (
          <div key={`${ticker.symbol}-${i}`} className="flex items-center space-x-2">
            <span className="text-gray-300 font-bold font-mono text-xs">{ticker.symbol.replace('USDT', '')}/USDT</span>
            <span className="text-white font-mono text-xs">${ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            <span className={`flex items-center text-[10px] font-bold ${ticker.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ticker.priceChangePercent >= 0 ? <TrendingUp className="size-3 mr-0.5" /> : <TrendingDown className="size-3 mr-0.5" />}
              {ticker.priceChangePercent > 0 ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none"></div>
    </div>
  );
});
