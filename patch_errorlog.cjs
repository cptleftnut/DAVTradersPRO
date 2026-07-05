const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

if (!content.includes('import { TradeErrorLog }')) {
  content = content.replace(
    "import { TradeDiagnosticModal } from './TradeDiagnosticModal';",
    "import { TradeDiagnosticModal } from './TradeDiagnosticModal';\nimport { TradeErrorLog } from './TradeErrorLog';"
  );
}

// Add 'tradeErrorLog' to the default widget order if missing
content = content.replace(
  "return ['agentControl', 'walletSummary', 'portfolioDistribution', 'orderBook', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];",
  "return ['agentControl', 'walletSummary', 'portfolioDistribution', 'orderBook', 'tradeErrorLog', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];"
);

// Add rendering logic
const renderCode = `
        {/* Trade Error Log */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: widgetOrder.indexOf('tradeErrorLog') * 0.1, ease: 'easeOut' }}
          style={{ order: widgetOrder.indexOf('tradeErrorLog') }}
          className={\`relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 \${draggedIndex === widgetOrder.indexOf('tradeErrorLog') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5 rounded-3xl pb-4 shadow-sm' : ''}\`}
        >
          {/* Reordering Header */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 bg-gray-950/95 border border-gray-850/80 rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm">
             <span className="flex items-center gap-1.5 text-amber-500 cursor-grab active:cursor-grabbing">
               <GripVertical className="size-3.5" />
               Handelsfejl Log
             </span>
             <div className="flex items-center gap-1 text-gray-400">
               <button 
                 type="button"
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('tradeErrorLog'), -1); }}
                 disabled={widgetOrder.indexOf('tradeErrorLog') === 0}
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
               ><ChevronLeft className="size-3.5" /></button>
               <button 
                 type="button"
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('tradeErrorLog'), 1); }}
                 disabled={widgetOrder.indexOf('tradeErrorLog') === widgetOrder.length - 1}
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
               ><ChevronRight className="size-3.5" /></button>
             </div>
          </div>
          
          <div 
            draggable
            onDragStart={(e) => handleDragStart(e, widgetOrder.indexOf('tradeErrorLog'))}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widgetOrder.indexOf('tradeErrorLog'))}
            onDragEnd={handleDragEnd}
            className="h-full"
          >
             <TradeErrorLog />
          </div>
        </motion.div>

        {/* Real-time Order Data (Tabs) */}
`;

if (!content.includes('<TradeErrorLog />')) {
  content = content.replace(
    "        {/* Real-time Order Data (Tabs) */}",
    renderCode
  );
}

// Add widget to list of expected ones in restore:
content = content.replace(
  "if (!parsed.includes('portfolioDistribution')) parsed.push('portfolioDistribution');",
  "if (!parsed.includes('portfolioDistribution')) parsed.push('portfolioDistribution');\n     if (!parsed.includes('tradeErrorLog')) parsed.push('tradeErrorLog');"
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
