const fs = require('fs');
let code = fs.readFileSync('src/components/P2PPaymentModal.tsx', 'utf8');

code = code.replace(
  `  currency = 'USDT',
  binancePayId = '854921043',
  referenceId
}: P2PPaymentModalProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPayId, setCopiedPayId] = useState(false);

  if (!isOpen) return null;

  const qrData = encodeURIComponent(\`binancepay://pay?id=\${binancePayId}\${amount > 0 ? \`&amount=\${amount}\` : ''}&currency=\${currency}&ref=\${referenceId}\`);`,
  `  currency = 'USDT',
  binancePayId = '854921043', // Left here for interface compat, but we use TRC20 address
  referenceId
}: P2PPaymentModalProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const trc20Address = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

  if (!isOpen) return null;

  const qrData = encodeURIComponent(\`tron:\${trc20Address}?asset=\${currency}\${amount > 0 ? \`&amount=\${amount}\` : ''}&message=\${referenceId}\`);`
)

code = code.replace(
  `              <h3 className="font-bold text-white tracking-tight">Binance P2P Payment</h3>
              <p className="text-xs text-gray-400">Scan QR to pay with Binance App</p>`,
  `              <h3 className="font-bold text-white tracking-tight">USDT (TRC20) Betaling</h3>
              <p className="text-xs text-gray-400">Scan QR for at betale med din crypto wallet</p>`
)

code = code.replace(
  `          <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
            <img src={qrUrl} alt="Binance Pay QR Code" className="w-48 h-48" />
          </div>`,
  `          <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
            <img src={qrUrl} alt="TRC20 QR Code" className="w-48 h-48" />
          </div>`
)

code = code.replace(
  `            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between group">
              <div>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">Binance Pay ID</p>
                <p className="font-mono text-sm text-gray-200">{binancePayId}</p>
              </div>
              <button 
                onClick={() => handleCopy(binancePayId, setCopiedPayId, 'Binance Pay ID')}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Copy Binance Pay ID"
              >
                {copiedPayId ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            </div>`,
  `            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between group">
              <div className="overflow-hidden mr-4">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">TRC20 Adresse</p>
                <p className="font-mono text-sm text-gray-200 truncate">{trc20Address}</p>
              </div>
              <button 
                onClick={() => handleCopy(trc20Address, setCopiedAddr, 'TRC20 Adresse')}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
                title="Copy TRC20 Address"
              >
                {copiedAddr ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            </div>`
)

fs.writeFileSync('src/components/P2PPaymentModal.tsx', code);
