const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "// Entry",
  "if (tradeAllocation < 10) tradeAllocation = 10;\n          // Entry"
);

content = content.replace(
  "// Strategy-guided Trading logic - Entry",
  "if (tradeAllocation < 10) tradeAllocation = 10;\n        // Strategy-guided Trading logic - Entry"
);

fs.writeFileSync('server.ts', content);
