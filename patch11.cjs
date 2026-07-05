const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  `                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(\`tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t?asset=USDT&amount=\${unpaidFee}\`)}\`} alt="Deposit QR" className="w-32 h-32" />`,
  `                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(\`https://app.binance.com/qr/dplk?action=download&id=854921043&amount=\${unpaidFee}&currency=USDT\`)}\`} alt="Binance Pay QR" className="w-32 h-32" />`
)

code = code.replace(
  `                     Overfør venligst beløbet til følgende Binance (TRC20) adresse for at låse op for AI traderen igen i dag.`,
  `                     Overfør venligst beløbet via følgende Binance Pay link for at låse op for AI traderen igen i dag.`
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
