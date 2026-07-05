const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
`const AVAILABLE_PAIRS = [
  { value: "BTCUSDT", label: "BTC/USDT (Bitcoin)" },
  { value: "ETHUSDT", label: "ETH/USDT (Ethereum)" },
  { value: "SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "BNBUSDT", label: "BNB/USDT (Binance Coin)" },
  { value: "DOGEUSDT", label: "DOGE/USDT (Dogecoin)" },
  { value: "AVAXUSDT", label: "AVAX/USDT (Avalanche)" },
  { value: "LINKUSDT", label: "LINK/USDT (Chainlink)" },
  { value: "XRPUSDT", label: "XRP/USDT (Ripple)" },
  { value: "ADAUSDT", label: "ADA/USDT (Cardano)" },
  { value: "BTCUSDC", label: "BTC/USDC (Bitcoin)" },
  { value: "ETHUSDC", label: "ETH/USDC (Ethereum)" },
  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },
  { value: "BNBUSDC", label: "BNB/USDC (Binance Coin)" },
  { value: "DOGEUSDC", label: "DOGE/USDC (Dogecoin)" },
];`,
`const AVAILABLE_PAIRS = [
  // Krypto
  { value: "BTCUSDT", label: "BTC/USDT (Bitcoin)" },
  { value: "ETHUSDT", label: "ETH/USDT (Ethereum)" },
  { value: "SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "BNBUSDT", label: "BNB/USDT (Binance Coin)" },
  { value: "DOGEUSDT", label: "DOGE/USDT (Dogecoin)" },
  
  // ETF'er
  { value: "SPYUSDT", label: "SPY (S&P 500 ETF)" },
  { value: "QQQUSDT", label: "QQQ (Nasdaq 100 ETF)" },
  { value: "VOOUSDT", label: "VOO (Vanguard S&P 500 ETF)" },
  { value: "ARKKUSDT", label: "ARKK (Innovation ETF)" },

  // Obligationer
  { value: "TLTUSDT", label: "TLT (20+ Year Treasury Bond)" },
  { value: "BNDUSDT", label: "BND (Total Bond Market)" },
  { value: "AGGUSDT", label: "AGG (Core US Aggregate Bond)" },
  { value: "LQDUSDT", label: "LQD (Inv. Grade Corporate)" },
];`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
