const fs = require('fs');
let code = fs.readFileSync('src/components/WalletSummaryWidget.tsx', 'utf8');

code = code.replace(
  `  handleDragEnd, 
  moveWidget,
  walletData,
  walletLoading
}: any) => {`,
  `  handleDragEnd, 
  moveWidget,
  walletData,
  walletLoading,
  onOpenDeposit
}: any) => {`
)

code = code.replace(
  `import { GripVertical, ChevronLeft, ChevronRight, Wallet, PieChart as PieChartIcon, ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';`,
  `import { GripVertical, ChevronLeft, ChevronRight, Wallet, PieChart as PieChartIcon, ShieldCheck, ArrowUpRight, Zap, QrCode } from 'lucide-react';`
)

code = code.replace(
  `      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-400 font-mono mb-1 uppercase tracking-wider">Total Est. Værdi (USD)</div>
          <div className="text-4xl font-black tabular-nums tracking-tighter">
             \${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>`,
  `      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-400 font-mono mb-1 uppercase tracking-wider">Total Est. Værdi (USD)</div>
          <div className="text-4xl font-black tabular-nums tracking-tighter">
             \${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <button onClick={onOpenDeposit} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors">
          <QrCode className="size-3.5" />
          Deposit
        </button>
      </div>`
)

fs.writeFileSync('src/components/WalletSummaryWidget.tsx', code);
