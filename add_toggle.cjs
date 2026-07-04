const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Add states
const statesToAdd = `
  const [aiStrategyEnabled, setAiStrategyEnabled] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{action: string, reason: string} | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    if (!aiStrategyEnabled) return;
    
    let interval: any;
    const analyzeMarket = async () => {
      setAiAnalyzing(true);
      try {
         const res = await fetch('/api/gemini/analyze-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               symbol,
               marketData: {
                  price: currentPrice,
                  dailyStats: dailyStats,
               }
            })
         });
         if (res.ok) {
            const data = await res.json();
            setAiRecommendation(data);
         }
      } catch (err) {
         console.error(err);
      } finally {
         setAiAnalyzing(false);
      }
    };
    
    // Analyze immediately then every 30 seconds
    analyzeMarket();
    interval = setInterval(analyzeMarket, 30000);
    
    return () => clearInterval(interval);
  }, [aiStrategyEnabled, symbol, currentPrice, dailyStats]);
`;

code = code.replace("const [orderHistory, setOrderHistory] = useState<BotOrder[]>([]);", "const [orderHistory, setOrderHistory] = useState<BotOrder[]>([]);\n" + statesToAdd);

const toggleHtml = `
          {/* AI Automated Strategy */}
          <div className="mb-8 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50">
             <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                   <Zap className={\`size-4 \${aiStrategyEnabled ? 'text-amber-500' : 'text-gray-500'}\`} />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Automated Strategy (Gemini AI)</span>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group bg-gray-900/50 p-1.5 px-3 rounded-full border border-gray-800">
                   <span className={\`text-[10px] font-bold uppercase tracking-tight transition-colors \${!aiStrategyEnabled ? 'text-gray-400' : 'text-gray-600'}\`}>OFF</span>
                   <div className="relative w-8 h-4 bg-gray-800 rounded-full transition-colors" onClick={(e) => { e.preventDefault(); setAiStrategyEnabled(!aiStrategyEnabled); }}>
                      <div className={\`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 \${aiStrategyEnabled ? 'translate-x-4 bg-amber-500' : 'translate-x-0 bg-gray-500'}\`}></div>
                   </div>
                   <span className={\`text-[10px] font-bold uppercase tracking-tight transition-colors \${aiStrategyEnabled ? 'text-amber-400' : 'text-gray-600'}\`}>ON</span>
                </label>
             </div>
             
             {aiStrategyEnabled && (
                <div className="p-3 bg-black/50 rounded-xl border border-gray-800 text-sm">
                   {aiAnalyzing && !aiRecommendation ? (
                       <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                          <Loader2 className="size-3 animate-spin" /> Analyzing market data...
                       </div>
                   ) : aiRecommendation ? (
                       <div className="space-y-2">
                           <div className="flex items-center gap-2">
                               <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Recommendation:</span>
                               <span className={\`font-bold px-2 py-0.5 rounded text-[10px] \${aiRecommendation.action === 'BUY' ? 'bg-emerald-950 text-emerald-400' : aiRecommendation.action === 'SELL' ? 'bg-rose-950 text-rose-400' : 'bg-gray-800 text-gray-300'}\`}>{aiRecommendation.action}</span>
                           </div>
                           <p className="text-gray-300 text-xs italic leading-relaxed">"{aiRecommendation.reason}"</p>
                       </div>
                   ) : (
                       <div className="text-gray-500 text-xs font-mono">No recommendation available.</div>
                   )}
                </div>
             )}
          </div>
`;

code = code.replace('<div className="mb-8 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50">', toggleHtml + '\n          <div className="mb-8 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50">');

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
