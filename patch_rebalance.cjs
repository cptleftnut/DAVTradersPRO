const fs = require('fs');
const file = 'src/components/RebalanceSuggestion.tsx';
let code = fs.readFileSync(file, 'utf8');

const searchCode = `
        const relevantAssets = data.spot.filter(
          (s: any) => parseFloat(s.free) > 0 || parseFloat(s.locked) > 0
        );

        const activeTargets = targets[userProfile as keyof typeof targets] || targets["Balanceret"];

        for (const s of relevantAssets) {
          const qty = parseFloat(s.free) + parseFloat(s.locked);
          let price = 1;

          if (s.asset !== "USDT" && s.asset !== "USDC") {
            try {
              const pRes = await fetch(\`/api/binance-proxy/ticker/price?symbol=\${s.asset}USDT\`);
              if (pRes.ok) {
                const json = await pRes.json();
                price = parseFloat(json.price);
              }
            } catch (e) {}
          }

          const val = qty * price;
          totalUsdtValue += val;
          newHoldings.push({
            asset: s.asset,
            weight: 0,
            targetWeight: activeTargets.find(t => t.asset === s.asset)?.targetWeight || 0,
            value: val,
            currentQty: qty,
            price: price
          });
        }

        // Add zero balance targets that should be bought
        for (const t of activeTargets) {
           if (!newHoldings.find(h => h.asset === t.asset)) {
               newHoldings.push({
                   asset: t.asset,
                   weight: 0,
                   targetWeight: t.targetWeight,
                   value: 0,
                   currentQty: 0,
                   price: 1 // We'd ideally fetch this, but for USDT it's 1. For others, let's fetch.
               });
           }
        }

        // Fetch prices for zero balance targets
        for (let i=0; i<newHoldings.length; i++) {
           const h = newHoldings[i];
           if (h.value === 0 && h.asset !== "USDT" && h.asset !== "USDC") {
               try {
                  const pRes = await fetch(\`/api/binance-proxy/ticker/price?symbol=\${h.asset}USDT\`);
                  if (pRes.ok) {
                    const json = await pRes.json();
                    h.price = parseFloat(json.price);
                  }
                } catch (e) {}
           }
        }
`;

const replaceCode = `
        const relevantAssets = data.spot.filter(
          (s: any) => parseFloat(s.free) > 0 || parseFloat(s.locked) > 0
        );

        const activeTargets = targets[userProfile as keyof typeof targets] || targets["Balanceret"];

        const fetchAssetPrice = async (asset: string) => {
          if (asset === "USDT" || asset === "USDC") return 1;
          try {
            const pRes = await fetch(\`/api/binance-proxy/ticker/price?symbol=\${asset}USDT\`);
            if (pRes.ok) {
              const json = await pRes.json();
              return parseFloat(json.price);
            }
          } catch (e) {}
          return 1;
        };

        const assetsWithPrices = await Promise.all(
          relevantAssets.map(async (s: any) => {
            const qty = parseFloat(s.free) + parseFloat(s.locked);
            const price = await fetchAssetPrice(s.asset);
            return { s, qty, price };
          })
        );

        for (const item of assetsWithPrices) {
          const { s, qty, price } = item;
          const val = qty * price;
          totalUsdtValue += val;
          newHoldings.push({
            asset: s.asset,
            weight: 0,
            targetWeight: activeTargets.find(t => t.asset === s.asset)?.targetWeight || 0,
            value: val,
            currentQty: qty,
            price: price
          });
        }

        // Add zero balance targets that should be bought
        for (const t of activeTargets) {
           if (!newHoldings.find(h => h.asset === t.asset)) {
               newHoldings.push({
                   asset: t.asset,
                   weight: 0,
                   targetWeight: t.targetWeight,
                   value: 0,
                   currentQty: 0,
                   price: 1 // We'd ideally fetch this, but for USDT it's 1. For others, let's fetch.
               });
           }
        }

        // Fetch prices for zero balance targets concurrently
        await Promise.all(newHoldings.map(async (h) => {
           if (h.value === 0 && h.asset !== "USDT" && h.asset !== "USDC") {
               h.price = await fetchAssetPrice(h.asset);
           }
        }));
`;

if (code.includes(searchCode.trim())) {
    fs.writeFileSync(file, code.replace(searchCode, replaceCode));
    console.log('Patched successfully');
} else {
    console.log('Search code not found. Trying flexible replace...');
    // Just for safety if formatting is slightly off
}
