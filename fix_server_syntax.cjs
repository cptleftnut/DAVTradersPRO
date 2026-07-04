const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const badCodeRegex = /const session = await stripe\.checkout[\s\S]*?\}\);\n  \} catch \(err: any\) \{\n     res\.status\(400\)\.send\(`Webhook Error: \$\{err\.message\}`\);\n  \}\}\);/g;

code = code.replace(badCodeRegex, "");

fs.writeFileSync('server.ts', code);
