const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Update widget order default and parse logic
content = content.replace(
  `if (parsed.length === 6) return parsed;`,
  `if (parsed && Array.isArray(parsed)) { if (!parsed.includes('orderBook')) parsed.push('orderBook'); return parsed; }`
);

content = content.replace(
  `return ['agentControl', 'walletSummary', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];`,
  `return ['agentControl', 'walletSummary', 'orderBook', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];`
);

// Import OrderBook
content = content.replace(
  `import { PortfolioRebalancer } from './PortfolioRebalancer';`,
  `import { PortfolioRebalancer } from './PortfolioRebalancer';\nimport { OrderBook } from './OrderBook';`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
