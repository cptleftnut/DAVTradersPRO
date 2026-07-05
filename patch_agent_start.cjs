const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
`         toast.error(\`Kunne ikke starte agent: \${e instanceof Error ? e.message : 'Unknown error'}\`);`,
`         if (!String(e).includes('Failed to fetch')) toast.error(\`Kunne ikke starte agent: \${e instanceof Error ? e.message : 'Unknown error'}\`);`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
