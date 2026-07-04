const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  "tradeDetails={{\n                side: pendingTrade?.side || 'BUY',\n                quantity: pendingTrade?.quantity || 0,\n                orderType: pendingTrade?.orderType || 'MARKET',\n                symbol: symbol\n            }}",
  "tradeDetails={{\n                side: pendingTrade?.side || 'BUY',\n                quantity: pendingTrade?.quantity || 0,\n                orderType: pendingTrade?.orderType || 'MARKET',\n                symbol: symbol,\n                estimatedPrice: parseFloat(currentPrice) || 0\n            }}"
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
