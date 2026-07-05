const fs = require('fs');

const prices = `
        } else if (item.asset === 'SPY') {
            value = amount * 510.50;
        } else if (item.asset === 'QQQ') {
            value = amount * 440.20;
        } else if (item.asset === 'VOO') {
            value = amount * 460.10;
        } else if (item.asset === 'ARKK') {
            value = amount * 50.30;
        } else if (item.asset === 'TLT') {
            value = amount * 90.50;
        } else if (item.asset === 'BND') {
            value = amount * 72.10;
        } else if (item.asset === 'AGG') {
            value = amount * 97.40;
        } else if (item.asset === 'LQD') {
            value = amount * 105.20;
        } else {
`;

function injectPrices(file, searchStr) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(searchStr, prices);
  fs.writeFileSync(file, content);
}

// PortfolioSummary.tsx has this twice (totalBalance and topAssets)
let ps = fs.readFileSync('src/components/PortfolioSummary.tsx', 'utf8');
ps = ps.replaceAll(
  `} else {
            total += amount * 1; // Default
        }`,
  `} else if (item.asset === 'SPY') { total += amount * 510.50;
        } else if (item.asset === 'QQQ') { total += amount * 440.20;
        } else if (item.asset === 'VOO') { total += amount * 460.10;
        } else if (item.asset === 'ARKK') { total += amount * 50.30;
        } else if (item.asset === 'TLT') { total += amount * 90.50;
        } else if (item.asset === 'BND') { total += amount * 72.10;
        } else if (item.asset === 'AGG') { total += amount * 97.40;
        } else if (item.asset === 'LQD') { total += amount * 105.20;
        } else { total += amount * 1; }`
);

ps = ps.replaceAll(
  `} else {
            value = amount * 1;
        }`,
  `} else if (item.asset === 'SPY') { value = amount * 510.50;
        } else if (item.asset === 'QQQ') { value = amount * 440.20;
        } else if (item.asset === 'VOO') { value = amount * 460.10;
        } else if (item.asset === 'ARKK') { value = amount * 50.30;
        } else if (item.asset === 'TLT') { value = amount * 90.50;
        } else if (item.asset === 'BND') { value = amount * 72.10;
        } else if (item.asset === 'AGG') { value = amount * 97.40;
        } else if (item.asset === 'LQD') { value = amount * 105.20;
        } else { value = amount * 1; }`
);

fs.writeFileSync('src/components/PortfolioSummary.tsx', ps);

let ws = fs.readFileSync('src/components/WalletSummaryWidget.tsx', 'utf8');
ws = ws.replace(
  `} else {
            total += amount * 1; // Default
        }`,
  `} else if (item.asset === 'SPY') { total += amount * 510.50;
        } else if (item.asset === 'QQQ') { total += amount * 440.20;
        } else if (item.asset === 'VOO') { total += amount * 460.10;
        } else if (item.asset === 'ARKK') { total += amount * 50.30;
        } else if (item.asset === 'TLT') { total += amount * 90.50;
        } else if (item.asset === 'BND') { total += amount * 72.10;
        } else if (item.asset === 'AGG') { total += amount * 97.40;
        } else if (item.asset === 'LQD') { total += amount * 105.20;
        } else { total += amount * 1; }`
);

ws = ws.replace(
  `} else {
            value = amount * 1;
        }`,
  `} else if (item.asset === 'SPY') { value = amount * 510.50;
        } else if (item.asset === 'QQQ') { value = amount * 440.20;
        } else if (item.asset === 'VOO') { value = amount * 460.10;
        } else if (item.asset === 'ARKK') { value = amount * 50.30;
        } else if (item.asset === 'TLT') { value = amount * 90.50;
        } else if (item.asset === 'BND') { value = amount * 72.10;
        } else if (item.asset === 'AGG') { value = amount * 97.40;
        } else if (item.asset === 'LQD') { value = amount * 105.20;
        } else { value = amount * 1; }`
);

fs.writeFileSync('src/components/WalletSummaryWidget.tsx', ws);

