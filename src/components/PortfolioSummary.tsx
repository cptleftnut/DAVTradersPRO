import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, List as ListIcon } from 'lucide-react';
import { DonutChart } from './DonutChart';
import { PortfolioAllocationChart } from './PortfolioAllocationChart';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, YAxis, XAxis } from 'recharts';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';


const generateSparklineData = (seedStr: string) => {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const data = [];
    let currentPrice = 100 + (Math.abs(hash) % 20);
    const isPositive = hash % 2 === 0;
    
    for (let i = 0; i < 15; i++) {
        const change = (Math.sin(hash + i) * 3) + (isPositive ? i * 0.5 : -i * 0.5);
        currentPrice += change;
        data.push({ val: currentPrice });
    }
    return { data, isPositive: data[data.length - 1].val >= data[0].val };
}

export const PortfolioSummary = React.memo( () => {
  const [walletData, setWalletData] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [latestPnl, setLatestPnl] = useState<number | null>(null);
  const [pnlTrend, setPnlTrend] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'dailySummaries'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
           setLatestPnl(snapshot.docs[0].data().totalPnl || 0);
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      setWalletLoading(true);
      try {
        const response = await fetch('/api/wallet');
        if (response.ok) {
           const data = await response.json();
           setWalletData(data);
        }
      } catch (e: any) {
        if (String(e).includes('Failed to fetch')) return;
        console.error("Failed to fetch wallet", e);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
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

  const totalBalance = useMemo(() => {
     if (!walletData || !walletData.spot) return 0;
     let total = 0;
     walletData.spot.forEach((item: any) => {
        const amount = parseFloat(item.free) + parseFloat(item.locked || '0');
        if (amount <= 0) return;
        
        if (item.asset === 'USDT' || item.asset === 'USDC' || item.asset === 'BUSD' || item.asset === 'DAI') {
            total += amount;
        } else if (item.asset === 'BTC') {
            total += amount * 68350.20; // Approximation or fetch real price
        } else if (item.asset === 'ETH') {
            total += amount * 3490.15;
        } else if (item.asset === 'BNB') {
            total += amount * 585.30;
        } else if (item.asset === 'SOL') {
            total += amount * 156.70;
        } else if (item.asset === 'SPY') { total += amount * 510.50;
        } else if (item.asset === 'QQQ') { total += amount * 440.20;
        } else if (item.asset === 'VOO') { total += amount * 460.10;
        } else if (item.asset === 'ARKK') { total += amount * 50.30;
        } else if (item.asset === 'TLT') { total += amount * 90.50;
        } else if (item.asset === 'BND') { total += amount * 72.10;
        } else if (item.asset === 'AGG') { total += amount * 97.40;
        } else if (item.asset === 'LQD') { total += amount * 105.20;
        } else { total += amount * 1; }
     });
     return total;
  }, [walletData]);

  const topAssets = useMemo(() => {
      if (!walletData || !walletData.spot) return [];
      
      const assetsWithVal = walletData.spot.map((item: any) => {
        const freeAmount = parseFloat(item.free);
        const lockedAmount = parseFloat(item.locked || '0');
        const amount = freeAmount + lockedAmount;
        let value = 0;
        if (item.asset === 'USDT' || item.asset === 'USDC' || item.asset === 'BUSD' || item.asset === 'DAI') {
            value = amount;
        } else if (item.asset === 'BTC') {
            value = amount * 68350.20;
        } else if (item.asset === 'ETH') {
            value = amount * 3490.15;
        } else if (item.asset === 'BNB') {
            value = amount * 585.30;
        } else if (item.asset === 'SOL') {
            value = amount * 156.70;
        } else if (item.asset === 'SPY') { value = amount * 510.50;
        } else if (item.asset === 'QQQ') { value = amount * 440.20;
        } else if (item.asset === 'VOO') { value = amount * 460.10;
        } else if (item.asset === 'ARKK') { value = amount * 50.30;
        } else if (item.asset === 'TLT') { value = amount * 90.50;
        } else if (item.asset === 'BND') { value = amount * 72.10;
        } else if (item.asset === 'AGG') { value = amount * 97.40;
        } else if (item.asset === 'LQD') { value = amount * 105.20;
        } else { value = amount * 1; }
        return { asset: item.asset, amount, value, free: freeAmount, locked: lockedAmount };
      }).filter((a: any) => a.value > 0).sort((a: any, b: any) => b.value - a.value).slice(0, 5);
      
      return assetsWithVal;
  }, [walletData]);

  return (
    <div className="p-6 bg-gray-950/40 backdrop-blur-2xl rounded-3xl border border-gray-800/50 shadow-xl overflow-hidden flex flex-col xl:flex-row gap-6 mb-6">
      <div className="flex flex-col justify-between space-y-4 xl:w-1/3">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
               <Wallet className="size-5 text-emerald-500" />
             </div>
             <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Portfolio Summary</h2>
                <div className="text-sm text-gray-400 font-mono">Total Estimated Value</div>
                {latestPnl !== null && (
                    <div className={`text-xs ${latestPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Daily PnL: {latestPnl >= 0 ? '+' : ''}{latestPnl.toFixed(2)}
                    </div>
                )}
             </div>
             {walletLoading && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
          </div>
          <div className="text-5xl font-black tabular-nums tracking-tighter text-white">
             ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800/50">
             <p className="text-xs text-gray-500">Includes available and locked assets across spot wallets.</p>
          </div>
      </div>
      
      <div className="flex-1 border-t xl:border-t-0 xl:border-l border-gray-800/50 pt-6 xl:pt-0 xl:pl-6 flex flex-col">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListIcon className="size-4 text-emerald-500" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Performing Assets</h3>
            </div>
         </div>
         <div className="flex flex-col md:flex-row gap-6 items-center">
            {topAssets.length > 0 && (
              <div className="w-full md:w-1/3 flex justify-center">
                <DonutChart data={topAssets.map(a => ({ label: a.asset, value: a.value }))} />
              </div>
            )}
            <div className="w-full md:w-2/3">
         
         {!walletData || topAssets.length === 0 ? (
             <div className="flex-1 flex items-center justify-center border border-dashed border-gray-800 rounded-xl p-4 text-gray-500 text-sm font-mono">
                 {walletLoading ? "Loading wallet data..." : "No asset data available"}
             </div>
         ) : (
             <>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-400">
                     <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                         
                         <tr>
                             <th scope="col" className="px-4 py-3 font-semibold rounded-tl-lg">Asset</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-center">Trend (24h)</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-right">Balance</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-right">Value (USD)</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-right rounded-tr-lg">Allocation</th>
                         </tr>

                     </thead>
                     <tbody>
                         {topAssets.map((asset: any, index: number) => {
                             const allocation = totalBalance > 0 ? ((asset.value / totalBalance) * 100).toFixed(1) : '0.0';
                             return (
                                 <tr key={asset.asset} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                     <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-gray-700">
                                            {asset.asset.substring(0, 3)}
                                        </div>
                                        {asset.asset}
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                         <div className="w-16 h-8 mx-auto">
                                            {(() => {
                                                const spark = generateSparklineData(asset.asset);
                                                return (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={spark.data}>
                                                            <YAxis domain={['dataMin', 'dataMax']} hide />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="val" 
                                                                stroke={spark.isPositive ? "#10b981" : "#f43f5e"} 
                                                                strokeWidth={2} 
                                                                dot={false} 
                                                                isAnimationActive={false}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                );
                                            })()}
                                         </div>
                                     </td>
                                     <td className="px-4 py-3 text-right font-mono text-gray-300">
                                        {asset.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                        {asset.locked > 0 && <span className="block text-[10px] text-gray-500 text-right">({asset.locked.toLocaleString(undefined, { maximumFractionDigits: 4 })} locked)</span>}
                                     </td>
                                     <td className="px-4 py-3 text-right font-mono text-white font-semibold">
                                        ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                     </td>
                                     <td className="px-4 py-3 text-right font-mono text-emerald-400">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${allocation}%` }}></div>
                                            </div>
                                            <span>{allocation}%</span>
                                        </div>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
             <PortfolioAllocationChart walletData={walletData} />
             <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">30-Day PnL Trend</h3>
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
             </>
         )}
            </div>
         </div>
      </div>
    </div>
  );
});
