const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  `                <button 
                  onClick={() => setShowP2PModal(true)}
                  className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2 mb-2"
                >
                   Åbn P2P Betalingsvindue
                </button>`,
  `                <button 
                  onClick={() => { setP2PAmount(unpaidFee); setP2pReference(''); setShowP2PModal(true); }}
                  className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2 mb-2"
                >
                   Åbn P2P Betalingsvindue
                </button>`
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
