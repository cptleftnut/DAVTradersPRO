const fs = require('fs');
let content = fs.readFileSync('src/components/CryptoScreener.tsx', 'utf8');

content = content.replace(/item\.symbol\.endsWith\("USDC"\) \? "USDC" : "USDT"/g, `item.symbol.endsWith("USDC") ? "USDC" : (item.symbol.endsWith("USDT") ? "USDT" : (item.symbol.endsWith("BTC") ? "BTC" : (item.symbol.endsWith("ETH") ? "ETH" : (item.symbol.endsWith("BNB") ? "BNB" : (item.symbol.endsWith("EUR") ? "EUR" : "USDT")))))`);

fs.writeFileSync('src/components/CryptoScreener.tsx', content);
