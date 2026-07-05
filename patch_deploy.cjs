const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

content = content.replace(
  "const handleDeploy = async () => {\n    addLog(`AI Execution parameters updated for ${symbol}. Strategy: ${strategy}`, 'info');",
  "const handleDeploy = async () => {\n    if (allocation < 10) {\n        addLog(\"Minimum order size is 10 USDT.\", \"error\");\n        toast.error(\"Minimum order size is 10 USDT.\");\n        return;\n    }\n    addLog(`AI Execution parameters updated for ${symbol}. Strategy: ${strategy}`, 'info');"
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
