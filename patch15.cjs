const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  /className=\{\`([^`]*?)group transition-all duration-300([^\`]*?)\`\}/g,
  "className={`$1group transition-all duration-300 hover:scale-[1.01] hover:z-10$2`}"
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
