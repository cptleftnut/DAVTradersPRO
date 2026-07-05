const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

function fixQuote(str) {
  content = content.replace(str, str.replace(/symbol\.endsWith\('USDC'\) \? 'USDC' : 'USDT'/g, `symbol.endsWith('USDC') ? 'USDC' : (symbol.endsWith('USDT') ? 'USDT' : (symbol.endsWith('BTC') ? 'BTC' : (symbol.endsWith('ETH') ? 'ETH' : (symbol.endsWith('BNB') ? 'BNB' : (symbol.endsWith('EUR') ? 'EUR' : 'USDT')))))`));
}

fixQuote("const quoteAsset = symbol.endsWith('USDC') ? 'USDC' : 'USDT';");

// also line 892
content = content.replace(
  `const qAsset = (entryExtended as any).quoteAsset || 'USDT';`,
  `const qAsset = (entryExtended as any).quoteAsset || (botState.symbol.endsWith('USDC') ? 'USDC' : (botState.symbol.endsWith('USDT') ? 'USDT' : (botState.symbol.endsWith('BTC') ? 'BTC' : (botState.symbol.endsWith('ETH') ? 'ETH' : (botState.symbol.endsWith('BNB') ? 'BNB' : (botState.symbol.endsWith('EUR') ? 'EUR' : 'USDT'))))));`
);

content = content.replace(
  `/USDT\$|USDC\$|BTC\$|ETH\$/`,
  `/USDT$|USDC$|BTC$|ETH$|BNB$|EUR$/`
);

content = content.replace(
  `/USDT|USDC/g`,
  `/USDT|USDC|BTC|ETH|BNB|EUR/g`
);

fs.writeFileSync('server.ts', content);
