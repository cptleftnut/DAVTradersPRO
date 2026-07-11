import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface OrderBookEntry {
  price: number;
  amt: number;
  total: number;
}

// ⚡ Bolt: Cache Intl.NumberFormat instances outside the component to prevent recreating them on every render
// 🎯 Why: OrderBook receives frequent updates from WebSocket. Re-creating formatting objects and calling .toLocaleString()
// inside the map loop for every ask/bid was causing unnecessary CPU overhead during the render cycle.
// 📊 Impact: Significantly reduces layout calculation time and CPU usage by reusing pre-configured formatter objects.
const priceAmtFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const totalFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const spreadFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });

// ⚡ Bolt: Wrapped in React.memo to prevent unnecessary re-renders when parent components update
export const OrderBook = React.memo(function OrderBook({ symbol = "BTCUSDT" }: { symbol?: string }) {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Move function outside of onmessage handler
  const processEntry = (entry: [string, string]) => {
    const price = parseFloat(entry[0]);
    const amt = parseFloat(entry[1]);
    return { price, amt, total: price * amt };
  };

  useEffect(() => {
    let isActive = true;
    let ws: WebSocket;

    const fetchOrderBook = async () => {
      try {
        setLoading(true);
        // Binance WS orderbook is standard: wss://stream.binance.com:9443/ws/<symbol>@depth20@100ms
        const streamSymbol = symbol.toLowerCase();
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamSymbol}@depth20@100ms`);
        ws.onmessage = (event) => {
          if (!isActive) return;
          const data = JSON.parse(event.data);
          if (data.bids && data.asks) {
            // ⚡ Bolt: Pre-parse string arrays into objects containing numbers here to save CPU cycles
            // during the render loop. This avoids running parseFloat inside the JSX map.
            setBids(data.bids.slice(0, 15).map(processEntry));
            // Reverse asks to show lowest price at the bottom (closest to spread)
            setAsks(data.asks.slice(0, 15).map(processEntry).reverse());
            setLoading(false);
          }
        };
      } catch (err) {
        console.error('Error fetching orderbook', err);
      }
    };

    fetchOrderBook();

    return () => {
      isActive = false;
      if (ws) ws.close();
    };
  }, [symbol]);

  const maxTotal = Math.max(
    ...bids.map(b => b.total),
    ...asks.map(a => a.total),
    1 // fallback
  );

  return (
    <div className="h-full bg-gray-950/80 border border-gray-800/80 rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-800/80">
        <h3 className="font-bold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          Order Book
        </h3>
        <span className="text-xs font-mono text-gray-500 uppercase">{symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, "")} / {symbol.endsWith('USDC') ? 'USDC' : (symbol.endsWith('USDT') ? 'USDT' : (symbol.endsWith('BTC') ? 'BTC' : (symbol.endsWith('ETH') ? 'ETH' : (symbol.endsWith('BNB') ? 'BNB' : (symbol.endsWith('EUR') ? 'EUR' : 'USDT')))))}</span>
      </div>
      
      <div className="flex-1 flex flex-col p-2 min-h-0">
        <div className="grid grid-cols-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 py-1">
          <div className="text-left">Price</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Total</div>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
             <Loader2 className="animate-spin text-gray-600 size-6" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-[2px] custom-scrollbar text-xs font-mono">
            {/* Asks */}
            <div className="flex flex-col gap-[1px]">
              {asks.map((ask, i) => {
                const { price, amt, total } = ask;
                const width = (total / maxTotal) * 100;
                return (
                  <div key={`ask-${i}`} className="relative grid grid-cols-3 px-2 py-0.5 group hover:bg-gray-800/50">
                     <div className="absolute top-0 bottom-0 right-0 bg-red-500/10" style={{ width: `${width}%` }}></div>
                     <div className="text-red-400 z-10">{priceAmtFormatter.format(price)}</div>
                     <div className="text-gray-300 text-right z-10">{priceAmtFormatter.format(amt)}</div>
                     <div className="text-gray-500 text-right z-10">{totalFormatter.format(total)}</div>
                  </div>
                )
              })}
            </div>
            
            {/* Spread / Mid Market */}
            <div className="py-2 px-2 flex justify-between items-center text-gray-400 border-y border-gray-800/50 my-1 bg-gray-900/30">
               <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Spread</span>
               {asks.length > 0 && bids.length > 0 && (
                 <span className="text-amber-400/80 font-bold">
                   {spreadFormatter.format(asks[asks.length-1].price - bids[0].price)}
                 </span>
               )}
            </div>

            {/* Bids */}
            <div className="flex flex-col gap-[1px]">
              {bids.map((bid, i) => {
                const { price, amt, total } = bid;
                const width = (total / maxTotal) * 100;
                return (
                  <div key={`bid-${i}`} className="relative grid grid-cols-3 px-2 py-0.5 group hover:bg-gray-800/50">
                     <div className="absolute top-0 bottom-0 right-0 bg-emerald-500/10" style={{ width: `${width}%` }}></div>
                     <div className="text-emerald-400 z-10">{priceAmtFormatter.format(price)}</div>
                     <div className="text-gray-300 text-right z-10">{priceAmtFormatter.format(amt)}</div>
                     <div className="text-gray-500 text-right z-10">{totalFormatter.format(total)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
