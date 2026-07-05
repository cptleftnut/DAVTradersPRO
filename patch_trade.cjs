const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  `async function executeTradeInternal(symbol: string, side: string, allocation: number) {
    const apiKey = botState.userApiKey || process.env.BINANCE_API_KEY;
    const apiSecret = botState.userApiSecret || process.env.BINANCE_API_SECRET;`,
  `async function executeTradeInternal(symbol: string, side: string, allocation: number, customApiKey?: string, customApiSecret?: string) {
    const apiKey = customApiKey || botState.userApiKey || process.env.BINANCE_API_KEY;
    const apiSecret = customApiSecret || botState.userApiSecret || process.env.BINANCE_API_SECRET;`
);

content = content.replace(
  `const result = await executeTradeInternal(symbol, side, allocation);
      res.json({ success: true, result });`,
  `const result = await executeTradeInternal(symbol, side, allocation, apiKey, apiSecret);
      res.json({ success: true, result });`
);

fs.writeFileSync('server.ts', content);
