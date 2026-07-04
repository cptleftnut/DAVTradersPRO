const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const statesToAdd = `
  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);
  const [historicalPricesLoading, setHistoricalPricesLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchHistoricalPrices = async () => {
      setHistoricalPricesLoading(true);
      try {
        const res = await fetch(\`/api/binance-proxy/klines?symbol=\${symbol}&interval=1h&limit=24\`);
        if (!res.ok) throw new Error("Failed to fetch historical prices");
        const data = await res.json();
        if (active) {
          const formatted = data.map((d: any) => ({
             time: new Date(d[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             price: parseFloat(d[4]) // close price
          }));
          setHistoricalPrices(formatted);
        }
      } catch (err) {
        console.error("Historical prices error:", err);
      } finally {
        if (active) setHistoricalPricesLoading(false);
      }
    };
    
    fetchHistoricalPrices();
    
    return () => { active = false; };
  }, [symbol]);
`;

code = code.replace("const [orderHistory, setOrderHistory] = useState<BotOrder[]>([]);", "const [orderHistory, setOrderHistory] = useState<BotOrder[]>([]);\n" + statesToAdd);

const chartHtml = `
          {/* Historical Price Chart */}
          <div className="mb-8 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50">
             <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                   <LineChart className="size-4 text-emerald-500" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{symbol} Market Trend (24h)</span>
                </div>
                {historicalPricesLoading && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
             </div>
             
             <div className="h-48 w-full">
                {historicalPrices.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historicalPrices}>
                            <defs>
                                <linearGradient id="colorHistPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickMargin={10} minTickGap={30} />
                            <YAxis domain={['auto', 'auto']} stroke="#4B5563" fontSize={10} tickFormatter={(val) => \`\$\${val}\`} width={60} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                                itemStyle={{ color: '#10b981' }}
                                labelStyle={{ color: '#9CA3AF' }}
                            />
                            <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHistPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-mono">
                       {historicalPricesLoading ? 'Loading market data...' : 'No data available'}
                    </div>
                )}
             </div>
          </div>
`;

code = code.replace('{/* Ticker Stats */}', chartHtml + '\n          {/* Ticker Stats */}');

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
