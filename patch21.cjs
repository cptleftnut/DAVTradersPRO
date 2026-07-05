const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`let simulatedWallet: SimulatedWallet = {
  spot: [
    { asset: 'USDT', free: '10.00000000', locked: '0.00000000' },
    { asset: 'BTC', free: '0.00000000', locked: '0.00000000' },
    { asset: 'ETH', free: '0.00000000', locked: '0.00000000' },
    { asset: 'SOL', free: '0.00000000', locked: '0.00000000' },
    { asset: 'BNB', free: '0.00000000', locked: '0.00000000' },
    { asset: 'DOGE', free: '0.00000000', locked: '0.00000000' }
  ],`,
`let simulatedWallet: SimulatedWallet = {
  spot: [
    { asset: 'USDT', free: '0.00000000', locked: '0.00000000' },
    { asset: 'BTC', free: '0.00000000', locked: '0.00000000' },
    { asset: 'ETH', free: '0.00000000', locked: '0.00000000' },
    { asset: 'SOL', free: '0.35000000', locked: '0.00000000' },
    { asset: 'BNB', free: '0.00000000', locked: '0.00000000' },
    { asset: 'DOGE', free: '0.00000000', locked: '0.00000000' }
  ],`
);

fs.writeFileSync('server.ts', code);
