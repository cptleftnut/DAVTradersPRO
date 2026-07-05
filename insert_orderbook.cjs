const fs = require('fs');

let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const orderBookWidget = `
        {/* Order Book Widget */}
        {widgetOrder.includes('orderBook') && (
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: widgetOrder.indexOf('orderBook') * 0.1, ease: 'easeOut' }}
          style={{ order: widgetOrder.indexOf('orderBook') }}
          className={\`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-300 hover:scale-[1.01] hover:z-10 \${draggedIndex === widgetOrder.indexOf('orderBook') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5' : ''}\`}
          draggable
          onDragStart={(e) => handleDragStart(e, widgetOrder.indexOf('orderBook'))}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, widgetOrder.indexOf('orderBook'))}
          onDragEnd={handleDragEnd}
        >
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-2 hover:bg-white/10 rounded-lg flex items-center gap-1 z-20">
                <button 
                onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('orderBook'), -1); }} 
                disabled={widgetOrder.indexOf('orderBook') === 0} 
                className="hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <GripVertical className="w-4 h-4 text-gray-400" />
                <button 
                onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('orderBook'), 1); }} 
                disabled={widgetOrder.indexOf('orderBook') === widgetOrder.length - 1} 
                className="hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
             </div>
             <div className="h-[400px]">
                <OrderBook symbol={symbol} />
             </div>
        </motion.div>
        )}
`;

content = content.replace(
  `{/* AI Performance Panel */}`,
  orderBookWidget + `\n        {/* AI Performance Panel */}`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);

