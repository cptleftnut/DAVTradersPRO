const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Add lastError to BotState
content = content.replace(
  "  tradeCounter: number;\n}",
  "  tradeCounter: number;\n  lastError?: string;\n  lastErrorTime?: number;\n}"
);

content = content.replace(
  "    const client = new Spot(apiKey, apiSecret);",
  "    const client = new Spot(apiKey, apiSecret);\n    botState.lastError = undefined;" // clear previous error
);

content = content.replace(
  "      throw new Error(`Binance Order Error: ${err.message || (err.response?.data ? JSON.stringify(err.response.data) : null) || err}`);",
  "      const errMsg = `Binance Order Error: ${err.message || (err.response?.data ? JSON.stringify(err.response.data) : null) || err}`;\n      botState.lastError = errMsg;\n      botState.lastErrorTime = Date.now();\n      throw new Error(errMsg);"
);

content = content.replace(
  "    if (allocation < 10) {\n        throw new Error(\"Minimum order size on Binance is 10 USDT\");\n    }",
  "    if (allocation < 10) {\n        const errMsg = \"Minimum order size on Binance is 10 USDT. Please increase your allocation.\";\n        botState.lastError = errMsg;\n        botState.lastErrorTime = Date.now();\n        throw new Error(errMsg);\n    }"
);

// Fix hardcoded balance
content = content.replace(
  /const balance = 10;/g,
  "const balance = botState.dailyStartPortfolioValue || 1000;"
);

// In the catch blocks for executeTradeInternal, add to orderHistory as FAILED so it shows up in UI
content = content.replace(
  "                   } catch (e) {\n                      console.warn(\"Live entry failed\", e);\n                   }",
  "                   } catch (e: any) {\n                      console.warn(\"Live entry failed\", e);\n                      botState.orderHistory.unshift({\n                         id: `ERR-${Date.now().toString().slice(-6)}`,\n                         symbol: botState.symbol.replace(/USDT|USDC/g, ''),\n                         type: 'FAILED BUY',\n                         pnl: 0,\n                         time: new Date(),\n                         duration: e.message || 'Error'\n                      });\n                      botState.isActive = false; // Stop the bot so the user notices\n                   }"
);

content = content.replace(
  "                 } catch (e) {\n                    console.warn(\"Live exit failed\", e);\n                 }",
  "                 } catch (e: any) {\n                    console.warn(\"Live exit failed\", e);\n                    botState.orderHistory.unshift({\n                       id: `ERR-${Date.now().toString().slice(-6)}`,\n                       symbol: botState.symbol.replace(/USDT|USDC/g, ''),\n                       type: 'FAILED SELL',\n                       pnl: 0,\n                       time: new Date(),\n                       duration: e.message || 'Error'\n                    });\n                 }"
);

content = content.replace(
  "                 } catch (e) {\n                     console.warn(\"Live DCA entry failed\", e);\n                 }",
  "                 } catch (e: any) {\n                     console.warn(\"Live DCA entry failed\", e);\n                     botState.orderHistory.unshift({\n                        id: `ERR-${Date.now().toString().slice(-6)}`,\n                        symbol: botState.symbol.replace(/USDT|USDC/g, ''),\n                        type: 'FAILED DCA',\n                        pnl: 0,\n                        time: new Date(),\n                        duration: e.message || 'Error'\n                     });\n                 }"
);

fs.writeFileSync('server.ts', content);
