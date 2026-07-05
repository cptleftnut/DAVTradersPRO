import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, ChevronLeft, ChevronRight, Wallet, PieChart as PieChartIcon, ArrowUpRight, ShieldCheck, Zap, QrCode } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const WalletSummaryWidget = React.memo(({ 
  widgetOrder, 
  draggedIndex, 
  handleDragStart, 
  handleDragOver, 
  handleDrop, 
  handleDragEnd, 
  moveWidget,
  walletData,
  walletLoading,
  onOpenDeposit
}: any) => {

  const totalBalance = useMemo(() => {
     if (!walletData || !walletData.spot) return 0;
     let total = 0;
     walletData.spot.forEach((item: any) => {
        const amount = parseFloat(item.free) + parseFloat(item.locked || '0');
        if (amount <= 0) return;
        
        if (item.asset === 'USDT' || item.asset === 'USDC' || item.asset === 'BUSD' || item.asset === 'DAI') {
            total += amount;
        } else if (item.asset === 'BTC') {
            total += amount * 60000;
        } else if (item.asset === 'ETH') {
            total += amount * 3000;
        } else if (item.asset === 'BNB') {
            total += amount * 500;
        } else if (item.asset === 'SOL') {
            total += amount * 150;
        }
     });
     return total;
  }, [walletData]);

  const topAssets = useMemo(() => {
      if (!walletData || !walletData.spot) return [];
      
      const assetsWithVal = walletData.spot.map((item: any) => {
        const amount = parseFloat(item.free) + parseFloat(item.locked || '0');
        let value = 0;
        if (item.asset === 'USDT' || item.asset === 'USDC' || item.asset === 'BUSD' || item.asset === 'DAI') {
            value = amount;
        } else if (item.asset === 'BTC') {
            value = amount * 60000;
        } else if (item.asset === 'ETH') {
            value = amount * 3000;
        } else if (item.asset === 'BNB') {
            value = amount * 500;
        } else if (item.asset === 'SOL') {
            value = amount * 150;
        }
        return { asset: item.asset, amount, value, free: parseFloat(item.free) };
      }).filter((a: any) => a.value > 0).sort((a: any, b: any) => b.value - a.value).slice(0, 4);
      
      return assetsWithVal;
  }, [walletData]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: widgetOrder.indexOf('walletSummary') * 0.1, ease: 'easeOut' }}
      style={{ order: widgetOrder.indexOf('walletSummary') }}
      className={`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 ${draggedIndex === widgetOrder.indexOf('walletSummary') ? 'opacity-40 ring-2 ring-emerald-500/40 bg-emerald-500/5' : ''}`}
    >
      {/* Reordering Header */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 bg-gray-950/95 border border-gray-850 rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
         <span className="flex items-center gap-1.5 text-emerald-500 cursor-grab active:cursor-grabbing">
           <GripVertical className="size-3.5" />
           Wallet Balance Summary
         </span>
         <div className="flex items-center gap-1 text-gray-400 font-mono">
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('walletSummary'), -1); }} 
             disabled={widgetOrder.indexOf('walletSummary') === 0} 
             className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
             title="Flyt op / venstre"
           >
             <ChevronLeft className="size-3.5" />
           </button>
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('walletSummary'), 1); }} 
             disabled={widgetOrder.indexOf('walletSummary') === widgetOrder.length - 1} 
             className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
             title="Flyt ned / højre"
           >
             <ChevronRight className="size-3.5" />
           </button>
         </div>
      </div>

      <div className="flex items-center gap-3 mb-6 relative">
         <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
           <Wallet className="size-5 text-emerald-500" />
         </div>
         <h2 className="text-xl font-bold tracking-tight">Est. Balance</h2>
         {walletLoading && <div className="absolute right-0 top-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
      </div>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-400 font-mono mb-1 uppercase tracking-wider">Total Est. Værdi (USD)</div>
          <div className="text-4xl font-black tabular-nums tracking-tighter">
             ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <button onClick={onOpenDeposit} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors">
          <QrCode className="size-3.5" />
          Deposit
        </button>
      </div>

      {/* AI Access Fee Banner */}
      <div className="mb-8 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Zap className="size-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-amber-500 flex items-center gap-2">
            DAVs Profit Fee <span className="text-xs bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-400 font-mono">1%</span>
          </div>
          <div className="text-xs text-amber-500/70 mt-1 leading-relaxed">
            Daglige adgangsgebyr beregnes automatisk baseret på genereret overskud for at holde AI Trader aktiv.
          </div>
          <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center gap-1">
             <ShieldCheck className="size-3" /> Status: AKTIV
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
         <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="size-4 text-gray-500" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Assets</h3>
         </div>
         
         {!walletData || topAssets.length === 0 ? (
             <div className="h-full flex items-center justify-center border border-dashed border-gray-800 rounded-xl p-4 text-gray-500 text-sm font-mono">
                 {walletLoading ? "Indlæser wallet..." : "Ingen data tilgængelig"}
             </div>
         ) : (
             
             <div className="space-y-4">
                 <div className="h-48 w-full mb-4 relative">
                     <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                             <Pie
                                 data={topAssets}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={50}
                                 outerRadius={70}
                                 paddingAngle={5}
                                 dataKey="value"
                                 stroke="none"
                             >
                                 {topAssets.map((entry: any, index: number) => (
                                     <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][index % 5]} />
                                 ))}
                             </Pie>
                             <Tooltip 
                                 formatter={(value: number) => `${value.toFixed(2)}`}
                                 contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                                 itemStyle={{ color: '#fff' }}
                             />
                         </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center">
                             <div className="text-xs text-gray-500 font-mono">ASSETS</div>
                             <div className="text-sm font-bold">{topAssets.length}</div>
                         </div>
                     </div>
                 </div>
                 <div className="space-y-3">

                {topAssets.map((asset: any) => (
                    <div key={asset.asset} className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-gray-800/60 hover:bg-gray-800/40 transition-colors">
                       <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-950 flex items-center justify-center border border-gray-800 text-xs font-bold">
                              {asset.asset.substring(0, 3)}
                           </div>
                           <div>
                               <div className="font-bold text-sm">{asset.asset}</div>
                               <div className="text-[10px] text-gray-500 font-mono uppercase">Free: {asset.free.toFixed(4)}</div>
                           </div>
                       </div>
                       <div className="text-right">
                           <div className="font-mono text-sm">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                           <div className="text-[10px] text-emerald-500 font-mono flex items-center justify-end gap-0.5">
                               {((asset.value / totalBalance) * 100).toFixed(1)}% <ArrowUpRight className="size-3" />
                           </div>
                       </div>
                    </div>
                ))}
             </div>
             </div>
         )}
      </div>
    </motion.div>
  );
});
