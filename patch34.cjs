const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
`  const handleSaveToCalendar = async () => {`,
`  const [isResettingPerformance, setIsResettingPerformance] = useState(false);
  
  const handleResetPerformance = async () => {
    if (!window.confirm("Er du sikker på, at du vil nulstille AI Performance? Dette vil slette din ordrehistorik og nulstille statistikken.")) return;
    
    setIsResettingPerformance(true);
    try {
      const res = await fetch('/api/bot/reset-performance', { method: 'POST' });
      if (!res.ok) throw new Error("Fejl ved nulstilling");
      addLog("AI Performance er blevet nulstillet.", "info");
      
      // Update state locally to reflect immediately
      setOrderHistory([]);
      setTotalPnl(0);
      setDailyFeeDebt(0);
      
    } catch (err: any) {
      addLog(\`Nulstilling fejlede: \${err.message || err}\`, "error");
    } finally {
      setIsResettingPerformance(false);
    }
  };

  const handleSaveToCalendar = async () => {`
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
