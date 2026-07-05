const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');
content = content.replace(
`  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },`,
`  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },
  { value: "SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "SOLBTC", label: "SOL/BTC (Solana)" },
  { value: "SOLEUR", label: "SOL/EUR (Solana)" },
  { value: "SOLBNB", label: "SOL/BNB (Solana)" },`
);
fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
