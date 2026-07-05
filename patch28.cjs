const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`    const docSnap = await getDoc(docRef);
    if (docSnap.exists) {
      // Force reset as requested
      simulatedWallet = {
        spot: [
          { asset: 'USDT', free: '0.00000000', locked: '0.00000000' },
          { asset: 'BTC', free: '0.00000000', locked: '0.00000000' },
          { asset: 'ETH', free: '0.00000000', locked: '0.00000000' },
          { asset: 'SOL', free: '0.35000000', locked: '0.00000000' },
          { asset: 'BNB', free: '0.00000000', locked: '0.00000000' },
          { asset: 'DOGE', free: '0.00000000', locked: '0.00000000' },
          { asset: 'SPY', free: '0.00000000', locked: '0.00000000' },
          { asset: 'TLT', free: '0.00000000', locked: '0.00000000' }
        ],
        earn: [
          { asset: 'USDT', totalAmount: '0.00000000', totalValueInBTC: '0.00000000' },
          { asset: 'BTC', totalAmount: '0.00000000', totalValueInBTC: '0.00000000' }
        ]
      };
      await setDoc(docRef, simulatedWallet);
      console.log("Forced wallet reset to 0.35 SOL");`,
`    const docSnap = await getDoc(docRef);
    if (docSnap.exists) {
      simulatedWallet = docSnap.data() as SimulatedWallet;
      console.log("[Firebase] Wallet state loaded successfully.");`
);

fs.writeFileSync('server.ts', code);
