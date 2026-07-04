const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

// Add refs
const refsCode = `  const wsRef = useRef<WebSocket | null>(null);
  const tradeBufferRef = useRef<any[]>([]);
  const lastTradeUpdateTimeRef = useRef<number>(0);`;
code = code.replace("  const wsRef = useRef<WebSocket | null>(null);", refsCode);

// Replace WS trade handling
const oldTradeHandling = `        } else if (stream === \`\${symbol.toLowerCase()}@trade\`) {
          const newTrade = {
            id: data.t,
            price: parseFloat(data.p).toFixed(2),
            quantity: parseFloat(data.q).toFixed(5),
            time: data.T,
            isBuyerMaker: data.m
          };
          setCurrentPrice(newTrade.price);
          
          if (lastPriceRef.current !== '0.00') {
             setPriceChange(parseFloat(newTrade.price) - parseFloat(lastPriceRef.current));
          }
          lastPriceRef.current = newTrade.price;
          setTrades(prev => [newTrade, ...prev].slice(0, 100)); // Keep last 100 trades
        } else if (stream === \`\${symbol.toLowerCase()}@ticker\`) {`;

const newTradeHandling = `        } else if (stream === \`\${symbol.toLowerCase()}@trade\`) {
          const newTrade = {
            id: data.t,
            price: parseFloat(data.p).toFixed(2),
            quantity: parseFloat(data.q).toFixed(5),
            time: data.T,
            isBuyerMaker: data.m
          };
          
          tradeBufferRef.current.push(newTrade);
          
          const now = Date.now();
          if (now - lastTradeUpdateTimeRef.current > 250) {
            setCurrentPrice(newTrade.price);
            
            if (lastPriceRef.current !== '0.00') {
               setPriceChange(parseFloat(newTrade.price) - parseFloat(lastPriceRef.current));
            }
            lastPriceRef.current = newTrade.price;
            
            const bufferedTrades = tradeBufferRef.current;
            tradeBufferRef.current = [];
            lastTradeUpdateTimeRef.current = now;
            
            setTrades(prev => {
               // The newest trades are at the end of the buffer, we want them at the start of the array
               const reversedBuffer = [...bufferedTrades].reverse();
               return [...reversedBuffer, ...prev].slice(0, 100);
            });
          }
        } else if (stream === \`\${symbol.toLowerCase()}@ticker\`) {`;

code = code.replace(oldTradeHandling, newTradeHandling);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
