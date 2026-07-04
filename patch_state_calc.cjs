const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.get\('\/api\/bot\/state', \(req, res\) => \{\s+res\.json\(botState\);\s+\}\);/g, "app.get('/api/bot/state', async (req, res) => {\n   await calculateDailyFee();\n   res.json(botState);\n});");

fs.writeFileSync('server.ts', code);
