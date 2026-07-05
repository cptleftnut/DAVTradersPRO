const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "  tradeCounter: number;\n}",
  "  tradeCounter: number;\n  lastError?: string;\n  lastErrorTime?: number;\n}"
);

fs.writeFileSync('server.ts', content);
