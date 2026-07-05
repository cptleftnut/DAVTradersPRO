const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `import { BinanceTradingPanel } from "./components/BinanceTradingPanel";`,
  `import { BinanceTradingPanel } from "./components/BinanceTradingPanel";\nimport { OrderBook } from "./components/OrderBook";\nimport { PortfolioDistribution } from "./components/PortfolioDistribution";`
);

content = content.replace(
  `const DEFAULT_ITEMS = ['BinanceTradingPanel', 'TradeHistoryTable'];`,
  `const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable'];`
);

content = content.replace(
  `BinanceTradingPanel: <BinanceTradingPanel addLog={addLog} />,`,
  `BinanceTradingPanel: <BinanceTradingPanel addLog={addLog} />,\n    PortfolioDistribution: <PortfolioDistribution />,\n    OrderBook: <OrderBook />,`
);

fs.writeFileSync('src/App.tsx', content);
