const fs = require('fs');
let code = fs.readFileSync('src/components/P2PPaymentModal.tsx', 'utf8');

code = code.replace(
  `  const qrData = encodeURIComponent(\`tron:\${trc20Address}?asset=\${currency}\${amount > 0 ? \`&amount=\${amount}\` : ''}&message=\${referenceId}\`);`,
  `  const binancePayLink = \`https://app.binance.com/qr/dplk?action=download&id=\${binancePayId}&amount=\${amount > 0 ? amount : ''}&currency=\${currency}&ref=\${referenceId}\`;
  const qrData = encodeURIComponent(binancePayLink);`
)

code = code.replace(
  `              <h3 className="font-bold text-white tracking-tight">USDT (TRC20) Betaling</h3>
              <p className="text-xs text-gray-400">Scan QR for at betale med din crypto wallet</p>`,
  `              <h3 className="font-bold text-white tracking-tight">Binance Pay</h3>
              <p className="text-xs text-gray-400">Scan QR for at betale via Binance Pay link</p>`
)

code = code.replace(
  `            <img src={qrUrl} alt="TRC20 QR Code" className="w-48 h-48" />`,
  `            <img src={qrUrl} alt="Binance Pay Link QR Code" className="w-48 h-48" />`
)

code = code.replace(
  `              <div className="overflow-hidden mr-4">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">TRC20 Adresse</p>
                <p className="font-mono text-sm text-gray-200 truncate">{trc20Address}</p>
              </div>
              <button 
                onClick={() => handleCopy(trc20Address, setCopiedAddr, 'TRC20 Adresse')}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
                title="Copy TRC20 Address"
              >
                {copiedAddr ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>`,
  `              <div className="overflow-hidden mr-4">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">Binance Pay Link</p>
                <p className="font-mono text-sm text-gray-200 truncate">{binancePayLink}</p>
              </div>
              <button 
                onClick={() => handleCopy(binancePayLink, setCopiedAddr, 'Binance Pay link')}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
                title="Copy Binance Pay link"
              >
                {copiedAddr ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>`
)

fs.writeFileSync('src/components/P2PPaymentModal.tsx', code);
