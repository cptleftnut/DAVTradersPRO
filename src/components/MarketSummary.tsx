import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface Ticker {
    symbol: string;
    priceChangePercent: string;
    quoteVolume: string;
}

export const MarketSummary: React.FC = () => {
    const [tickers, setTickers] = useState<Ticker[]>([]);
    const [apiHealth, setApiHealth] = useState<{status: 'loading' | 'ok' | 'invalid' | 'missing'}>({status: 'loading'});

    useEffect(() => {
        const fetchApiHealth = async () => {
            try {
                const userApiKey = localStorage.getItem('user_binance_api_key');
                const userApiSecret = localStorage.getItem('user_binance_api_secret');
                const headers: any = {};
                if (userApiKey) headers['x-binance-api-key'] = userApiKey;
                if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
                const res = await fetch('/api/binance/health', { headers });
                const data = await res.json();
                setApiHealth({ status: data.status });
            } catch (e) {
                setApiHealth({ status: 'invalid' });
            }
        };
        fetchApiHealth();
        const fetchTickers = async () => {
            try {
                const response = await fetch('/api/market-data');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTickers(data.slice(0, 4));
                }
            } catch (e: any) {
                if (String(e).includes('Failed to fetch')) return;
                console.error("Failed to fetch market data", e);
            }
        };
        fetchTickers();
        const interval = setInterval(fetchTickers, 30000); // 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div id="market-summary-header" className="bg-gray-950 border-b border-gray-800 p-3 flex flex-wrap gap-4 text-xs font-mono justify-center sm:justify-start">
            {tickers.map(ticker => (
                <div key={ticker.symbol} className="flex items-center gap-2">
                    <span className="font-bold text-gray-300">{ticker.symbol.replace('USDT', '')}</span>
                    <span className={parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {parseFloat(ticker.priceChangePercent).toFixed(2)}%
                    </span>
                    <span className="text-gray-500">${(parseFloat(ticker.quoteVolume) / 1000000).toFixed(1)}M</span>
                </div>
            ))}

            <div className="ml-auto flex items-center gap-2 pr-4">
               <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${apiHealth.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                  <Activity className="size-3" />
                  <span className="font-bold uppercase tracking-widest text-[9px]">
                    {apiHealth.status === 'ok' ? 'Binance API: Connected' : 'Binance API: Disconnected'}
                  </span>
               </div>
            </div>
        </div>
    );
};
