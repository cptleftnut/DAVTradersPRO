const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');
content = content.replace(
`  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },
  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },`,
`  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },`
);
fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
