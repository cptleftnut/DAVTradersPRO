const fs = require('fs');
let code = fs.readFileSync('src/components/WalletSummaryWidget.tsx', 'utf8');

code = code.replace(
`    <motion.div 
      layout
      style={{ order: widgetOrder.indexOf('walletSummary') }}
      className={\`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 \${draggedIndex === widgetOrder.indexOf('walletSummary') ? 'opacity-40 ring-2 ring-emerald-500/40 bg-emerald-500/5' : ''}\`}
    >`,
`    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: widgetOrder.indexOf('walletSummary') * 0.1, ease: 'easeOut' }}
      style={{ order: widgetOrder.indexOf('walletSummary') }}
      className={\`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 \${draggedIndex === widgetOrder.indexOf('walletSummary') ? 'opacity-40 ring-2 ring-emerald-500/40 bg-emerald-500/5' : ''}\`}
    >`
);

fs.writeFileSync('src/components/WalletSummaryWidget.tsx', code);
