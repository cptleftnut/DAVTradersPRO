const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`app.post('/api/demo/reset-wallet', (req, res) => {
   simulatedWallet.spot = [
     { asset: 'USDT', free: '10.00000000', locked: '0.00000000' },
     { asset: 'BTC', free: '0.00000000', locked: '0.00000000' },
     { asset: 'ETH', free: '0.00000000', locked: '0.00000000' },
     { asset: 'SOL', free: '0.00000000', locked: '0.00000000' },
     { asset: 'BNB', free: '0.00000000', locked: '0.00000000' },
     { asset: 'DOGE', free: '0.00000000', locked: '0.00000000' }
   ];
   botState.orderHistory = [];
   botState.activePositionsList = [];
   botState.tradeCounter = 0;
   
   saveWallet();
   saveBotState();
   res.json({ success: true, wallet: simulatedWallet });
});`,
`app.post('/api/demo/reset-wallet', (req, res) => {
   simulatedWallet.spot = [
     { asset: 'USDT', free: '0.00000000', locked: '0.00000000' },
     { asset: 'BTC', free: '0.00000000', locked: '0.00000000' },
     { asset: 'ETH', free: '0.00000000', locked: '0.00000000' },
     { asset: 'SOL', free: '0.35000000', locked: '0.00000000' },
     { asset: 'BNB', free: '0.00000000', locked: '0.00000000' },
     { asset: 'DOGE', free: '0.00000000', locked: '0.00000000' },
     { asset: 'SPY', free: '0.00000000', locked: '0.00000000' },
     { asset: 'TLT', free: '0.00000000', locked: '0.00000000' }
   ];
   
   saveWallet();
   res.json({ success: true, wallet: simulatedWallet });
});

app.post('/api/demo/reset-performance', (req, res) => {
   botState.orderHistory = [];
   botState.activePositionsList = [];
   botState.tradeCounter = 0;
   botState.activePositions = 0;
   
   saveBotState();
   res.json({ success: true });
});`
);

fs.writeFileSync('server.ts', code);
