import { motion } from 'motion/react';
import { LayoutGrid, Network } from 'lucide-react';
import { useMemo } from 'react';

const sectorData = [
  { name: 'Teknologi', performance: 2.8, size: 'col-span-2 row-span-2' },
  { name: 'Sundhed', performance: -1.2, size: 'col-span-1 row-span-1' },
  { name: 'Finans', performance: 0.8, size: 'col-span-1 row-span-2' },
  { name: 'Forbrugsgoder', performance: 1.5, size: 'col-span-1 row-span-1' },
  { name: 'Energi', performance: -2.4, size: 'col-span-1 row-span-1' },
  { name: 'Industri', performance: 0.3, size: 'col-span-1 row-span-1' },
  { name: 'Forsyning', performance: -0.7, size: 'col-span-1 row-span-1' },
  { name: 'Ejendomme', performance: 0.1, size: 'col-span-1 row-span-1' },
  { name: 'Telekom', performance: -0.2, size: 'col-span-1 row-span-1' }
];

const getColor = (perf: number) => {
  if (perf > 2) return 'bg-emerald-500 text-emerald-50';
  if (perf > 1) return 'bg-emerald-600/80 text-emerald-100';
  if (perf > 0) return 'bg-emerald-800/60 text-emerald-200';
  if (perf > -1) return 'bg-rose-800/60 text-rose-200';
  if (perf > -2) return 'bg-rose-600/80 text-rose-100';
  return 'bg-rose-500 text-rose-50';
};

const getCorrelationColor = (value: number) => {
  if (value === 1) return 'bg-blue-500/80 text-white';
  if (value > 0.8) return 'bg-blue-600/60 text-white';
  if (value > 0.4) return 'bg-blue-700/40 text-gray-200';
  if (value > 0.1) return 'bg-blue-900/40 text-gray-400';
  if (value >= -0.1 && value <= 0.1) return 'bg-gray-800 text-gray-500';
  if (value < -0.8) return 'bg-red-700/80 text-white';
  if (value < -0.4) return 'bg-red-800/60 text-gray-200';
  return 'bg-red-900/40 text-gray-400';
};

// Predetermined static correlations to ensure realistic-looking output
const predefinedCorrelations: Record<string, Record<string, number>> = {
  'Teknologi':     { 'Teknologi': 1.00, 'Forbrugsgoder': 0.65, 'Finans': 0.20, 'Industri': 0.45, 'Ejendomme': 0.15 },
  'Forbrugsgoder': { 'Teknologi': 0.65, 'Forbrugsgoder': 1.00, 'Finans': 0.35, 'Industri': 0.50, 'Ejendomme': 0.25 },
  'Finans':        { 'Teknologi': 0.20, 'Forbrugsgoder': 0.35, 'Finans': 1.00, 'Industri': 0.75, 'Ejendomme': 0.60 },
  'Industri':      { 'Teknologi': 0.45, 'Forbrugsgoder': 0.50, 'Finans': 0.75, 'Industri': 1.00, 'Ejendomme': 0.40 },
  'Ejendomme':     { 'Teknologi': 0.15, 'Forbrugsgoder': 0.25, 'Finans': 0.60, 'Industri': 0.40, 'Ejendomme': 1.00 }
};

export function SectorHeatmap() {
  const topSectors = useMemo(() => {
    return [...sectorData]
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5)
      .map(s => s.name);
  }, []);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
      <div className="flex items-center gap-2 mb-6">
        <LayoutGrid className="size-4 text-cyan-500" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Markedstendenser (Sektorer)</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-3 gap-2 h-64 mb-8">
        {sectorData.map((sector, idx) => (
          <motion.div
            key={sector.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-xl p-3 flex flex-col justify-between items-start transition-transform hover:scale-[1.02] cursor-pointer shadow-sm ${sector.size} ${getColor(sector.performance)}`}
          >
            <span className="text-xs sm:text-sm font-bold tracking-tight leading-tight">{sector.name}</span>
            <span className="text-sm sm:text-lg font-mono font-black">
              {sector.performance > 0 ? '+' : ''}{sector.performance}%
            </span>
          </motion.div>
        ))}
      </div>

      <div className="pt-6 border-t border-gray-800">
        <div className="flex items-center gap-2 mb-6">
          <Network className="size-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top 5 Korrelationsmatrix</h3>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-fit">
              <div className="flex mb-1">
                <div className="w-20 sm:w-24"></div> {/* Empty corner */}
                {topSectors.map(t => (
                  <div key={`header-${t}`} className="w-12 sm:w-16 text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate px-1">
                    {t.substring(0, 3)}
                  </div>
                ))}
              </div>
              
              {topSectors.map((t1) => (
                <div key={`row-${t1}`} className="flex items-center mb-1 gap-1">
                  <div className="w-20 sm:w-24 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate pr-2 text-right">
                    {t1}
                  </div>
                  {topSectors.map((t2) => {
                    const val = predefinedCorrelations[t1]?.[t2] || 0;
                    return (
                      <div 
                         key={`cell-${t1}-${t2}`} 
                         className={`group relative w-12 sm:w-16 h-8 sm:h-10 rounded flex items-center justify-center border border-gray-800/50 transition-colors text-[10px] sm:text-xs font-mono cursor-pointer hover:border-gray-400/50 hover:shadow-lg hover:z-10 ${getCorrelationColor(val)}`}
                      >
                        {val.toFixed(2)}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-gray-950 border border-gray-700 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-20 w-max flex flex-col items-center">
                           <span className="text-[10px] text-gray-400 font-sans tracking-widest uppercase mb-1">{t1} <span className="text-gray-600 mx-1">vs</span> {t2}</span>
                           <span className="text-sm font-mono font-bold text-white">{val.toFixed(3)}</span>
                           <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-700"></div>
                           <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-4 border-transparent border-t-gray-950"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 px-1">
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-700/80 border border-gray-800"></span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Invers (-1)</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-gray-800 border border-gray-700"></span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Neutral (0)</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Stærk (+1)</span>
                  <span className="w-3 h-3 rounded bg-blue-500/80 border border-gray-800"></span>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
