const fs = require('fs');

let file1 = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');
file1 = file1.replace(
  `} overflow-hidden flex flex-col h-[650px] relative group transition-all duration-300 \${`,
  `} overflow-hidden flex flex-col h-[650px] relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 \${`
);
fs.writeFileSync('src/components/BinanceTradingPanel.tsx', file1);

let file2 = fs.readFileSync('src/components/WalletSummaryWidget.tsx', 'utf8');
file2 = file2.replace(
  `relative group transition-all duration-300 \${`,
  `relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 \${`
);
fs.writeFileSync('src/components/WalletSummaryWidget.tsx', file2);

