const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const effectCode = `  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fee_success') === 'true') {
      toast.success('Fee payment successful! AI Trader unlocked.');
      setUnpaidFee(0);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('fee_canceled') === 'true') {
      toast.error('Fee payment canceled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);`;

code = code.replace(effectCode, "");

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
