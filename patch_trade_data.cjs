const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const target = `  return (
    <>`;
    
const replacement = `  const tradeChartData = React.useMemo(() => {
    return [...trades].reverse().map(t => ({
      time: new Date(t.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: parseFloat(t.price)
    }));
  }, [trades]);

  return (
    <>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
