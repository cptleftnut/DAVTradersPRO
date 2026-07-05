const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

if (!code.includes("import { PortfolioRebalancer }")) {
  code = code.replace(
    "import { GeminiChat } from './GeminiChat';",
    "import { GeminiChat } from './GeminiChat';\nimport { PortfolioRebalancer } from './PortfolioRebalancer';"
  );
}

// Add the tab
if (!code.includes("id: 'rebalance'")) {
  code = code.replace(
    "{ id: 'design', label: 'Design Center'",
    "{ id: 'rebalance', label: 'AI Rebalancer', icon: PieChart, colorClass: 'text-indigo-400', cat: 'strategi' },\n            { id: 'design', label: 'Design Center'"
  );
}

// Add the content render
if (!code.includes("panelTab === 'rebalance'")) {
  code = code.replace(
    "{panelTab === 'design' && (",
    `{panelTab === 'rebalance' && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6 pb-20 font-sans"
                >
                   <PortfolioRebalancer userProfile={riskProfile} walletData={walletData} />
                </motion.div>
              )}
              
              {panelTab === 'design' && (`
  );
}

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
