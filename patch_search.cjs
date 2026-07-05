const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

content = content.replace(
`if (!customVal.endsWith('USDT') && !customVal.endsWith('USDC')) {`,
`if (!customVal.endsWith('USDT') && !customVal.endsWith('USDC') && !customVal.endsWith('BTC') && !customVal.endsWith('ETH') && !customVal.endsWith('BNB') && !customVal.endsWith('EUR')) {`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
