const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const diagEndpoint = `
app.get('/api/bot/diagnostics', async (req, res) => {
   const diag = {
      isActive: botState.isActive,
      wsStatus: botState.wsStatus,
      lastError: botState.lastError,
      lastErrorTime: botState.lastErrorTime,
      isLiveTrading: botState.isLiveTrading,
      allocation: botState.allocation,
      recentErrors: botState.orderHistory.filter(o => o.type.includes('FAILED')),
      symbol: botState.symbol,
      reconnectCount: botState.reconnectCount,
      lastHeartbeat: botState.lastHeartbeat
   };
   res.json(diag);
});
`;

content = content.replace(
  "app.get('/api/bot/state', async (req, res) => {",
  diagEndpoint + "\napp.get('/api/bot/state', async (req, res) => {"
);

fs.writeFileSync('server.ts', content);
