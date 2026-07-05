const fs = require('fs');
let content = fs.readFileSync('src/components/OrderBook.tsx', 'utf8');

content = content.replace(
  `export function OrderBook({ symbol }: { symbol: string }) {`,
  `export function OrderBook({ symbol = "BTCUSDT" }: { symbol?: string }) {`
);
fs.writeFileSync('src/components/OrderBook.tsx', content);
