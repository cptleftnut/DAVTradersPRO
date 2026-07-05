const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`  app.get("/api/wallet", async (req, res) => {`,
`  app.get("/api/force-reset", async (req, res) => {
    try {
      const docRef = doc(db, 'wallet', 'simulated');
      const resetWallet = {
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
      simulatedWallet = resetWallet;
      await setDoc(docRef, simulatedWallet);
      res.json({ success: true, message: "Forced wallet reset to 0.35 SOL" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wallet", async (req, res) => {`
);

fs.writeFileSync('server.ts', code);
