const fs = require('fs');

let panelCode = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');
panelCode = panelCode.replace(/console\.error\("Historical prices error:", err\);/g, `if (String(err).includes('Failed to fetch')) return; console.error("Historical prices error:", err);`);
panelCode = panelCode.replace(/console\.error\("Initial state load failed", err\)/g, `(err => { if (String(err).includes('Failed to fetch')) return; console.error("Initial state load failed", err); })(err)`);
fs.writeFileSync('src/components/BinanceTradingPanel.tsx', panelCode);

let tickerCode = fs.readFileSync('src/components/TickerTape.tsx', 'utf8');
tickerCode = tickerCode.replace(/console\.error\("Ticker tape fetch error:", err\);/g, `if (String(err).includes('Failed to fetch')) return; console.error("Ticker tape fetch error:", err);`);
fs.writeFileSync('src/components/TickerTape.tsx', tickerCode);
