const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  `                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t\`} alt="Deposit QR" className="w-32 h-32" />`,
  `                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(\`tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t?asset=USDT&amount=\${unpaidFee}\`)}\`} alt="Deposit QR" className="w-32 h-32" />`
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
