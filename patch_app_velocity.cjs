const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('TradeVelocityGauge')) {
  content = content.replace(
    'import { PriceAlerts } from "./components/PriceAlerts";',
    'import { PriceAlerts } from "./components/PriceAlerts";\nimport { TradeVelocityGauge } from "./components/TradeVelocityGauge";'
  );
  
  content = content.replace(
    "const DEFAULT_ITEMS = ['PriceAlerts', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];",
    "const DEFAULT_ITEMS = ['TradeVelocityGauge', 'PriceAlerts', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];"
  );
  
  content = content.replace(
    'PriceAlerts: <PriceAlerts />',
    'PriceAlerts: <PriceAlerts />,\n    TradeVelocityGauge: <TradeVelocityGauge />'
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
