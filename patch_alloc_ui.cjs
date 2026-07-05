const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// initial state
content = content.replace(
  "const [allocation, setAllocation] = useState(2);",
  "const [allocation, setAllocation] = useState(10);"
);

// state from backend
content = content.replace(
  "setAllocation(state.allocation || 2);",
  "setAllocation(state.allocation || 10);"
);

// profiles
content = content.replace(
  "setStrategy('High-Frequency Scalper (HFT)');\n                   setAllocation(2);",
  "setStrategy('High-Frequency Scalper (HFT)');\n                   setAllocation(20);"
);

content = content.replace(
  "setStrategy('Value Mean-Reversion');\n                   setAllocation(1);",
  "setStrategy('Value Mean-Reversion');\n                   setAllocation(10);"
);

content = content.replace(
  "setStrategy('Momentum Swing Trader');\n                   setAllocation(1.5);",
  "setStrategy('Momentum Swing Trader');\n                   setAllocation(15);"
);

content = content.replace(
  "setStrategy('Risk-Controlled Trend Following');\n                   setAllocation(1.5);",
  "setStrategy('Risk-Controlled Trend Following');\n                   setAllocation(15);"
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
