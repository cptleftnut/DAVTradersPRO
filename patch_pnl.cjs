const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const oldCode = `  let currentCumPnlState = 0;
  const pnlChartData = [...orderHistory].reverse().map(o => {
    currentCumPnlState += o.pnl;
    return {
      time: new Date(o.time).toLocaleTimeString(),
      cumPnl: currentCumPnlState,
      pnl: o.pnl
    };
  });`;

const newCode = `  const pnlChartData = React.useMemo(() => {
    let currentCumPnlState = 0;
    return [...orderHistory].reverse().map(o => {
      currentCumPnlState += o.pnl;
      return {
        time: new Date(o.time).toLocaleTimeString(),
        cumPnl: currentCumPnlState,
        pnl: o.pnl
      };
    });
  }, [orderHistory]);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
