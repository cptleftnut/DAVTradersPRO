import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Tag, Plus, Save, Clock, Download, TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export interface JournalEntry {
  id: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  price: number;
  time: string;
  notes: string;
  tags: string[];
}

interface TradeJournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'time'>) => void;
  useUTC?: boolean;
  autoFillData?: { ticker: string; price: string; side?: 'BUY' | 'SELL' } | null;
  clearAutoFill?: () => void;
}

const PREDEFINED_TAGS = ['emotional trading', 'market news', 'fomo', 'technical setup', 'taking profit', 'stop loss hit'];

export const TradeJournal = React.memo(function TradeJournal({ 
  entries, 
  onAddEntry, 
  useUTC = false,
  autoFillData = null,
  clearAutoFill
}: TradeJournalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTicker, setNewTicker] = useState('BTCUSDT');
  const [newSide, setNewSide] = useState<'BUY' | 'SELL'>('BUY');
  const [newPrice, setNewPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    if (autoFillData) {
      setIsAdding(true);
      setNewTicker(autoFillData.ticker || 'BTCUSDT');
      setNewPrice(autoFillData.price || '');
      if (autoFillData.side) setNewSide(autoFillData.side);
      if (clearAutoFill) clearAutoFill();
    }
  }, [autoFillData, clearAutoFill]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const exportToCSV = () => {
    const listToExport = filterTag ? entries.filter(e => e.tags.includes(filterTag)) : entries;
    if (listToExport.length === 0) {
      toast.error('Ingen journalposter at eksportere!');
      return;
    }
    
    const headers = ['ID', 'Ticker', 'Side', 'Price', 'Time', 'Notes', 'Tags'];
    const csvContent = [
      headers.join(','),
      ...listToExport.map(entry => {
        const timeStr = useUTC 
           ? `${new Date(entry.time).toLocaleString('en-US', {timeZone: 'UTC'})} UTC`
           : new Date(entry.time).toLocaleString('en-US');
           
        return [
          entry.id,
          entry.ticker,
          entry.side,
          entry.price,
          `"${timeStr}"`,
          `"${entry.notes.replace(/"/g, '""')}"`,
          `"${entry.tags.join('; ')}"`
        ].join(',');
      })
    ].join('\n');

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = filterTag 
        ? `trade_journal_${filterTag.replace(/\s+/g, '_')}.csv` 
        : 'trade_journal.csv';
        
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(
        filterTag 
          ? `Eksporterede ${listToExport.length} filtrerede poster til CSV!` 
          : `Eksporterede alle ${listToExport.length} journalposter til CSV!`
      );
    } catch (error) {
      toast.error('Kunne ikke eksportere CSV-fil');
      console.error(error);
    }
  };

  const handleSave = () => {
    if (!newTicker || !newPrice) return;
    onAddEntry({
      ticker: newTicker,
      side: newSide,
      price: parseFloat(newPrice),
      notes: newNotes,
      tags: selectedTags,
    });
    setIsAdding(false);
    setNewNotes('');
    setSelectedTags([]);
  };

  const filteredEntries = filterTag ? entries.filter(e => e.tags.includes(filterTag)) : entries;

  const stats = useMemo(() => {
    const entryProfits: Record<string, number> = {};
    const positions: Record<string, { totalAmount: number; count: number }> = {};

    // Sorter poster efter ældste først for kronologisk BUY/SELL matchning
    const chronologicalEntries = [...entries].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    chronologicalEntries.forEach(entry => {
      if (entry.side === 'BUY') {
        if (!positions[entry.ticker]) {
          positions[entry.ticker] = { totalAmount: 0, count: 0 };
        }
        positions[entry.ticker].totalAmount += entry.price;
        positions[entry.ticker].count += 1;
      } else {
        // SELL
        if (positions[entry.ticker] && positions[entry.ticker].count > 0) {
          const avgBuyPrice = positions[entry.ticker].totalAmount / positions[entry.ticker].count;
          const profit = entry.price - avgBuyPrice;
          entryProfits[entry.id] = profit;
          positions[entry.ticker].totalAmount -= avgBuyPrice;
          positions[entry.ticker].count -= 1;
        } else {
          entryProfits[entry.id] = entry.price;
        }
      }
    });

    let totalProfit = 0;
    let winCount = 0;
    let lossCount = 0;
    let sellCount = 0;

    filteredEntries.forEach(entry => {
      if (entry.side === 'SELL') {
        sellCount++;
        const profit = entryProfits[entry.id] ?? entry.price;
        totalProfit += profit;
        if (profit > 0) {
          winCount++;
        } else if (profit < 0) {
          lossCount++;
        }
      }
    });

    const winRate = sellCount > 0 ? (winCount / sellCount) * 100 : 0;
    const averageProfitOrLoss = sellCount > 0 ? totalProfit / sellCount : 0;

    return {
      totalProfit,
      winRate,
      averageProfitOrLoss,
      winCount,
      lossCount,
      sellCount
    };
  }, [entries, filteredEntries]);

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="size-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Trade Journal</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV}
            title={filterTag ? "Eksportér kun de filtrerede poster" : "Eksportér alle journalposter til CSV"}
            className="bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 hover:text-purple-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border border-purple-800/40 cursor-pointer active:scale-95"
          >
            <Download className="size-3.5" />
            <span>
              {filterTag ? 'Eksportér filtreret' : 'Eksportér CSV'}
            </span>
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors border border-gray-700 cursor-pointer"
          >
            {isAdding ? <span className="text-xs font-bold uppercase px-2">Annuller</span> : <Plus className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800">
              <div className="grid grid-cols-3 gap-3 mb-4">
                 <div>
                   <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Ticker</label>
                   <input type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value.toUpperCase())} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white font-mono" placeholder="BTCUSDT" />
                 </div>
                 <div>
                   <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Side</label>
                   <select value={newSide} onChange={(e) => setNewSide(e.target.value as any)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white font-mono">
                      <option value="BUY">KØB</option>
                      <option value="SELL">SALG</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Pris (USD)</label>
                   <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white font-mono" placeholder="0.00" />
                 </div>
              </div>
              <div className="mb-4">
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Noter til beslutning</label>
                 <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={3} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white font-mono resize-none" placeholder="Hvorfor udførte du denne handel?"></textarea>
              </div>
              <div className="mb-4">
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Tags</label>
                 <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map(tag => (
                      <button 
                         key={tag}
                         onClick={() => toggleTag(tag)}
                         className={`px-2 py-1 flex items-center gap-1 rounded border text-[10px] font-mono transition-colors ${selectedTags.includes(tag) ? 'bg-purple-900/50 border-purple-500 text-purple-300' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                      >
                         <Tag className="size-3" /> {tag}
                      </button>
                    ))}
                 </div>
              </div>
              <button 
                 onClick={handleSave}
                 className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-xs py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                 Gem Journal Entry <Save className="size-4" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
         <button 
           onClick={() => setFilterTag(null)}
           className={`whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${filterTag === null ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
         >
           Alle Handles
         </button>
         {PREDEFINED_TAGS.map(tag => (
           <button 
             key={tag}
             onClick={() => setFilterTag(tag)}
             className={`whitespace-nowrap px-3 py-1 rounded-full text-[10px] uppercase font-mono transition-colors ${filterTag === tag ? 'bg-purple-900/80 border border-purple-500 text-purple-200' : 'bg-gray-900 border border-gray-800 text-gray-500 hover:border-gray-700'}`}
           >
             {tag}
           </button>
         ))}
      </div>

      {/* Trade Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
         {/* Total Profit Card */}
         <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800/80 shadow-md">
            <div className="flex justify-between items-start mb-1 text-gray-500">
               <span className="text-[10px] uppercase tracking-wider font-mono font-bold block">Total Profit</span>
               {stats.totalProfit >= 0 ? (
                 <TrendingUp className="size-4 text-emerald-400" />
               ) : (
                 <TrendingDown className="size-4 text-rose-400" />
               )}
            </div>
            <div className={`text-base sm:text-lg font-mono font-bold tracking-tight ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-gray-500 block font-mono mt-0.5">Baseret på fuldførte salg</span>
         </div>

         {/* Win Rate Card */}
         <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800/80 shadow-md">
            <div className="flex justify-between items-start mb-1 text-gray-500">
               <span className="text-[10px] uppercase tracking-wider font-mono font-bold block">Win Rate</span>
               <Target className="size-4 text-purple-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-white tracking-tight">
               {stats.winRate.toFixed(1)}%
            </div>
            <span className="text-[9px] text-gray-400 block font-mono mt-0.5">
               {stats.winCount}W - {stats.sellCount - stats.winCount}L ({stats.sellCount} salg)
            </span>
         </div>

         {/* Average Profit / Loss Card */}
         <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800/80 shadow-md">
            <div className="flex justify-between items-start mb-1 text-gray-500">
               <span className="text-[10px] uppercase tracking-wider font-mono font-bold block">Gns. Gevinst / Tab</span>
               <DollarSign className="size-4 text-cyan-400" />
            </div>
            <div className={`text-base sm:text-lg font-mono font-bold tracking-tight ${stats.averageProfitOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {stats.averageProfitOrLoss >= 0 ? '+' : ''}${stats.averageProfitOrLoss.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-gray-500 block font-mono mt-0.5">Gennemsnit pr. salg</span>
         </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
         {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
               <BookOpen className="size-8 opacity-20 mb-3" />
               <p className="text-xs font-mono">Ingen journalnoter fundet.</p>
            </div>
         ) : (
            filteredEntries.map(entry => (
               <div key={entry.id} className="bg-gray-950 p-4 rounded-xl border border-gray-800/80 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.side === 'BUY' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
                           {entry.side}
                        </span>
                        <span className="font-bold text-white tracking-widest">{entry.ticker}</span>
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                        <Clock className="size-3" /> {
                           useUTC 
                             ? `${new Date(entry.time).toLocaleDateString([], {timeZone: 'UTC'})} ${new Date(entry.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})} UTC`
                             : `${new Date(entry.time).toLocaleDateString()} ${new Date(entry.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                        }
                     </div>
                  </div>
                  
                  <div className="text-sm font-mono text-gray-300 mb-3 bg-gray-900/50 p-3 rounded-lg border border-gray-800/50">
                     <p className="text-gray-500 text-[10px] uppercase mb-1">Pris: ${entry.price}</p>
                     {entry.notes}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                     {entry.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-900 border border-gray-800 text-gray-400 text-[10px] font-mono rounded flex items-center gap-1">
                           <Tag className="size-2.5" /> {tag}
                        </span>
                     ))}
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
});

