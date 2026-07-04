const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
app.post("/api/gemini/analyze-market", async (req, res) => {
  try {
    const { symbol, marketData, model = "gemini-3.5-flash" } = req.body;
    const ai = getAiClient();
    
    const isAgent = model.includes("antigravity") || model.includes("deep-research");
    const params: any = {
      input: \`Analyze the current market data for \${symbol}: \${JSON.stringify(marketData)}. Based on this data, recommend a buy, sell, or hold action. Provide a short reason. Format your response as a JSON object with keys: "action" (BUY, SELL, or HOLD) and "reason" (short string).\`,
    };
    if (isAgent) {
      params.agent = model;
      params.environment = "remote";
    } else {
      params.model = model;
    }
    const interaction = await ai.interactions.create(params, { timeout: 30000 });
    
    const fullOutput = interaction.steps
      .filter((step: any) => step.type === 'model_output')
      .map((step: any) => step.content?.find((c: any) => c.type === 'text')?.text || "")
      .join("");
      
    // Attempt to parse JSON from output
    let action = "HOLD";
    let reason = "AI Analysis unavailable";
    try {
      const match = fullOutput.match(/\\{.*\\}/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        action = parsed.action || "HOLD";
        reason = parsed.reason || reason;
      }
    } catch (e) {
      console.error("Failed to parse Gemini output", fullOutput);
    }
    
    res.json({ action, reason });
  } catch (error: any) {
    console.error("Market analysis error:", error);
    res.status(500).json({ error: "Failed to analyze market." });
  }
});
`;

if (!code.includes("/api/gemini/analyze-market")) {
  code = code.replace('app.post("/api/portfolio-rebalance", async (req, res) => {', routeCode + '\napp.post("/api/portfolio-rebalance", async (req, res) => {');
  fs.writeFileSync('server.ts', code);
}
