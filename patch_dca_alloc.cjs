const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "const alloc = botState.dcaAllocation!;",
  "let alloc = botState.dcaAllocation!;\n         if (alloc < 10) alloc = 10;"
);

fs.writeFileSync('server.ts', content);
