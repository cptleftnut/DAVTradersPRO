const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const newHandlePayFee = `
  const handlePayFee = async () => {
    try {
      const res = await fetch('/api/pay-fee-manual', { method: 'POST' });
      if (res.ok) {
        setUnpaidFee(0);
        toast.success('Betaling registreret. AI Trader er nu låst op!');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        toast.error('Kunne ikke registrere betaling.');
      }
    } catch (err) {
      toast.error('Payment error');
    }
  };
  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
    toast.success('Adresse kopieret til udklipsholder');
  };
`;

code = code.replace(/const handlePayFee = async \(\) => \{[\s\S]*?toast\.error\('Payment error'\);\n\s*\}\n\s*\};/, newHandlePayFee);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
