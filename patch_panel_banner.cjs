const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Add handlePayFee function
const payFunc = `
  const handlePayFee = async () => {
    try {
      const res = await fetch('/api/pay-fee', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      toast.error('Payment error');
    }
  };
`;
if (!code.includes('handlePayFee = async')) {
  code = code.replace('const [isBotActive, setIsBotActive] = useState(false);', payFunc + '\n  const [isBotActive, setIsBotActive] = useState(false);');
}

// Update the fetch handler
code = code.replace(
  'addLog(`Bot startup failed: ${errData.error || \'Check API keys in settings\'}`, \'error\');',
  `if (errData.feeRequired) setUnpaidFee(errData.amount);
           addLog(\`Bot startup failed: \${errData.error || 'Check API keys in settings'}\`, 'error');`
);

// Add banner
const banner = `
      {unpaidFee > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top fade-in duration-500">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/20 rounded-xl">
                 <Lock className="size-6 text-rose-500" />
              </div>
              <div>
                 <h3 className="text-rose-400 font-bold text-lg">AI Trader Locked</h3>
                 <p className="text-gray-400 text-sm max-w-xl">
                    You have an outstanding profit-share fee of <strong className="text-white">$\${unpaidFee.toFixed(2)}</strong> from your recent successful trades. 
                    Please pay this 1% fee via Stripe to unlock the AI trader for the current day.
                 </p>
              </div>
           </div>
           <button onClick={handlePayFee} className="px-6 py-3 bg-white text-black font-bold rounded-xl shadow-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
              Pay $\${unpaidFee.toFixed(2)} to Unlock
           </button>
        </div>
      )}
`;

if (!code.includes('AI Trader Locked')) {
  code = code.replace('<TickerTape />', '<TickerTape />\n' + banner);
}

// Disable button
code = code.replace(
  'disabled={isBotActive || autoRefresh}',
  'disabled={isBotActive || autoRefresh || unpaidFee > 0}'
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
