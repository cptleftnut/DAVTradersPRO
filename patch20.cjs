const fs = require('fs');
let btp = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

btp = btp.replace(
  `  useEffect(() => {
     if (!walletData) {
        fetchWallet();
     }
  }, []);`,
  `  useEffect(() => {
     fetchWallet();
  }, [isLiveTrading]);`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', btp);
