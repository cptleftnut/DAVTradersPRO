import React, { useState, useEffect } from 'react';
import { Scale, RefreshCw, ArrowRight, TrendingUp } from 'lucide-react';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

interface Holding {
  asset: string;
  weight: number;
  targetWeight: number;
  value: number;
  currentQty: number;
  price: number;
}

export const RebalanceSuggestion: React.FC = () => {
  const [walletData, setWalletData] = useState<any>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState("Balanceret");
  
  const targets = {
    "Høj Risiko": [
      { asset: "BTC", targetWeight: 45 },
      { asset: "ETH", targetWeight: 30 },
      { asset: "SOL", targetWeight: 20 },
      { asset: "USDT", targetWeight: 5 },
    ],
    "Balanceret": [
      { asset: "BTC", targetWeight: 35 },
      { asset: "ETH", targetWeight: 25 },
      { asset: "SOL", targetWeight: 10 },
      { asset: "USDT", targetWeight: 30 },
    ],
    "Lidt Risiko": [
      { asset: "BTC", targetWeight: 20 },
      { asset: "ETH", targetWeight: 15 },
      { asset: "SOL", targetWeight: 5 },
      { asset: "USDT", targetWeight: 60 },
    ]
  };

  const fetchWalletAndCalculate = async () => {
    setLoading(true);
    try {
      const userApiKey = localStorage.getItem('user_binance_api_key');
      const userApiSecret = localStorage.getItem('user_binance_api_secret');
      const headers: any = {};
      if (userApiKey) headers['x-binance-api-key'] = userApiKey;
      if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
      if (auth.currentUser?.uid) headers['x-user-uid'] = auth.currentUser.uid;
      
      const res = await fetch(`/api/binance/wallet?live=false`, { headers });
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
        
        let newHoldings: Holding[] = [];
        let totalUsdtValue = 0;
        
        const relevantAssets = data.spot.filter(
          (s: any) => parseFloat(s.free) > 0 || parseFloat(s.locked) > 0
        );
        
        const activeTargets = targets[userProfile as keyof typeof targets] || targets["Balanceret"];
        
        for (const s of relevantAssets) {
          const qty = parseFloat(s.free) + parseFloat(s.locked);
          let price = 1;
          
          if (s.asset !== "USDT" && s.asset !== "USDC") {
            try {
              const pRes = await fetch(`/api/binance-proxy/ticker/price?symbol=${s.asset}USDT`);
              if (pRes.ok) {
                const json = await pRes.json();
                price = parseFloat(json.price);
              }
            } catch (e) {} 
          }
          
          const val = qty * price;
          totalUsdtValue += val;
          newHoldings.push({
            asset: s.asset,
            weight: 0,
            targetWeight: activeTargets.find(t => t.asset === s.asset)?.targetWeight || 0,
            value: val,
            currentQty: qty,
            price: price
          });
        }
        
        // Add zero balance targets that should be bought
        for (const t of activeTargets) {
           if (!newHoldings.find(h => h.asset === t.asset)) {
               newHoldings.push({
                   asset: t.asset,
                   weight: 0,
                   targetWeight: t.targetWeight,
                   value: 0,
                   currentQty: 0,
                   price: 1 // We'd ideally fetch this, but for USDT it's 1. For others, let's fetch.
               });
           }
        }
        
        // Fetch prices for zero balance targets
        for (let i=0; i<newHoldings.length; i++) {
           const h = newHoldings[i];
           if (h.value === 0 && h.asset !== "USDT" && h.asset !== "USDC") {
               try {
                  const pRes = await fetch(`/api/binance-proxy/ticker/price?symbol=${h.asset}USDT`);
                  if (pRes.ok) {
                    const json = await pRes.json();
                    h.price = parseFloat(json.price);
                  }
                } catch (e) {} 
           }
        }
        
        if (totalUsdtValue > 0) {
          newHoldings = newHoldings
            .map((h) => ({
              ...h,
              weight: Math.round((h.value / totalUsdtValue) * 100)
            }))
            .sort((a, b) => b.weight - a.weight);
        }
        
        setHoldings(newHoldings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletAndCalculate();
  }, [userProfile]);

  const executeTrades = async () => {
     // ... logic to execute ...
     toast.success("Rebalance trades would be executed here.");
  };

  // calculate required trades
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const trades = [];
  
  for (const h of holdings) {
    if (h.asset === "USDT" || h.asset === "USDC") continue;
    const targetValue = totalValue * (h.targetWeight / 100);
    const diffUsdt = targetValue - h.value;
    
    if (Math.abs(diffUsdt) > 5) { // Threshold for trades
      trades.push({
        symbol: h.asset,
        side: diffUsdt > 0 ? "BUY" : "SELL",
        amountUsdt: Math.abs(diffUsdt),
        amountAsset: Math.abs(diffUsdt) / h.price
      });
    }
  }

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden p-4 transition-all duration-300 hover:scale-[1.01] hover:z-10 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Scale className="size-4 text-emerald-400" /> Rebalance Suggestion
        </h3>
        <div className="flex items-center gap-2">
           <select 
             value={userProfile}
             onChange={(e) => setUserProfile(e.target.value)}
             className="bg-gray-900 border border-gray-800 text-xs font-bold text-gray-300 rounded px-2 py-1 outline-none focus:border-emerald-500"
           >
             <option value="Balanceret">Balanceret (35% BTC)</option>
             <option value="Høj Risiko">Høj Risiko (45% BTC)</option>
             <option value="Lidt Risiko">Lav Risiko (20% BTC)</option>
           </select>
           <button onClick={fetchWalletAndCalculate} className="p-1 hover:bg-gray-800 rounded-full transition-colors" title="Refresh">
             <RefreshCw className={`size-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>
      
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-500">Beregner allokering...</div>
      ) : trades.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center">
           <Scale className="size-8 text-gray-800 mb-2" />
           <p>Din portefølje er perfekt i balance.</p>
        </div>
      ) : (
        <div className="space-y-4">
           <div className="text-xs text-gray-400 mb-2">Følgende handler anbefales for at opnå din mål-allokering:</div>
           <div className="space-y-2">
             {trades.map((trade, i) => (
               <div key={i} className="flex items-center justify-between p-2.5 bg-gray-900/50 border border-gray-800/80 rounded-lg">
                  <div className="flex items-center gap-3">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                       {trade.side}
                     </span>
                     <span className="font-bold text-white text-sm">{trade.symbol}</span>
                  </div>
                  <div className="text-right">
                     <div className="font-mono text-sm text-gray-200">
                        {trade.amountAsset.toFixed(4)} {trade.symbol}
                     </div>
                     <div className="font-mono text-[10px] text-gray-500">
                        ~ ${trade.amountUsdt.toFixed(2)} USDT
                     </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
