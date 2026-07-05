const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

content = content.replace(
  "              let posChanged = state.activePositions !== prevActivePosRef.current;",
  "              let posChanged = state.activePositions !== prevActivePosRef.current;\n              if (state.lastError && state.lastError !== prevLastErrorRef.current) {\n                 addLog(`Fejl fra trading bot: ${state.lastError}`, 'error');\n                 prevLastErrorRef.current = state.lastError;\n                 // Ensure we show it as toast too if it's new\n                 toast.error(`Bot Fejl: ${state.lastError}`);\n              }"
);

content = content.replace(
  "  const prevActivePosRef = useRef(0);",
  "  const prevActivePosRef = useRef(0);\n  const prevLastErrorRef = useRef<string | null>(null);"
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
