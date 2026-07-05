const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

if (!content.includes('import { TradeDiagnosticModal }')) {
  content = content.replace(
    "import { AiProModal } from './AiProModal';",
    "import { AiProModal } from './AiProModal';\nimport { TradeDiagnosticModal } from './TradeDiagnosticModal';\nimport { ShieldAlert } from 'lucide-react';"
  );
}

if (!content.includes('const [showDiagnostics, setShowDiagnostics]')) {
  content = content.replace(
    "const [showProModal, setShowProModal] = useState(false);",
    "const [showProModal, setShowProModal] = useState(false);\n  const [showDiagnostics, setShowDiagnostics] = useState(false);"
  );
}

const diagBtn = `
            <button 
               onClick={() => setShowDiagnostics(true)}
               className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-2"
            >
               <ShieldAlert className="size-3.5" />
               Fejllogs & Diagnostik
            </button>
            <button 
                onClick={resetWidgetOrder}
`;

content = content.replace(
  "            <button \n                onClick={resetWidgetOrder}",
  diagBtn
);

const diagModalCode = `
      {showProModal && <AiProModal onClose={() => setShowProModal(false)} />}
      {showDiagnostics && <TradeDiagnosticModal onClose={() => setShowDiagnostics(false)} />}
`;

content = content.replace(
  "{showProModal && <AiProModal onClose={() => setShowProModal(false)} />}",
  diagModalCode
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
