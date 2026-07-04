const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const effect = `
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fee_success') === 'true') {
      toast.success('Fee payment successful! AI Trader unlocked.');
      setUnpaidFee(0);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('fee_canceled') === 'true') {
      toast.error('Fee payment canceled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
`;

if (!code.includes('fee_success')) {
  code = code.replace('useEffect(() => {', effect + '\n  useEffect(() => {');
}

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
