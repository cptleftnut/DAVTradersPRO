const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/components/NewsFeed.tsx',
`        setError(err.message || "Failed to fetch news");`,
`        if (!String(err.message).includes("Failed to fetch")) setError(err.message || "Failed to fetch news");`
);

patchFile('src/components/MarketCorrelation.tsx',
`if (isActive && !isBackground) setError(err.message || 'Error fetching correlation data');`,
`if (isActive && !isBackground && !String(err).includes('Failed to fetch')) setError(err.message || 'Error fetching correlation data');`
);

patchFile('src/components/PortfolioRebalancer.tsx',
`toast.error(\`Network error: \${e.message}\`);`,
`if (!String(e).includes('Failed to fetch')) toast.error(\`Network error: \${e.message}\`);`
);

patchFile('src/components/StrategyBacktester.tsx',
`toast.error(err.message || 'Fejl under backtest.');`,
`if (!String(err).includes('Failed to fetch')) toast.error(err.message || 'Fejl under backtest.');`
);

patchFile('src/components/BinanceTradingPanel.tsx',
`setWalletError(err.message || 'Error loading wallet');`,
`if (!String(err).includes('Failed to fetch')) setWalletError(err.message || 'Error loading wallet');`
);

