const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  '<StrategyBacktester />',
  '<StrategyBacktester currentStrategy={strategy} defaultTicker={symbol} />'
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
