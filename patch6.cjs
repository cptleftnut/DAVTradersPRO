const fs = require('fs');
let code = fs.readFileSync('src/components/P2PPaymentModal.tsx', 'utf8');

code = code.replace(
  `  const qrData = encodeURIComponent(\`binancepay://pay?id=\${binancePayId}&amount=\${amount}&currency=\${currency}&ref=\${referenceId}\`);`,
  `  const qrData = encodeURIComponent(\`binancepay://pay?id=\${binancePayId}\${amount > 0 ? \`&amount=\${amount}\` : ''}&currency=\${currency}&ref=\${referenceId}\`);`
)

code = code.replace(
  `          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 mb-1">Amount to pay</p>
            <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-amber-500">{currency}</span>
            </div>
          </div>`,
  `          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 mb-1">Amount to pay</p>
            <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {amount > 0 ? (
                 <>{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-amber-500">{currency}</span></>
              ) : (
                 <span className="text-2xl text-emerald-400">Valgfrit beløb</span>
              )}
            </div>
          </div>`
)

fs.writeFileSync('src/components/P2PPaymentModal.tsx', code);
