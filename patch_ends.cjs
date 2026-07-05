const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/ticker\.symbol\.endsWith\('USDC'\) \? 'USDC' : 'USDT'/g, `ticker.symbol.endsWith('USDC') ? 'USDC' : (ticker.symbol.endsWith('USDT') ? 'USDT' : (ticker.symbol.endsWith('BTC') ? 'BTC' : (ticker.symbol.endsWith('ETH') ? 'ETH' : (ticker.symbol.endsWith('BNB') ? 'BNB' : (ticker.symbol.endsWith('EUR') ? 'EUR' : 'USDT')))))`);
  
  content = content.replace(/symbol\.endsWith\('USDC'\) \? 'USDC' : 'USDT'/g, `symbol.endsWith('USDC') ? 'USDC' : (symbol.endsWith('USDT') ? 'USDT' : (symbol.endsWith('BTC') ? 'BTC' : (symbol.endsWith('ETH') ? 'ETH' : (symbol.endsWith('BNB') ? 'BNB' : (symbol.endsWith('EUR') ? 'EUR' : 'USDT')))))`);
  
  fs.writeFileSync(file, content);
}

fix('src/components/TickerTape.tsx');
fix('src/components/BinanceTradingPanel.tsx');

