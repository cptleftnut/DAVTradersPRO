const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

if (!code.includes("import { PortfolioSummary }")) {
  code = code.replace("import { WalletSummaryWidget } from './WalletSummaryWidget';", "import { WalletSummaryWidget } from './WalletSummaryWidget';\nimport { PortfolioSummary } from './PortfolioSummary';");
}

code = code.replace('{/* Ticker Stats */}', '<PortfolioSummary walletData={walletData} walletLoading={walletLoading} />\n          {/* Ticker Stats */}');

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
