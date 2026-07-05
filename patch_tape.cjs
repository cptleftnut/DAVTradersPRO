const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/components/TickerTape.tsx',
`ticker.symbol.replace('USDT', '')}/USDT`,
`ticker.symbol.replace(/USDT|USDC/g, '')}/{ticker.symbol.endsWith('USDC') ? 'USDC' : 'USDT'}`
);

