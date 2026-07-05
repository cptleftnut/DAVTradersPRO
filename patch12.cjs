const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Remove PORTFOLIO GROWTH WIDGET
const p1Start = code.indexOf('{/* PORTFOLIO GROWTH WIDGET */}');
const p1End = code.indexOf('<motion.div \n          layout\n          style={{ order: widgetOrder.indexOf(\'risikostyring\') }}');
if (p1Start !== -1 && p1End !== -1) {
  code = code.substring(0, p1Start) + code.substring(p1End);
}

// Remove UpgradesStoreWidget
const p2Start = code.indexOf('<UpgradesStoreWidget');
const p2End = code.indexOf('/>', p2Start) + 2;
if (p2Start !== -1 && p2End !== -1) {
  code = code.substring(0, p2Start) + code.substring(p2End);
}

// Remove import of UpgradesStoreWidget
code = code.replace("import { UpgradesStoreWidget } from './UpgradesStoreWidget';\n", "");

// Modify widget order
code = code.replace(
  `        if (parsed.length === 8) return parsed;
        if (parsed.length === 7) return [...parsed, 'upgradesStore'];
        if (parsed.length === 6) return [...parsed, 'walletSummary'];
      } catch (e) {}
    }
    return ['agentControl', 'walletSummary', 'upgradesStore', 'realtimeTabs', 'aiPerformance', 'portfolioGrowth', 'risikostyring', 'maeglerforbindelse'];`,
  `        if (parsed.length === 6) return parsed;
      } catch (e) {}
    }
    return ['agentControl', 'walletSummary', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];`
);

code = code.replace(
  `    const defaultOrder = ['agentControl', 'walletSummary', 'upgradesStore', 'realtimeTabs', 'aiPerformance', 'portfolioGrowth', 'risikostyring', 'maeglerforbindelse'];`,
  `    const defaultOrder = ['agentControl', 'walletSummary', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];`
);

code = code.replace(
  `    portfolioGrowth: "Portfolio Vækst (30 Dage)",`,
  ``
);

code = code.replace(
  `    upgradesStore: "Premium Butik & Upgrades",`,
  ``
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
