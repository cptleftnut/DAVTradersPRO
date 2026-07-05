const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`          { asset: 'DOGE', free: '0.00000000', locked: '0.00000000' }`,
`          { asset: 'DOGE', free: '0.00000000', locked: '0.00000000' },
          { asset: 'SPY', free: '0.00000000', locked: '0.00000000' },
          { asset: 'TLT', free: '0.00000000', locked: '0.00000000' }`
);

fs.writeFileSync('server.ts', code);
