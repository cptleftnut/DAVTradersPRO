const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(/import \{ UpgradesStoreWidget \} from '.\/UpgradesStoreWidget';\nimport \{ UpgradesStoreWidget \} from '.\/UpgradesStoreWidget';\nimport \{ UpgradesStoreWidget \} from '.\/UpgradesStoreWidget';/g, "import { UpgradesStoreWidget } from './UpgradesStoreWidget';");

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
