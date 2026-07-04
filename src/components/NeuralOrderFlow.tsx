import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Activity, Infinity as InfinityIcon } from 'lucide-react';

export const NeuralOrderFlow = React.memo(function NeuralOrderFlow() {
  const [orders, setOrders] = useState<{ id: string, side: 'BUY' | 'SELL', size: number, price: number }[]>([]);

  useEffect(() => {
    let idCounter = 0;
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.5;
      const newOrder = {
        id: `ord-${idCounter++}`,
        side: isBuy ? 'BUY' : 'SELL' as 'BUY' | 'SELL',
        size: Math.random() * 10 + 0.1,
        price: 95420.50 + (Math.random() * 20 - 10)
      };
      
      setOrders(prev => {
        const next = [newOrder, ...prev];
        return next.slice(0, 15);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-[400px]">
       <div className="absolute top-0 right-0 p-4 z-10 flex gap-2">
         <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
           <Activity className="size-3" /> Live Tape
         </span>
         <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-purple-500 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
           <Network className="size-3" /> AI Route
         </span>
       </div>
       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
         <InfinityIcon className="size-4 text-cyan-500" /> Neural Order Flow
       </h3>
       
       <div className="relative h-full w-full flex overflow-hidden">
         {/* Order Book Side */}
         <div className="w-1/2 pr-4 border-r border-gray-800/50 flex flex-col justify-center space-y-1">
            {orders.filter(o => o.side === 'SELL').slice(0, 7).map((o, i) => (
              <div key={`sell-${o.id}`} className="flex justify-between text-xs font-mono items-center relative">
                 <div className="absolute inset-0 bg-rose-500/10" style={{ width: `${Math.min(o.size * 10, 100)}%`, right: 0, left: 'auto' }}></div>
                 <span className="text-gray-400 z-10">{o.size.toFixed(4)}</span>
                 <span className="text-rose-400 font-bold z-10">${o.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="py-2 flex items-center justify-between text-sm font-black text-gray-200 border-y border-gray-800">
               <span>95420.50</span>
               <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Spread: 0.1</span>
            </div>
            {orders.filter(o => o.side === 'BUY').slice(0, 7).map((o, i) => (
              <div key={`buy-${o.id}`} className="flex justify-between text-xs font-mono items-center relative">
                 <div className="absolute inset-0 bg-emerald-500/10" style={{ width: `${Math.min(o.size * 10, 100)}%`, left: 0 }}></div>
                 <span className="text-emerald-400 font-bold z-10">${o.price.toFixed(2)}</span>
                 <span className="text-gray-400 z-10">{o.size.toFixed(4)}</span>
              </div>
            ))}
         </div>
         
         {/* Action / Tape Side */}
         <div className="w-1/2 pl-4 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900 z-10 pointer-events-none"></div>
            <div className="space-y-1 h-full overflow-hidden flex flex-col-reverse relative z-0">
              <AnimatePresence>
                {orders.map((o) => (
                   <motion.div
                     key={o.id}
                     initial={{ opacity: 0, x: 20, scale: 0.9 }}
                     animate={{ opacity: 1, x: 0, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     transition={{ duration: 0.2 }}
                     className="flex items-center justify-between text-[10px] font-mono bg-gray-950/40 p-1.5 border min-h-[30px] border-gray-800/40 rounded shadow-sm"
                   >
                     <span className={`${o.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>{o.side}</span>
                     <span className="text-gray-300">${o.price.toFixed(2)}</span>
                     <span className="text-gray-500">{o.size.toFixed(2)}</span>
                   </motion.div>
                ))}
              </AnimatePresence>
            </div>
         </div>
       </div>
    </div>
  );
});

