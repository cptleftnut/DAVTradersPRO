const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Remove PortfolioPerformanceChart
const p3Start = code.indexOf('{/* Portfolio Performance Chart */}');
const p3End = code.indexOf('          {/* Ticker Stats */}');
if (p3Start !== -1 && p3End !== -1) {
  code = code.substring(0, p3Start) + code.substring(p3End);
}

// Remove import of PortfolioPerformanceChart
code = code.replace("import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';\n", "");

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
