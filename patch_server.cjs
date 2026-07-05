const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('server.ts',
`const usdtPairs = data.filter((p: any) => p.symbol.endsWith('USDT') && !p.symbol.includes('UPUSDT') && !p.symbol.includes('DOWNUSDT'));`,
`const usdtPairs = data.filter((p: any) => (p.symbol.endsWith('USDT') || p.symbol.endsWith('USDC')) && !p.symbol.includes('UPUSDT') && !p.symbol.includes('DOWNUSDT') && !p.symbol.includes('UPUSDC') && !p.symbol.includes('DOWNUSDC'));`
);

fs.writeFileSync('server.ts', fs.readFileSync('server.ts', 'utf8').replace(/symbolStr \+= 'USDT';/g, "symbolStr += 'USDT'; // keep default USDT"));

