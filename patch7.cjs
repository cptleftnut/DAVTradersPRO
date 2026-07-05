const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  `                  onClick={() => { setP2PAmount(unpaidFee); setP2pReference(''); setShowP2PModal(true); }}`,
  `                  onClick={() => { setP2PAmount(unpaidFee); setP2pReference('FEE-' + new Date().getTime().toString().slice(-6)); setShowP2PModal(true); }}`
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
