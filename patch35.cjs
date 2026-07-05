const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
`           <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
              <TrendingUp className="text-emerald-500 size-4" /> AI Performance
           </h4>`,
`           <div className="flex justify-between items-center mb-6 relative z-10">
               <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="text-emerald-500 size-4" /> AI Performance
               </h4>
               <button 
                  onClick={handleResetPerformance}
                  disabled={isResettingPerformance}
                  className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
               >
                  {isResettingPerformance ? "Nulstiller..." : "Nulstil"}
               </button>
           </div>`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
