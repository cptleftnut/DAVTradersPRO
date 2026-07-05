const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { PerformanceTrend }')) {
  content = content.replace(
    `import { PortfolioDistribution } from "./components/PortfolioDistribution";`,
    `import { PortfolioDistribution } from "./components/PortfolioDistribution";\nimport { PerformanceTrend } from "./components/PerformanceTrend";`
  );
}

content = content.replace(
  `const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable'];`,
  `const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable'];`
);

content = content.replace(
  `PortfolioDistribution: <PortfolioDistribution />,`,
  `PerformanceTrend: <PerformanceTrend />,\n    PortfolioDistribution: <PortfolioDistribution />,`
);

fs.writeFileSync('src/App.tsx', content);
