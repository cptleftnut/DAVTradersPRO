const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf("async function startServer() {");
const before = code.substring(0, startIndex);

const cleanStartServer = `async function startServer() {
  console.log("Starting server...");
  
  // Load persistent state
  await loadBotState();
  await loadWallet();

  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite middleware for development...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up production static serving...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server successfully listening on port \${PORT}\`);
  });
}

startServer().catch(err => {
    console.error("Failed to start server", err);
    process.exit(1);
});
`;

code = before + cleanStartServer;

fs.writeFileSync('server.ts', code);
