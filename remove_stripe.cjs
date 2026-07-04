const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove Stripe import
code = code.replace("import Stripe from 'stripe';\n", "");

// Remove Stripe client function
code = code.replace(/let stripeClient: Stripe \| null = null;[\s\S]*?return stripeClient;\n}\n/, "");

// Remove /api/pay-fee and /api/webhook/stripe endpoints
code = code.replace(/app\.post\('\/api\/pay-fee', async \(req, res\) => \{[\s\S]*?\}\);\n/, "");
code = code.replace(/app\.post\('\/api\/webhook\/stripe', express\.raw\(\{ type: 'application\/json' \}\), async \(req, res\) => \{[\s\S]*?\}\);\n/, "");

// Add a simple mock endpoint to clear the fee
const mockEndpoint = `
app.post('/api/pay-fee-manual', async (req, res) => {
  try {
    botState.unpaidFee = 0;
    await saveBotState();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear fee' });
  }
});
`;

if (!code.includes('/api/pay-fee-manual')) {
    code = code.replace("app.get('*',", mockEndpoint + "\n    app.get('*',");
}

fs.writeFileSync('server.ts', code);
