const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /catch\s*\(\s*error\s*:\s*any\s*\)\s*\{([\s\S]*?)res\.status\(500\)\.json\(\{\s*error\s*:\s*([^}]*)\s*\}\);/g;

code = code.replace(regex, (match, body, errStr) => {
  return `catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('too_many_requests') || error?.message?.includes('depleted')) {
      console.warn("Gemini API Rate limit hit (429)");
      return res.status(429).json({ error: "API kvote overskredet (429). Din saldo er opbrugt eller rate limit nået." });
    }${body}res.status(500).json({ error: ${errStr} });`;
});

fs.writeFileSync('server.ts', code);
