const fs = require('fs');

const replacement = `BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30, SPY: 510.50, QQQ: 440.20, VOO: 460.10, ARKK: 50.30, TLT: 90.50, BND: 72.10, AGG: 97.40, LQD: 105.20`;

let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replaceAll(
  `BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30`,
  replacement
);
code = code.replaceAll(
  `BTC: 68350.20,
                               ETH: 3490.15,
                               SOL: 156.70,
                               BNB: 585.30,
                               XRP: 0.52,
                               ADA: 0.45,
                               DOGE: 0.165,
                               AVAX: 45.30`,
  replacement
);


fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
