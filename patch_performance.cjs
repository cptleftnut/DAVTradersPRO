const fs = require('fs');
let content = fs.readFileSync('src/components/PerformanceTrend.tsx', 'utf8');
content = content.replace(
  "const klinesRes = await fetch(\\`https://api.binance.com/api/v3/klines?symbol=\\${activeSymbol}&interval=1h&limit=24\\`);",
  "const klinesRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${activeSymbol}&interval=1h&limit=24`);"
);
content = content.replace(
  "tickFormatter={(val) => \\`\\${val}%\\`}",
  "tickFormatter={(val) => `${val}%`}"
);
content = content.replace(
  "{data.length > 0 ? \\`\\${isPortfolioUp ? '+' : ''}\\${data[data.length - 1].portfolioPercentChange}%\\` : '0%'}",
  "{data.length > 0 ? `${isPortfolioUp ? '+' : ''}${data[data.length - 1].portfolioPercentChange}%` : '0%'}"
);
content = content.replace(
  "{data.length > 0 ? \\`\\${isAssetUp ? '+' : ''}\\${data[data.length - 1].assetPercentChange}%\\` : '0%'}",
  "{data.length > 0 ? `${isAssetUp ? '+' : ''}${data[data.length - 1].assetPercentChange}%` : '0%'}"
);
fs.writeFileSync('src/components/PerformanceTrend.tsx', content);
