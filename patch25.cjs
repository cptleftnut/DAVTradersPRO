const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioAllocationChart.tsx', 'utf8');

code = code.replace(
`    const holdings = walletData.spot.map((b: any) => ({
      name: b.asset,
      value: parseFloat(b.free) + parseFloat(b.locked || '0'),
    })).filter((h: any) => h.value > 0);
    return holdings;`,
`    const holdings = walletData.spot.map((b: any) => {
      let category = 'Krypto';
      if (['SPY', 'QQQ', 'VOO', 'ARKK'].includes(b.asset)) category = 'ETF';
      else if (['TLT', 'BND', 'AGG', 'LQD'].includes(b.asset)) category = 'Obligationer';
      else if (['USDT', 'USDC', 'BUSD', 'DAI'].includes(b.asset)) category = 'Cash (Stablecoins)';

      const amount = parseFloat(b.free) + parseFloat(b.locked || '0');
      let valueInUsd = amount;
      if (b.asset === 'BTC') valueInUsd *= 68350.20;
      else if (b.asset === 'ETH') valueInUsd *= 3490.15;
      else if (b.asset === 'BNB') valueInUsd *= 585.30;
      else if (b.asset === 'SOL') valueInUsd *= 156.70;
      else if (b.asset === 'SPY') valueInUsd *= 510.50;
      else if (b.asset === 'QQQ') valueInUsd *= 440.20;
      else if (b.asset === 'VOO') valueInUsd *= 460.10;
      else if (b.asset === 'ARKK') valueInUsd *= 50.30;
      else if (b.asset === 'TLT') valueInUsd *= 90.50;
      else if (b.asset === 'BND') valueInUsd *= 72.10;
      else if (b.asset === 'AGG') valueInUsd *= 97.40;
      else if (b.asset === 'LQD') valueInUsd *= 105.20;

      return {
        name: b.asset,
        value: valueInUsd,
        amount: amount,
        category
      }
    }).filter((h: any) => h.value > 0);

    const categories = holdings.reduce((acc: any, curr: any) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.value;
      return acc;
    }, {});

    return Object.keys(categories).map(key => ({
      name: key,
      value: categories[key]
    }));`
);

fs.writeFileSync('src/components/PortfolioAllocationChart.tsx', code);
