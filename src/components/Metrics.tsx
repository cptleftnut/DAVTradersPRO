import { motion, AnimatePresence } from 'motion/react';
import { Info, TrendingUp, TrendingDown, DollarSign, Target, Download, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export function Metrics({ 
  rsi, 
  movingAverage,
  prevRsi,
  prevMovingAverage,
  totalInvested = 0,
  totalProfit = 0,
  journalEntries = [],
  chartData = [],
  analysisHistory = [],
  ticker = ""
}: { 
  rsi: number | string, 
  movingAverage: number | string,
  prevRsi?: number | string,
  prevMovingAverage?: number | string,
  totalInvested?: number,
  totalProfit?: number,
  journalEntries?: any[],
  chartData?: { name: string; value: number }[],
  analysisHistory?: any[],
  ticker?: string
}) {

  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[]>([]);
  const [fullCsvContent, setFullCsvContent] = useState("");

  
  const getTrendIcon = (current: number | string, previous?: number | string) => {
    if (typeof current !== 'number' || typeof previous !== 'number') return null;
    if (current > previous) {
      return <TrendingUp className="size-5 text-emerald-500 ml-2 animate-pulse" />;
    } else if (current < previous) {
      return <TrendingDown className="size-5 text-rose-500 ml-2 animate-pulse" />;
    }
    return null;
  };

  const { winningTrades, totalTrades } = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) return { winningTrades: 0, totalTrades: 0 };
    
    let total = 0;
    let winning = 0;
    const positions: Record<string, { totalAmount: number; count: number }> = {};
    
    [...journalEntries].reverse().forEach((entry) => {
      if (entry.side === "BUY") {
        if (!positions[entry.ticker]) {
          positions[entry.ticker] = { totalAmount: 0, count: 0 };
        }
        positions[entry.ticker].totalAmount += entry.price;
        positions[entry.ticker].count += 1;
      } else if (entry.side === "SELL") {
        if (positions[entry.ticker] && positions[entry.ticker].count > 0) {
          const avgBuyPrice = positions[entry.ticker].totalAmount / positions[entry.ticker].count;
          const tradeProfit = entry.price - avgBuyPrice;
          
          total += 1;
          if (tradeProfit > 0) {
            winning += 1;
          }
          
          positions[entry.ticker].totalAmount -= avgBuyPrice;
          positions[entry.ticker].count -= 1;
        } else {
          total += 1;
          if (entry.price > 0) {
             winning += 1;
          }
        }
      }
    });

    return { winningTrades: winning, totalTrades: total };
  }, [journalEntries]);

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const priceTarget = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length < 5) return null;
    
    const currentPrice = chartData[chartData.length - 1].value;
    const maxPrice = Math.max(...chartData.map(d => d.value));
    const minPrice = Math.min(...chartData.map(d => d.value));
    
    let target = maxPrice;
    let type = "Resistance";
    
    if (currentPrice >= maxPrice * 0.98) {
       target = currentPrice * 1.05;
    } else if (currentPrice <= minPrice * 1.02) {
       target = currentPrice * 0.95;
       type = "Support";
    } else if (currentPrice > (maxPrice + minPrice) / 2) {
       target = maxPrice;
       type = "Resistance";
    } else {
       target = minPrice;
       type = "Support";
    }
    
    return { price: target, type };
  }, [chartData]);

  const sentimentAccuracy = useMemo(() => {
    if (!Array.isArray(analysisHistory) || analysisHistory.length === 0 || !Array.isArray(chartData) || chartData.length < 2) return null;
    const tickerHistory = analysisHistory.filter(h => h.ticker === ticker);
    if (tickerHistory.length === 0) return null;

    let correctPredictions = 0;
    
    const firstPrice = chartData[0]?.value;
    const lastPrice = chartData[chartData.length - 1]?.value;
    if (typeof firstPrice !== 'number' || typeof lastPrice !== 'number') return null;
    const isPriceUp = lastPrice >= firstPrice;

    tickerHistory.forEach(h => {
        const score = h.sentimentScore ?? 50;
        const predictedUp = score >= 50;
        if (predictedUp === isPriceUp) correctPredictions++;
    });

    return (correctPredictions / tickerHistory.length) * 100;
  }, [analysisHistory, chartData, ticker]);

  const handleExportCSV = () => {
    if (!journalEntries || journalEntries.length === 0) {
      alert("No journal entries to export");
      return;
    }

    const headers = ["Date", "Ticker", "Side", "Price", "Notes", "Tags"];
    
    const rows = journalEntries.map(entry => {
      const date = new Date(entry.time).toLocaleString();
      const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : "";
      const tags = entry.tags && entry.tags.length > 0 ? `"${entry.tags.join('; ')}"` : "";
      return `"${date}","${entry.ticker}","${entry.side}",${entry.price},${notes},${tags}`;
    });

    const performanceRows = [
      "",
      "PORTFOLIO PERFORMANCE",
      `Total Invested,${totalInvested}`,
      `Realized Profit,${totalProfit}`,
      `Win Rate,${winRate.toFixed(1)}%`,
      `Total Trades,${totalTrades}`,
      `Winning Trades,${winningTrades}`
    ];

    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      rows.join("\n") + "\n" +
      performanceRows.join("\n");

    setFullCsvContent(csvContent);
    setCsvPreviewRows([headers.join(","), ...rows.slice(0, 5)]);
    setShowCsvPreview(true);
  };

  const confirmDownload = () => {
    const encodedUri = encodeURI(fullCsvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `portfolio_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCsvPreview(false);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-serif text-white tracking-tight">Performance Metrics</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl transition-colors font-mono text-sm border border-gray-700 shadow-sm"
        >
          <Download className="size-4" />
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="group relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1"
        >
        <div className="flex items-center gap-2 mb-2">
           <p className="text-[10px] uppercase tracking-widest text-gray-500">RSI (Relative Strength)</p>
           <Info className="size-3 text-gray-600 hover:text-gray-400 cursor-help" />
        </div>
        <div className="flex items-center">
          <p className="text-3xl sm:text-4xl font-bold text-cyan-400 font-mono tracking-tighter">{rsi || "-"}</p>
          {getTrendIcon(Number(rsi), Number(prevRsi))}
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden w-48 p-3 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-10 group-hover:block transition-all transform origin-bottom">
           RSI (Relative Strength Index) måler momentum i prisbevægelser. Over 70 kan indikere overkøbt (salgssignal), under 30 oversolgt (købssignal).
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-950 border-b border-r border-gray-800 rotate-45"></div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="group relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1"
      >
        <div className="flex items-center gap-2 mb-2">
           <p className="text-[10px] uppercase tracking-widest text-gray-500">Glidende gennemsnit</p>
           <Info className="size-3 text-gray-600 hover:text-gray-400 cursor-help" />
        </div>
        <div className="flex items-center">
          <p className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tighter">{movingAverage ? `$${movingAverage}` : "-"}</p>
          {getTrendIcon(Number(movingAverage), Number(prevMovingAverage))}
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden w-48 p-3 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-10 group-hover:block transition-all transform origin-bottom">
           Glidende gennemsnit (og estimeret pris) udglatter prisdata for at identificere den underliggende trend over tid.
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-950 border-b border-r border-gray-800 rotate-45"></div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="group relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1"
      >
        <div className="flex items-center gap-2 mb-2">
           <p className="text-[10px] uppercase tracking-widest text-gray-500">AI Markedsstemning</p>
           <Info className="size-3 text-gray-600 hover:text-gray-400 cursor-help" />
        </div>
        <p className="text-3xl sm:text-4xl font-bold text-emerald-400 font-mono tracking-tighter">Bullish</p>
        
         {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden w-48 p-3 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-10 group-hover:block transition-all transform origin-bottom">
           Aggregeret analyse af nyheder, sociale medier og tekniske indikatorer ved hjælp af maskinlæring.
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-950 border-b border-r border-gray-800 rotate-45"></div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="group relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
           <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Trade Efficiency</p>
              <Info className="size-3 text-gray-600 hover:text-gray-400 cursor-help" />
           </div>
           
           <div className="flex items-end justify-between mt-2">
              <div>
                 <p className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tighter">{winRate.toFixed(1)}%</p>
              </div>
              <div className="text-right flex items-center justify-end gap-1 mb-1">
                 <Target className="size-4 text-cyan-400" />
                 <p className="text-xs text-gray-400 font-mono">{winningTrades} / {totalTrades}</p>
              </div>
           </div>
        </div>
        
         {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden w-56 p-3 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-10 group-hover:block transition-all transform origin-bottom">
           Viser procentdelen af lukkede handler (sælg), der har resulteret i et overskud ud fra den gennemsnitlige købspris.
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-950 border-b border-r border-gray-800 rotate-45"></div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="group relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
           <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Invested vs Profit</p>
              <Info className="size-3 text-gray-600 hover:text-gray-400 cursor-help" />
           </div>
           
           <div className="flex items-end justify-between mt-2">
              <div>
                 <p className="text-[10px] text-gray-500 mb-1">Total Invested</p>
                 <p className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tighter">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-gray-500 mb-1">Realized Profit</p>
                 <p className={`text-xl sm:text-2xl font-bold font-mono tracking-tighter ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                 </p>
              </div>
           </div>
        </div>
        
         {/* Tooltip */}
        <div className="absolute right-0 bottom-full mb-3 hidden w-56 p-3 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-10 group-hover:block transition-all transform origin-bottom-right">
           Aggregeret data fra din Trade Journal. Total investeret i åbne positioner vs. realiseret profit fra lukkede handler.
           <div className="absolute -bottom-2 right-6 w-4 h-4 bg-gray-950 border-b border-r border-gray-800 rotate-45"></div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="group relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
           <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Price Target</p>
              <Info className="size-3 text-gray-600 hover:text-gray-400 cursor-help" />
           </div>
           
           <div className="flex items-end justify-between mt-2">
              <div>
                 <p className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tighter">
                   {priceTarget && typeof priceTarget.price === 'number' && !isNaN(priceTarget.price) ? `$${priceTarget.price.toFixed(2)}` : "-"}
                 </p>
              </div>
              <div className="text-right flex items-center justify-end gap-1 mb-1">
                 {priceTarget?.type === "Resistance" ? (
                   <TrendingUp className="size-4 text-emerald-400" />
                 ) : (
                   <TrendingDown className="size-4 text-rose-400" />
                 )}
                 <p className={`text-xs font-mono font-bold uppercase tracking-widest ${priceTarget?.type === "Resistance" ? "text-emerald-400" : "text-rose-400"}`}>
                   {priceTarget?.type || "N/A"}
                 </p>
              </div>
           </div>
        </div>
        
        {/* Tooltip */}
        <div className="absolute right-0 bottom-full mb-3 hidden w-56 p-3 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-10 group-hover:block transition-all transform origin-bottom-right">
           Estimeret næste støtte (support) eller modstandsniveau (resistance) baseret på seneste prisudvikling og lokale top/bund niveauer i grafen.
           <div className="absolute -bottom-2 right-6 w-4 h-4 bg-gray-950 border-b border-r border-gray-800 rotate-45"></div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="group relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
           <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Sentiment Accuracy</p>
              <Info className="size-3 text-gray-600 hover:text-gray-400 cursor-help" />
           </div>
           
           <div className="flex items-end justify-between mt-2">
              <div>
                 <p className="text-3xl sm:text-4xl font-bold font-mono tracking-tighter text-amber-400">
                   {typeof sentimentAccuracy === 'number' ? `${sentimentAccuracy.toFixed(0)}%` : "-"}
                 </p>
              </div>
              <div className="text-right flex items-center justify-end gap-1 mb-1">
                 <Target className="size-4 text-amber-400" />
              </div>
           </div>
        </div>
        
         {/* Tooltip */}
        <div className="absolute right-0 bottom-full mb-3 hidden w-56 p-3 text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-10 group-hover:block transition-all transform origin-bottom-right">
           Måler hvor ofte AI'ens historiske markedsstemning (bullish/bearish) forudså den faktiske prisudvikling korrekt.
           <div className="absolute -bottom-2 right-6 w-4 h-4 bg-gray-950 border-b border-r border-gray-800 rotate-45"></div>
        </div>
      </motion.div>
    </div>
    
    <AnimatePresence>
      {showCsvPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] p-6 w-full max-w-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-white">CSV Export Preview</h3>
              <button 
                onClick={() => setShowCsvPreview(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="size-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">Showing the first 5 rows of your trade journal:</p>
            
            <div className="overflow-x-auto border border-gray-800 rounded-xl mb-6">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-800/50 text-gray-400 uppercase text-[10px] tracking-widest font-bold">
                  <tr>
                    {csvPreviewRows[0]?.split(",").map((header, i) => (
                      <th key={i} className="px-4 py-3 border-b border-gray-800">{header.replace(/"/g, '')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {csvPreviewRows.slice(1).map((row, i) => {
                    // Simple split by comma, ignoring commas inside quotes for a basic preview
                    const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    return (
                      <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                        {cols.map((col, j) => (
                          <td key={j} className="px-4 py-3 whitespace-nowrap">{col.replace(/(^"|"$)/g, '')}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {journalEntries.length > 5 && (
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-900/50 italic border-t border-gray-800">
                  ...and {journalEntries.length - 5} more rows
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCsvPreview(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDownload}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-lg shadow-amber-900/20 text-sm flex items-center gap-2"
              >
                <Download className="size-4" />
                Confirm Download
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
}
