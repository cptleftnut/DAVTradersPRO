const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

if (!code.includes("import { TickerTape }")) {
  code = code.replace("import { UpgradesStoreWidget } from './UpgradesStoreWidget';", "import { UpgradesStoreWidget } from './UpgradesStoreWidget';\nimport { TickerTape } from './TickerTape';");
}

code = code.replace("{/* Dashboard Layout Toolbar */}", "<TickerTape />\n      {/* Dashboard Layout Toolbar */}");

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
