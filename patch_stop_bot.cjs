const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /console\.log\(`\[Fee\] Calculated \$\{fee\} fee for \$\{totalRealizedGains\} gains on \$\{botState\.lastFeeCalculationDate\}`\);/g,
  `console.log(\`[Fee] Calculated \${fee} fee for \${totalRealizedGains} gains on \${botState.lastFeeCalculationDate}\`);\n      if (botState.isActive) {\n        console.log('[Fee] Stopping bot due to unpaid fee');\n        botState.isActive = false;\n        // stopBot() might not be fully hoisted if it uses variables, but let's just set isActive=false to pause it and let the loop naturally stop or we call stopBot()\n        try { stopBot(); } catch(e) {}\n      }`
);

fs.writeFileSync('server.ts', code);
