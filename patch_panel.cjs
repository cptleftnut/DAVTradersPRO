const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Add state
if (!code.includes('const [unpaidFee, setUnpaidFee] = useState(0)')) {
  code = code.replace(
    'const [isBotActive, setIsBotActive] = useState(false);',
    'const [isBotActive, setIsBotActive] = useState(false);\n  const [unpaidFee, setUnpaidFee] = useState(0);'
  );
}

// Add state updates
code = code.replace(/setIsBotActive\(state\.isActive\);/g, "setIsBotActive(state.isActive);\n          if (state.unpaidFee !== undefined) setUnpaidFee(state.unpaidFee);");

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
