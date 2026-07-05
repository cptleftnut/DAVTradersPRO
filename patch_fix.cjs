const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Undo the broken sed
content = content.replace(/tradeAllocation = tradeAllocation \* 1\.25;\n              }\n          }\n          \n          if \(tradeAllocation < 10\) tradeAllocation = 10;/g, 'tradeAllocation = tradeAllocation * 1.25;');

fs.writeFileSync('server.ts', content);
