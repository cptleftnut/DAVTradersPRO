const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const manualEndpoint = `
app.post('/api/pay-fee-manual', async (req, res) => {
  try {
    botState.unpaidFee = 0;
    botState.isActive = true; // Auto resume maybe, or let user start it
    await saveBotState();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear fee' });
  }
});
`;

if (!code.includes('/api/pay-fee-manual')) {
    code = code.replace("async function startServer() {", manualEndpoint + "\nasync function startServer() {");
    fs.writeFileSync('server.ts', code);
}
