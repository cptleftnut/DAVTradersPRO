const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Update widget order default and parse logic
content = content.replace(
  `if (parsed && Array.isArray(parsed)) { if (!parsed.includes('orderBook')) parsed.push('orderBook'); return parsed; }`,
  `if (parsed && Array.isArray(parsed)) { 
     if (!parsed.includes('orderBook')) parsed.push('orderBook'); 
     if (!parsed.includes('portfolioDistribution')) parsed.push('portfolioDistribution'); 
     return parsed; 
  }`
);

content = content.replace(
  `return ['agentControl', 'walletSummary', 'orderBook', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];`,
  `return ['agentControl', 'walletSummary', 'portfolioDistribution', 'orderBook', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];`
);

// Import PortfolioDistribution
content = content.replace(
  `import { OrderBook } from './OrderBook';`,
  `import { OrderBook } from './OrderBook';\nimport { PortfolioDistribution } from './PortfolioDistribution';`
);

const portfolioWidget = `
        {/* Portfolio Distribution Widget */}
        {widgetOrder.includes('portfolioDistribution') && (
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: widgetOrder.indexOf('portfolioDistribution') * 0.1, ease: 'easeOut' }}
          style={{ order: widgetOrder.indexOf('portfolioDistribution') }}
          className={\`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-300 hover:scale-[1.01] hover:z-10 \${draggedIndex === widgetOrder.indexOf('portfolioDistribution') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5' : ''}\`}
          draggable
          onDragStart={(e) => handleDragStart(e, widgetOrder.indexOf('portfolioDistribution'))}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, widgetOrder.indexOf('portfolioDistribution'))}
          onDragEnd={handleDragEnd}
        >
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-2 hover:bg-white/10 rounded-lg flex items-center gap-1 z-20">
                <button 
                onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('portfolioDistribution'), -1); }} 
                disabled={widgetOrder.indexOf('portfolioDistribution') === 0} 
                className="hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <GripVertical className="w-4 h-4 text-gray-400" />
                <button 
                onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('portfolioDistribution'), 1); }} 
                disabled={widgetOrder.indexOf('portfolioDistribution') === widgetOrder.length - 1} 
                className="hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
             </div>
             
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Portfolio Distribution
                </h3>
             </div>
             
             <div className="h-[300px]">
                <PortfolioDistribution walletData={walletData} currentPrice={currentPrice} activeSymbol={symbol} />
             </div>
        </motion.div>
        )}
`;

content = content.replace(
  `{/* Order Book Widget */}`,
  portfolioWidget + `\n        {/* Order Book Widget */}`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);

