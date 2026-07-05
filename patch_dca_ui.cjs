const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// initial state
content = content.replace(
  "const [dcaAllocation, setDcaAllocation] = useState(1.0);",
  "const [dcaAllocation, setDcaAllocation] = useState(10.0);"
);

content = content.replace(
  'min="0.1" max="100.0" step="0.1" value={dcaAllocation} onChange={(e) => setDcaAllocation(Number(e.target.value))}',
  'min="10.0" max="100.0" step="1.0" value={dcaAllocation} onChange={(e) => setDcaAllocation(Number(e.target.value))}'
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
