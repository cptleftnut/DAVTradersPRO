import { motion } from 'motion/react';
import { Layers } from 'lucide-react';
import { useMemo } from 'react';

const assetData = [
  { name: 'NVDA', fullName: 'Nvidia Corp', performance: 8.4, allocation: '25%', sizeClass: 'col-span-2 row-span-2' },
  { name: 'BTC', fullName: 'Bitcoin', performance: 5.2, allocation: '25%', sizeClass: 'col-span-2 row-span-2' },
  { name: 'ETH', fullName: 'Ethereum', performance: 2.1, allocation: '12.5%', sizeClass: 'col-span-2 row-span-1' },
  { name: 'SOL', fullName: 'Solana', performance: -1.5, allocation: '12.5%', sizeClass: 'col-span-1 row-span-2' },
  { name: 'AAPL', fullName: 'Apple Inc', performance: 0.4, allocation: '6.25%', sizeClass: 'col-span-1 row-span-1' },
  { name: 'TSLA', fullName: 'Tesla', performance: -3.2, allocation: '6.25%', sizeClass: 'col-span-1 row-span-1' },
  { name: 'GOLD', fullName: 'PAXG Gold', performance: 0.2, allocation: '6.25%', sizeClass: 'col-span-1 row-span-1' },
  { name: 'CASH', fullName: 'USDC', performance: 0.0, allocation: '6.25%', sizeClass: 'col-span-1 row-span-1' }
];

const getColor = (perf: number) => {
  if (perf > 5) return 'bg-emerald-500 text-emerald-50';
  if (perf > 2) return 'bg-emerald-600/90 text-emerald-100';
  if (perf > 0) return 'bg-emerald-800/80 text-emerald-200';
  if (perf === 0) return 'bg-gray-700 text-gray-300';
  if (perf > -2) return 'bg-rose-800/80 text-rose-200';
  if (perf > -5) return 'bg-rose-600/90 text-rose-100';
  return 'bg-rose-500 text-rose-50';
};

export function AssetPerformanceHeatmap() {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-purple-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asset Heatmap</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
           <span>Størrelse = Allokering</span>
           <span>&bull;</span>
           <span>Farve = PnL</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2 h-72 sm:h-96">
        {assetData.map((asset, idx) => (
          <motion.div
            key={asset.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-xl p-2 sm:p-4 flex flex-col justify-between items-start transition-all hover:scale-[1.02] hover:z-10 cursor-pointer shadow-sm relative group overflow-hidden ${asset.sizeClass} ${getColor(asset.performance)}`}
          >
            <div className="flex flex-col w-full">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest opacity-80 uppercase truncate w-full">{asset.fullName}</span>
              <span className="text-sm sm:text-xl font-bold tracking-tight leading-none mt-1">{asset.name}</span>
            </div>
            
            <div className="flex flex-col items-start w-full">
               <span className="text-lg sm:text-3xl font-mono font-black tracking-tighter">
                 {asset.performance > 0 ? '+' : ''}{asset.performance}%
               </span>
               <div className="mt-1 sm:mt-2 px-1.5 py-0.5 rounded opacity-80 bg-black/20 text-[9px] sm:text-[10px] font-mono font-bold tracking-wider">
                  ALLOKERING: {asset.allocation}
               </div>
            </div>
            
            {/* Subtle overlay gradient on hover */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
