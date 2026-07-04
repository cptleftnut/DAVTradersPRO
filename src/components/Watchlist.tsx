import { useState, useEffect } from 'react';
import { Trash2, Plus, Eye, TrendingUp, TrendingDown, Loader2, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function WatchlistItem({ ticker, onRemove, sentimentScore }: { key?: any, ticker: string, onRemove: (t: string) => void, sentimentScore?: number }) {
  const [stats, setStats] = useState<{ priceChangePercent: number, priceChange1h: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`/api/ticker-24h?symbol=${ticker}`).then(res => res.json()).catch(() => null),
      fetch(`/api/ticker-1h?symbol=${ticker}`).then(res => res.json()).catch(() => null)
    ])
      .then(([data24, data1h]) => {
        if (mounted && data24 && typeof data24.priceChangePercent === 'number') {
          setStats({
             priceChangePercent: data24.priceChangePercent,
             priceChange1h: data1h && typeof data1h.priceChangePercent === 'number' ? data1h.priceChangePercent : 0
          });
        }
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [ticker]);

  let borderColor = 'border-gray-800/80';
  let textColor = 'text-gray-400';
  let bgColor = 'bg-gray-950/80';
  let Icon = null;

  if (stats) {
    if (stats.priceChangePercent > 0) {
      borderColor = 'border-emerald-500/50';
      textColor = 'text-emerald-400';
      Icon = TrendingUp;
    } else if (stats.priceChangePercent < 0) {
      borderColor = 'border-rose-500/50';
      textColor = 'text-rose-400';
      Icon = TrendingDown;
    }

    // Mini-heatmap logic based on 1h change
    if (stats.priceChange1h > 1.5) bgColor = 'bg-emerald-500/40';
    else if (stats.priceChange1h > 0.5) bgColor = 'bg-emerald-500/20';
    else if (stats.priceChange1h > 0) bgColor = 'bg-emerald-500/10';
    else if (stats.priceChange1h < -1.5) bgColor = 'bg-rose-500/40';
    else if (stats.priceChange1h < -0.5) bgColor = 'bg-rose-500/20';
    else if (stats.priceChange1h < 0) bgColor = 'bg-rose-500/10';
  }

  // Override border color with sentiment if available
  let sentimentBadge = null;
  if (sentimentScore !== undefined) {
    if (sentimentScore >= 60) {
      borderColor = 'border-emerald-400';
      sentimentBadge = <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest"><BrainCircuit className="w-3 h-3" /> {sentimentScore}</div>;
    } else if (sentimentScore <= 40) {
      borderColor = 'border-rose-400';
      sentimentBadge = <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded uppercase tracking-widest"><BrainCircuit className="w-3 h-3" /> {sentimentScore}</div>;
    } else {
      borderColor = 'border-amber-400';
      sentimentBadge = <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded uppercase tracking-widest"><BrainCircuit className="w-3 h-3" /> {sentimentScore}</div>;
    }
  }

  return (
    <motion.li 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex justify-between items-center ${bgColor} border ${borderColor} p-4 rounded-2xl group transition-all hover:brightness-110`}
    >
      <div className="flex items-center gap-3">
        <span className='font-mono font-bold text-cyan-400 tracking-tight text-lg'>${ticker}</span>
        {sentimentBadge}
        {loading ? (
          <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        ) : stats ? (
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-1 text-xs font-mono font-bold ${textColor}`}>
               {Icon && <Icon className="w-3 h-3" />}
               {stats.priceChangePercent > 0 ? '+' : ''}{stats.priceChangePercent.toFixed(2)}% <span className="text-gray-500 font-normal ml-1">24H</span>
             </div>
             {stats.priceChange1h !== 0 && (
               <div className={`flex items-center gap-1 text-xs font-mono font-bold ${stats.priceChange1h > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                 {stats.priceChange1h > 0 ? '+' : ''}{stats.priceChange1h.toFixed(2)}% <span className="text-gray-500 font-normal ml-1">1H</span>
               </div>
             )}
          </div>
        ) : null}
      </div>
      <button onClick={() => onRemove(ticker)} className="text-gray-600 hover:text-rose-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={16}/></button>
    </motion.li>
  );
}

export function Watchlist({ filterAsset, analysisHistory = [] }: { filterAsset?: string | null, analysisHistory?: any[] }) {
  const [list, setList] = useState<string[]>([]);
  const [newTicker, setNewTicker] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem('watchlist');
      if (stored) {
         const parsed = JSON.parse(stored);
         if (Array.isArray(parsed)) {
            setList(parsed);
         }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addTicker = () => {
    if (!newTicker || list.includes(newTicker.toUpperCase())) return;
    const newList = [...list, newTicker.toUpperCase()];
    setList(newList);
    localStorage.setItem('watchlist', JSON.stringify(newList));
    setNewTicker("");
  };

  const removeTicker = (ticker: string) => {
    const newList = list.filter(t => t !== ticker);
    setList(newList);
    localStorage.setItem('watchlist', JSON.stringify(newList));
  };

  const displayList = filterAsset ? list.filter(t => t.includes(filterAsset) || filterAsset.includes(t)) : list;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-cyan-500" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Min Huskeliste {filterAsset && <span className="text-cyan-400">({filterAsset})</span>}
          </h3>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input 
          value={newTicker} 
          onChange={(e) => setNewTicker(e.target.value)} 
          className="flex-1 bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm transition-all" 
          placeholder="Skriv aktie symbol..."
        />
        <button onClick={addTicker} className="bg-cyan-600/20 text-cyan-400 border border-cyan-800/50 hover:bg-cyan-500 hover:text-gray-950 px-6 py-3 rounded-2xl transition-all flex justify-center items-center font-bold uppercase text-xs tracking-widest"><Plus size={16} className="mr-2"/> Tilføj</button>
      </div>
      <ul className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayList.map(t => {
            const historyItem = analysisHistory.find(h => h.ticker === t);
            return (
              <WatchlistItem key={t} ticker={t} onRemove={removeTicker} sentimentScore={historyItem?.sentimentScore} />
            );
          })}
        </AnimatePresence>
        {displayList.length === 0 && list.length > 0 && (
          <li className="text-center p-8 text-gray-600 text-xs uppercase tracking-widest font-mono border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center min-h-[150px]">
             Ingen resultater for filteret {filterAsset}
          </li>
        )}
        {list.length === 0 && (
          <li className="text-center p-8 text-gray-600 text-xs uppercase tracking-widest font-mono border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center min-h-[150px]">
             Din huskeliste er tom
          </li>
        )}
      </ul>
    </div>
  );
}
