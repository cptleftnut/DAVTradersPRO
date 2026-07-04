const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const oldThrottle = `if (now - lastTradeUpdateTimeRef.current > 250) {`;
const newThrottle = `if (now - lastTradeUpdateTimeRef.current > 1000) {`;
code = code.replace(oldThrottle, newThrottle);

// memoize trades chart data
const oldTradesData = `                              <AreaChart data={[...trades].reverse().map(t => ({
                                 time: new Date(t.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                                 price: parseFloat(t.price)
                              }))}>`;

const memoTradesCode = `
  const tradeChartData = React.useMemo(() => {
    return [...trades].reverse().map(t => ({
      time: new Date(t.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: parseFloat(t.price)
    }));
  }, [trades]);
`;
// Wait, we can just replace it inline if it's too much work to insert useMemo at the top. Let's just insert useMemo at the top of the render block.
// Let's insert it before the first return.

const firstReturn = `  if (!symbol) return null;`;
code = code.replace(firstReturn, memoTradesCode + '\\n  if (!symbol) return null;');

code = code.replace(oldTradesData, `                              <AreaChart data={tradeChartData}>`);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
