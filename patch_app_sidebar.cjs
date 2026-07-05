const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace DEFAULT_ITEMS
content = content.replace(
  "const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PriceAlerts', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];",
  "const DEFAULT_ITEMS = ['PriceAlerts', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];"
);

// Add Menu icon to imports
if (!content.includes('Menu,')) {
  content = content.replace(
    'import { Loader2, Palette, GripVertical, RotateCcw } from "lucide-react";',
    'import { Loader2, Palette, GripVertical, RotateCcw, Menu, X } from "lucide-react";'
  );
}

// Add state for sidebar
content = content.replace(
  'const [items, setItems] = useState(DEFAULT_ITEMS);',
  'const [items, setItems] = useState(DEFAULT_ITEMS);\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);'
);

// Replace layout
const oldLayout = `<div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {items.map(id => (
              <SortableItem key={id} id={id}>
                {componentsMap[id]}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>`;

const newLayout = `<div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Dashboard</h2>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-bold text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {isSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            {isSidebarOpen ? 'Skjul Widgets' : 'Vis Widgets'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {componentsMap['BinanceTradingPanel']}
          </div>

          {/* Sidebar */}
          <div className={\`lg:w-[350px] xl:w-[400px] flex-shrink-0 space-y-6 \${isSidebarOpen ? 'block' : 'hidden lg:block'}\`}>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={items}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6">
                  {items.map(id => (
                    <SortableItem key={id} id={id}>
                      {componentsMap[id]}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>`;

content = content.replace(oldLayout, newLayout);

// Also need to add Menu and X to lucide-react if they weren't added correctly
if (!content.includes('Menu,')) {
    content = content.replace('Loader2, Palette', 'Loader2, Palette, Menu, X');
}

fs.writeFileSync('src/App.tsx', content);
