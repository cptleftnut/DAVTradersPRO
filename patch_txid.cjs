const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const newHandlePayFee = `
  const [txid, setTxid] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  const handlePayFee = async () => {
    if (!txid || txid.trim().length < 10) {
      toast.error('Indtast venligst et gyldigt Transaktions-ID (TXID) først.');
      return;
    }
    
    setIsSubmittingTx(true);
    try {
      const res = await fetch('/api/pay-fee-manual', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid })
      });
      if (res.ok) {
        setUnpaidFee(0);
        setTxid('');
        toast.success('Betaling bekræftet via TXID. AI Trader er låst op!');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        toast.error('Kunne ikke registrere betaling.');
      }
    } catch (err) {
      toast.error('Payment error');
    } finally {
      setIsSubmittingTx(false);
    }
  };
`;

code = code.replace(/const handlePayFee = async \(\) => \{[\s\S]*?toast\.error\('Payment error'\);\n\s*\}\n\s*\};/, newHandlePayFee);

const oldBanner = `           <div className="flex flex-col items-center gap-4 shrink-0 bg-black/30 p-4 rounded-xl border border-gray-800">
              <div className="bg-white p-2 rounded-lg">
                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t\`} alt="Deposit QR" className="w-32 h-32" />
              </div>
              <button onClick={handlePayFee} className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2">
                 <RefreshCw className="size-4" />
                 Jeg har overført
              </button>
           </div>`;

const newBanner = `           <div className="flex flex-col items-center gap-4 shrink-0 bg-black/30 p-4 rounded-xl border border-gray-800 w-full md:w-auto">
              <div className="bg-white p-2 rounded-lg hidden md:block">
                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t\`} alt="Deposit QR" className="w-32 h-32" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Indsæt TXID (Transaktions-ID) her..."
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handlePayFee} 
                  disabled={isSubmittingTx}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                >
                   {isSubmittingTx ? <RefreshCw className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                   Bekræft Betaling
                </button>
              </div>
           </div>`;

code = code.replace(oldBanner, newBanner);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
