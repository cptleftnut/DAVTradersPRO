import { History } from 'lucide-react';

export interface AnalysisHistoryItem {
  id: string;
  ticker: string;
  time: string;
  strategy: string;
  snippet: string;
  sentimentScore?: number;
  confidence?: number;
}

interface RecentAnalysesProps {
  history: AnalysisHistoryItem[];
  onSelect: (ticker: string) => void;
}

export function RecentAnalyses({ history, onSelect }: RecentAnalysesProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-3xl border border-gray-800 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
           <History className="size-4 text-amber-500" /> Seneste Analyser
        </h2>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item.ticker)}
            className="p-3 bg-gray-950/50 border border-gray-800/80 rounded-xl hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col gap-2 relative overflow-hidden"
          >
             <div className="flex justify-between items-center z-10 relative">
               <span className="font-mono font-bold text-white group-hover:text-amber-400 transition-colors">{item.ticker}</span>
               <span className="text-[10px] text-gray-500 font-mono">{item.time}</span>
             </div>
             <div className="flex justify-between items-end z-10 relative">
               <span className="text-[10px] font-mono text-gray-400 uppercase line-clamp-1 flex-1 pr-2">
                 {item.snippet}
               </span>
               <span className="text-[9px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-500 border border-gray-800 uppercase font-bold tracking-wider">
                 {item.strategy}
               </span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
