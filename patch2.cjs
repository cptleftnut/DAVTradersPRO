const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  `      <P2PPaymentModal 
        isOpen={showP2PModal} 
        onClose={() => setShowP2PModal(false)}
        amount={unpaidFee}
        referenceId={\`AI-TRADER-\${new Date().getTime().toString().slice(-6)}\`}
      />`,
  `      <P2PPaymentModal 
        isOpen={showP2PModal} 
        onClose={() => { setShowP2PModal(false); setP2PAmount(0); }}
        amount={p2pAmount > 0 ? p2pAmount : unpaidFee}
        referenceId={p2pReference || \`AI-TRADER-\${new Date().getTime().toString().slice(-6)}\`}
      />`
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
