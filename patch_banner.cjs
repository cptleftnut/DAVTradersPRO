const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const banner = `
      {/* Paper Trading Banner */}
      {!isLiveTrading && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
           <ShieldCheck className="size-4" />
           Practice Mode Active: Simulating trades with fake funds
        </div>
      )}
      <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-950">
`;

content = content.replace(
  '<div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-950">',
  banner
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
