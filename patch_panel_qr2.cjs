const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const oldBannerStart = "{unpaidFee > 0 && (";
const oldBannerEnd = ")}\n\n      {/* Dashboard Layout Toolbar */}";

const startIndex = code.indexOf(oldBannerStart);
if (startIndex !== -1) {
  // Let's just find the next Dashboard Layout Toolbar
  const endIndexStr = "      {/* Dashboard Layout Toolbar */}";
  const endIndex = code.indexOf(endIndexStr, startIndex);
  
  if (endIndex !== -1) {
    const newBanner = `      {unpaidFee > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top fade-in duration-500">
           <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-rose-500/20 rounded-xl shrink-0 mt-1">
                 <Lock className="size-6 text-rose-500" />
              </div>
              <div>
                 <h3 className="text-rose-400 font-bold text-xl mb-2">AI Trader Låst</h3>
                 <p className="text-gray-300 text-sm mb-4">
                    Du har et udestående profit-share gebyr på <strong className="text-white text-lg">\${unpaidFee.toFixed(2)} USDT</strong> fra dine seneste succesfulde handler. 
                    Overfør venligst beløbet til følgende Binance (TRC20) adresse for at låse op for AI traderen igen i dag.
                 </p>
                 <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-gray-800 w-max">
                    <code className="text-emerald-400 font-mono text-sm break-all">TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</code>
                    <button onClick={handleCopyAddress} className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition-colors" title="Kopiér adresse">
                       <Wallet className="size-4" />
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-4 shrink-0 bg-black/30 p-4 rounded-xl border border-gray-800">
              <div className="bg-white p-2 rounded-lg">
                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t\`} alt="Deposit QR" className="w-32 h-32" />
              </div>
              <button onClick={handlePayFee} className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2">
                 <RefreshCw className="size-4" />
                 Jeg har overført
              </button>
           </div>
        </div>
      )}\n\n`;
      
    code = code.substring(0, startIndex) + newBanner + code.substring(endIndex);
    fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
    console.log("Replaced banner");
  }
}
