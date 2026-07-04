const fs = require('fs');

const components = [
  'TradeHistory',
  'TradeJournal',
  'MacroTerminal',
  'NeuralOrderFlow',
  'MarketScanner',
  'AiAutopilot',
  'UpgradesStoreWidget',
  'WalletSummaryWidget',
  'StockChart',
  'PortfolioSummary',
  'TickerTape'
];

components.forEach(comp => {
  const path = `src/components/${comp}.tsx`;
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  
  if (!code.includes('React.memo(') && !code.includes('memo(')) {
    // Basic replace for standard exports
    const exportRegex = new RegExp(`export const ${comp} = \\\({`);
    if (exportRegex.test(code)) {
      code = code.replace(exportRegex, `export const ${comp} = React.memo(({`);
      code = code.replace(/};\s*$/, '});\n');
    } else {
      const exportFuncRegex = new RegExp(`export function ${comp}\\\(`);
      if (exportFuncRegex.test(code)) {
        code = code.replace(exportFuncRegex, `export const ${comp} = React.memo(function ${comp}(`);
        // Find the last closing brace
        const lastBraceIndex = code.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          code = code.substring(0, lastBraceIndex + 1) + ');\n' + code.substring(lastBraceIndex + 1);
        }
      } else {
         const exportConstRegex = new RegExp(`export const ${comp} = `);
         if (exportConstRegex.test(code)) {
            code = code.replace(exportConstRegex, `export const ${comp} = React.memo(`);
            code = code.replace(/};\s*$/, '});\n');
         }
      }
    }
    
    // Add import React if needed
    if (!code.includes('import React')) {
      code = "import React from 'react';\n" + code;
    }
    
    fs.writeFileSync(path, code);
  }
});
