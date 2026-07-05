const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('PriceAlerts')) {
  content = content.replace(
    'import { RebalanceSuggestion } from "./components/RebalanceSuggestion";',
    'import { RebalanceSuggestion } from "./components/RebalanceSuggestion";\nimport { PriceAlerts } from "./components/PriceAlerts";'
  );
  
  content = content.replace(
    "const DEFAULT_ITEMS = ['BinanceTradingPanel', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];",
    "const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PriceAlerts', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];"
  );
  
  content = content.replace(
    'RebalanceSuggestion: <RebalanceSuggestion />',
    'RebalanceSuggestion: <RebalanceSuggestion />,\n    PriceAlerts: <PriceAlerts />'
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
