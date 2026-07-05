const fs = require('fs');
let btp = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

btp = btp.replace(
  `    if (!walletData || !walletData.spot) {
         toast.error("Kan ikke indlæse wallet data. Vent venligst.");
         return;
    }`,
  `    if (walletLoading) {
         toast.info("Indlæser wallet data, vent venligst...");
         return;
    }
    if (!walletData || !walletData.spot) {
         toast.error("Kunne ikke indlæse wallet data. Prøver at hente igen...");
         fetchWallet();
         return;
    }`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', btp);
