const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/components/CryptoScreener.tsx',
`d.symbol.endsWith("USDT") &&
          !d.symbol.includes("UPUSDT") &&
          !d.symbol.includes("DOWNUSDT"),`,
`(d.symbol.endsWith("USDT") || d.symbol.endsWith("USDC")) &&
          !d.symbol.includes("UPUSDT") &&
          !d.symbol.includes("DOWNUSDT") &&
          !d.symbol.includes("UPUSDC") &&
          !d.symbol.includes("DOWNUSDC"),`
);

patchFile('src/components/CryptoScreener.tsx',
`throw new Error("No USDT pairs found in response");`,
`throw new Error("No USDT/USDC pairs found in response");`
);

patchFile('src/components/CryptoScreener.tsx',
`{item.symbol.replace("USDT", "")}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          /USDT`,
`{item.symbol.replace(/USDT|USDC/g, "")}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          /{item.symbol.endsWith("USDC") ? "USDC" : "USDT"}`
);

patchFile('src/components/CryptoScreener.tsx',
`24H VOLUME (USDT)`,
`24H VOLUME (USDT/USDC)`
);


