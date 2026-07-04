const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

if (!code.includes("import { P2PPaymentModal }")) {
  code = code.replace("import { TickerTape } from './TickerTape';", "import { TickerTape } from './TickerTape';\nimport { P2PPaymentModal } from './P2PPaymentModal';");
}

if (!code.includes("const [showP2PModal, setShowP2PModal]")) {
  code = code.replace("const [txid, setTxid] = useState('');", "const [txid, setTxid] = useState('');\n  const [showP2PModal, setShowP2PModal] = useState(false);");
}

const p2pButton = `
              <div className="w-full flex flex-col gap-2">
                <button 
                  onClick={() => setShowP2PModal(true)}
                  className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2 mb-2"
                >
                   Åbn P2P Betalingsvindue
                </button>
                <input 
`;
if (!code.includes("Åbn P2P Betalingsvindue")) {
    code = code.replace(/<div className="w-full flex flex-col gap-2">\s*<input/, p2pButton);
}

const modalComponent = `
      <P2PPaymentModal 
        isOpen={showP2PModal} 
        onClose={() => setShowP2PModal(false)}
        amount={unpaidFee}
        referenceId={\`AI-TRADER-\${new Date().getTime().toString().slice(-6)}\`}
      />
      {/* Dashboard Layout Toolbar */}
`;
if (!code.includes("<P2PPaymentModal")) {
    code = code.replace("{/* Dashboard Layout Toolbar */}", modalComponent);
}

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
