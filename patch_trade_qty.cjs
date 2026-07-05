const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  `const quantity = (allocation / currentPrice).toFixed(5);
    
    let orderData;
    try {
      const orderRes = await client.newOrder(symbol, side, 'MARKET', { quantity });`,
  `// const quantity = (allocation / currentPrice).toFixed(5);
    
    let orderData;
    try {
      const orderRes = await client.newOrder(symbol, side, 'MARKET', { quoteOrderQty: allocation.toString() });`
);

fs.writeFileSync('server.ts', content);
