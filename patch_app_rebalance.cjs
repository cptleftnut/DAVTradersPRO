const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('RebalanceSuggestion')) {
  content = content.replace(
    'import { FeeAnalysisChart } from "./components/FeeAnalysisChart";',
    'import { FeeAnalysisChart } from "./components/FeeAnalysisChart";\nimport { RebalanceSuggestion } from "./components/RebalanceSuggestion";'
  );
  
  content = content.replace(
    "const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];",
    "const DEFAULT_ITEMS = ['BinanceTradingPanel', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];"
  );
  
  content = content.replace(
    'FeeAnalysisChart: <FeeAnalysisChart />',
    'FeeAnalysisChart: <FeeAnalysisChart />,\n    RebalanceSuggestion: <RebalanceSuggestion />'
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
