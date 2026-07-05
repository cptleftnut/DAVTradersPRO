const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/components/BinanceTradingPanel.tsx',
`  { value: "BTCUSDT", label: "BTC/USDT (Bitcoin)" },
  { value: "ETHUSDT", label: "ETH/USDT (Ethereum)" },
  { value: "SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "BNBUSDT", label: "BNB/USDT (Binance Coin)" },
  { value: "DOGEUSDT", label: "DOGE/USDT (Dogecoin)" },`,
`  { value: "BTCUSDT", label: "BTC/USDT (Bitcoin)" },
  { value: "BTCUSDC", label: "BTC/USDC (Bitcoin)" },
  { value: "ETHUSDT", label: "ETH/USDT (Ethereum)" },
  { value: "ETHUSDC", label: "ETH/USDC (Ethereum)" },
  { value: "SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },
  { value: "BNBUSDT", label: "BNB/USDT (Binance Coin)" },
  { value: "DOGEUSDT", label: "DOGE/USDT (Dogecoin)" },
  { value: "USDCUSDT", label: "USDC/USDT (USDC)" },`
);

