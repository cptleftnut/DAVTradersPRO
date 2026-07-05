const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('FeeAnalysisChart')) {
  content = content.replace(
    'import { TradeHistoryTable } from "./components/TradeHistoryTable";',
    'import { TradeHistoryTable } from "./components/TradeHistoryTable";\nimport { FeeAnalysisChart } from "./components/FeeAnalysisChart";'
  );
  
  content = content.replace(
    "const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable'];",
    "const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];"
  );
  
  content = content.replace(
    'TradeHistoryTable: <TradeHistoryTable />',
    'TradeHistoryTable: <TradeHistoryTable />,\n    FeeAnalysisChart: <FeeAnalysisChart />'
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
