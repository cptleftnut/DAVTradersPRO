const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Change 3a
code = code.replace(
  /const entryPrice = await executeTradeInternal\(botState\.symbol, 'BUY', tradeAllocation\);\s*botState\.activePositionsList\.push\(\{ id: Math\.random\(\)\.toString\(36\)\.substring\(7\), price: entryPrice \|\| currentP, time: now, status: 'LIVE', maxProfitPct: 0 \}\);/,
  `const entryResult = await executeTradeInternal(botState.symbol, 'BUY', tradeAllocation);
                      botState.activePositionsList.push({ id: Math.random().toString(36).substring(7), price: entryResult.price || currentP, time: now, status: 'LIVE', maxProfitPct: 0, entryOrderId: entryResult.orderId, entryFee: entryResult.fee });`
);

// Change 3b
const target3b = \`const exitPrice = await executeTradeInternal(botState.symbol, 'SELL', tradeAllocation);
                    const finalExitPrice = exitPrice || currentP;
                    const rawPnl = (finalExitPrice - entry.price) * (tradeAllocation / entry.price);
                    const feeAmount = (tradeAllocation * 0.001);
                    const netPnl = rawPnl - feeAmount * 2;
                    
                    botState.orderHistory.unshift({
                       id: \\\`ORD-\\\${entry.id || Date.now().toString().slice(-6)}\\\`,
                       symbol: botState.symbol.replace(/USDT|USDC/g, ''),
                       type: 'SELL',
                       pnl: netPnl,
                       time: new Date(),
                       duration: \\\`\\\${Math.floor((now - entry.time) / 1000)}s\\\`,
                       entryPrice: entry.price,
                       exitPrice: currentP,
                       profitPercent: ((currentP - entry.price) / entry.price) * 100
                    });\`;
                    
const repl3b = \`const exitResult = await executeTradeInternal(botState.symbol, 'SELL', tradeAllocation);
                    const finalExitPrice = exitResult.price || currentP;
                    const entryExtended2 = entry as any;
                    const entryFee = entryExtended2.entryFee || 0;
                    const totalFee = entryFee + (exitResult.fee || 0);
                    const rawPnl = (finalExitPrice - entry.price) * (tradeAllocation / entry.price);
                    const netPnl = rawPnl - totalFee;
                    
                    botState.orderHistory.unshift({
                       id: \\\`ORD-\\\${entry.id || Date.now().toString().slice(-6)}\\\`,
                       symbol: botState.symbol.replace(/USDT|USDC/g, ''),
                       type: 'SELL',
                       pnl: netPnl,
                       time: new Date(),
                       duration: \\\`\\\${Math.floor((now - entry.time) / 1000)}s\\\`,
                       entryPrice: entry.price,
                       exitPrice: finalExitPrice,
                       profitPercent: ((finalExitPrice - entry.price) / entry.price) * 100,
                       fee: totalFee,
                       txHash: exitResult.txHash
                    });\`;
                    
code = code.replace(target3b, repl3b);

// Change 3c
code = code.replace(
  /const actualPrice = await executeTradeInternal\(symbol, 'BUY', alloc\);\s*const finalPrice = actualPrice \|\| currentP;/,
  `const dcaResult = await executeTradeInternal(symbol, 'BUY', alloc);
             const finalPrice = dcaResult.price || currentP;`
);

fs.writeFileSync('server.ts', code);
