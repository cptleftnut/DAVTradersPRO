const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// The line is: const [dailyStats, setDailyStats] = useState({ changePercent: 0, volume: '0', high: '0', low: '0' });
code = code.replace(/const \[dailyStats, setDailyStats\] = useState\(\{ changePercent: 0, volume: '0', high: '0', low: '0' \}\);\n/, '');

// Add it back before aiStrategyEnabled
const toReplace = `  const [aiStrategyEnabled, setAiStrategyEnabled] = useState(false);`;
const replacement = `  const [dailyStats, setDailyStats] = useState({ changePercent: 0, volume: '0', high: '0', low: '0' });\n  const [aiStrategyEnabled, setAiStrategyEnabled] = useState(false);`;
code = code.replace(toReplace, replacement);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
