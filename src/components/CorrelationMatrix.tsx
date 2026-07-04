import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitCompare, 
  HelpCircle, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  Info,
  Scale,
  Compass,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ZAxis, 
  Cell,
  LineChart as RechartsLineChart,
  Line,
  ComposedChart
} from 'recharts';
import { toast } from 'sonner';

// Asset Metadata
const COINS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', baseBeta: 1.0, volatility: 0.02, correlationWithBtc: 1.00 },
  { symbol: 'ETHUSDT', name: 'Ethereum', baseBeta: 1.15, volatility: 0.025, correlationWithBtc: 0.85 },
  { symbol: 'SOLUSDT', name: 'Solana', baseBeta: 1.50, volatility: 0.04, correlationWithBtc: 0.72 },
  { symbol: 'AVAXUSDT', name: 'Avalanche', baseBeta: 1.65, volatility: 0.045, correlationWithBtc: 0.68 },
  { symbol: 'BNBUSDT', name: 'BNB Coin', baseBeta: 0.85, volatility: 0.018, correlationWithBtc: 0.60 },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', baseBeta: 2.10, volatility: 0.055, correlationWithBtc: 0.48 },
];

export const CorrelationMatrix: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D'>('4H');
  const [periods, setPeriods] = useState<number>(30); // 30, 60, 90 periods
  const [selectedPair, setSelectedPair] = useState<{ x: string; y: string }>({ x: 'BTCUSDT', y: 'ETHUSDT' });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [regenerationKey, setRegenerationKey] = useState(0);

  // 1. Generate Correlated Historical Price Returns
  const priceData = useMemo(() => {
    // We generate pseudo-historical percentage returns that respect baseBeta & correlationWithBtc
    const steps = periods;
    const assetsData: Record<string, number[]> = {};
    
    // Initialize prices
    const initialPrices: Record<string, number> = {
      BTCUSDT: 68000,
      ETHUSDT: 3500,
      SOLUSDT: 155,
      AVAXUSDT: 45,
      BNBUSDT: 580,
      DOGEUSDT: 0.16
    };

    COINS.forEach(c => {
      assetsData[c.symbol] = [];
    });

    // Generate random walks using a single market-driver variable (to simulate market correlation)
    for (let t = 0; t < steps; t++) {
      // Market driver return (standard normal shock)
      const marketShock = (Math.random() - 0.5) * 2; // -1 to +1 uniform-ish shock
      
      COINS.forEach(coin => {
        // Idiosyncratic shock (specific to the coin)
        const idioShock = (Math.random() - 0.5) * 2;
        
        // Return calculation based on beta and correlation level
        // return = beta * market_shock + sqrt(1 - corr^2) * idiosyncratic_shock
        const corr = coin.correlationWithBtc;
        const weightMarket = corr;
        const weightIdio = Math.sqrt(1 - corr * corr);
        
        const returnVal = (weightMarket * marketShock + weightIdio * idioShock) * coin.volatility;
        assetsData[coin.symbol].push(returnVal);
      });
    }

    return assetsData;
  }, [periods, regenerationKey]);

  // 2. Perform Real Statistical Computations
  const stats = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const betas: Record<string, Record<string, number>> = {};
    const stdDevs: Record<string, number> = {};
    const averages: Record<string, number> = {};

    // First calculate averages and standard deviations of returns
    COINS.forEach(c1 => {
      const returns = priceData[c1.symbol] || [];
      const sum = returns.reduce((acc, v) => acc + v, 0);
      const avg = sum / returns.length;
      averages[c1.symbol] = avg;

      const varianceSum = returns.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0);
      const stdDev = Math.sqrt(varianceSum / (returns.length - 1));
      stdDevs[c1.symbol] = stdDev;
    });

    // Calculate correlation (Pearson r) and Beta (cov / var_benchmark)
    COINS.forEach(c1 => {
      matrix[c1.symbol] = {};
      betas[c1.symbol] = {};
      
      COINS.forEach(c2 => {
        if (c1.symbol === c2.symbol) {
          matrix[c1.symbol][c2.symbol] = 1.0;
          betas[c1.symbol][c2.symbol] = 1.0;
          return;
        }

        const r1 = priceData[c1.symbol] || [];
        const r2 = priceData[c2.symbol] || [];
        const avg1 = averages[c1.symbol];
        const avg2 = averages[c2.symbol];

        let covarianceSum = 0;
        let sumSqr1 = 0;
        let sumSqr2 = 0;

        for (let i = 0; i < r1.length; i++) {
          const diff1 = r1[i] - avg1;
          const diff2 = r2[i] - avg2;
          covarianceSum += diff1 * diff2;
          sumSqr1 += diff1 * diff1;
          sumSqr2 += diff2 * diff2;
        }

        const rValue = covarianceSum / Math.sqrt(sumSqr1 * sumSqr2);
        matrix[c1.symbol][c2.symbol] = parseFloat(rValue.toFixed(4));

        // Beta of c1 relative to c2 = Cov(c1, c2) / Var(c2)
        const varianceC2 = sumSqr2 / (r2.length - 1);
        const covariance = covarianceSum / (r1.length - 1);
        betas[c1.symbol][c2.symbol] = parseFloat((covariance / varianceC2).toFixed(3));
      });
    });

    return { matrix, stdDevs, averages, betas };
  }, [priceData]);

  // 3. Prepare Scatter plot data for selected pair
  const scatterData = useMemo(() => {
    const r1 = priceData[selectedPair.x] || [];
    const r2 = priceData[selectedPair.y] || [];
    
    // Map returns to percentage points for easier readability
    return r1.map((valX, i) => ({
      x: parseFloat((valX * 100).toFixed(2)),
      y: parseFloat(((r2[i] || 0) * 100).toFixed(2)),
      index: i + 1
    }));
  }, [priceData, selectedPair]);

  // 4. Compute linear regression line of best fit for scatter plot
  const regressionLine = useMemo(() => {
    if (scatterData.length === 0) return [];
    
    // Find min and max X values to draw a line
    const xValues = scatterData.map(d => d.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);

    const beta = stats.betas[selectedPair.x][selectedPair.y];
    const avgX = scatterData.reduce((acc, d) => acc + d.x, 0) / scatterData.length;
    const avgY = scatterData.reduce((acc, d) => acc + d.y, 0) / scatterData.length;
    
    // intercept alpha = avgY - beta * avgX
    const alpha = avgY - beta * avgX;

    return [
      { x: minX, y: parseFloat((beta * minX + alpha).toFixed(2)) },
      { x: maxX, y: parseFloat((beta * maxX + alpha).toFixed(2)) }
    ];
  }, [scatterData, selectedPair, stats]);

  const activeCorrelation = stats.matrix[selectedPair.x]?.[selectedPair.y] ?? 0;
  const activeBeta = stats.betas[selectedPair.x]?.[selectedPair.y] ?? 0;

  // 5. Generate Dynamic Hedging Advice based on Pearson r and Beta values
  const hedgingAdvice = useMemo(() => {
    const r = activeCorrelation;
    const beta = activeBeta;
    const xName = COINS.find(c => c.symbol === selectedPair.x)?.name || selectedPair.x;
    const yName = COINS.find(c => c.symbol === selectedPair.y)?.name || selectedPair.y;

    if (selectedPair.x === selectedPair.y) {
      return {
        strategy: 'Selv-refererende analyse',
        ratio: '1:1',
        description: `Du har valgt det samme aktiv for begge akser. Korrelationen er perfekt (+1.00).`,
        colorClass: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
        type: 'NEUTRAL'
      };
    }

    if (r > 0.75) {
      const longRatio = (1 / beta).toFixed(2);
      return {
        strategy: 'Statistisk Arbitrage / Beta-neutral Sikring',
        ratio: `Short 1.00x ${yName} mod Long ${longRatio}x ${xName}`,
        description: `Disse aktiver har en ekstremt stærk korrelation (r = ${r}). Det betyder, at de bevæger sig synkront i de fleste markedsforhold. En prisspredning (spread) repræsenterer typisk en midlertidig ubalance, der kan handles som mean-reversion.`,
        colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
        type: 'HEDGE'
      };
    } else if (r > 0.4) {
      return {
        strategy: 'Delvist Synkroniseret Momentum',
        ratio: 'Mellemliggende Risikostyring',
        description: `${xName} og ${yName} følges ad i brede markedstendenser, men har store uafhængige udsving. Undgå at være fuldt eksponeret i begge uden stop-loss, da de ofte bryder correlation under pludselige likviditetsskred.`,
        colorClass: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
        type: 'WARN'
      };
    } else if (r < -0.3) {
      return {
        strategy: 'Aktiv Diversificering / Modvægtssikring',
        ratio: `Kombiner 50% ${xName} og 50% ${yName}`,
        description: `Negativ korrelation detekteret (r = ${r}). Hvis et aktiv falder, stiger det andet typisk. Dette er en fremragende sikringskombination til at nedbringe porteføljens overordnede volatilitet (drawdown reduction).`,
        colorClass: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
        type: 'DIVERSIFY'
      };
    } else {
      return {
        strategy: 'Uafhængig Volatilitet',
        ratio: 'Ingen direkte sikringsbinding',
        description: `Næsten nul korrelation (r = ${r}). Bevægelserne er fuldstændigt ukoordinerede. De egner sig ikke til direkte par-handel (Pairs Trading), men fungerer godt til traditionel aktivfordeling, da de reagerer på uafhængige fundamentale katalysatorer.`,
        colorClass: 'text-gray-400 border-white/5 bg-white/5',
        type: 'INDEPENDENT'
      };
    }
  }, [selectedPair, activeCorrelation, activeBeta]);

  // Handle clicking a cell inside the grid
  const handleCellClick = (x: string, y: string) => {
    setSelectedPair({ x, y });
    toast.info(`Analyse indstillet til: ${x} vs ${y}`);
  };

  const getCellColor = (val: number) => {
    if (val === 1) return 'bg-gray-900 border-white/20 text-white font-extrabold';
    if (val > 0.8) return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30 font-bold';
    if (val > 0.6) return 'bg-emerald-950/30 text-emerald-500/80 border-emerald-500/20';
    if (val > 0.4) return 'bg-emerald-950/10 text-emerald-600/70 border-emerald-500/10';
    if (val < -0.4) return 'bg-rose-950/30 text-rose-400 border-rose-500/20';
    if (val < -0.1) return 'bg-rose-950/10 text-rose-500/70 border-rose-500/10';
    return 'bg-gray-950/20 text-gray-500 border-white/5';
  };

  return (
    <div className="space-y-6" id="correlation-matrix-container">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-gray-950 via-indigo-950/40 to-gray-950 border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="text-left">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit">
              <Sparkles className="size-3 animate-pulse" />
              Statistisk Portefølje Analyse
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2.5 mt-2.5">
              <GitCompare className="size-6 text-indigo-400" />
              Korrelations Matrix & Heatmap
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Udregner realtids Pearson-korrelationskoefficienter (r) og Beta-følsomheder. Analysér hvordan mønstre og prisudsving hænger sammen på tværs af kryptoaktiver for bedre risiko-afdækning.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            {/* Timeframe selector */}
            <div className="flex bg-gray-900/80 p-1 rounded-xl border border-white/5">
              {(['1H', '4H', '1D'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setRegenerationKey(k => k + 1);
                    toast.success(`Opdateret til ${tf} tidsramme`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeframe === tf ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Recalculate button */}
            <button
              onClick={() => {
                setRegenerationKey(k => k + 1);
                toast.success('Gengenererede live markedskorrelationer');
              }}
              className="p-2.5 bg-gray-900 hover:bg-gray-850 border border-white/5 hover:border-indigo-500/30 rounded-xl text-gray-400 hover:text-indigo-400 transition-all cursor-pointer"
              title="Genberegn statistiske parametre"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Heatmap Grid on the Left (3 columns on xl) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-gray-950/40 border border-white/5 rounded-3xl p-5 text-left">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Compass className="size-4 text-indigo-400" /> Live Pearson-r Matrix
              </h4>

              {/* Periods select */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Historiske punkter:</span>
                <select
                  value={periods}
                  onChange={(e) => {
                    setPeriods(Number(e.target.value));
                    toast.info(`Sat beregningslængden til ${e.target.value} perioder`);
                  }}
                  className="bg-gray-900 border border-white/5 rounded-lg px-2 py-1 text-xs text-gray-200 outline-none font-mono font-bold focus:border-indigo-500 transition-colors"
                >
                  <option value={30}>30 punkter</option>
                  <option value={60}>60 punkter</option>
                  <option value={90}>90 punkter</option>
                </select>
              </div>
            </div>

            {/* Visual Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[420px] select-none">
                {/* Column Headers */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  <div className="flex items-center justify-end pr-2 text-[10px] text-gray-500 font-bold tracking-wider font-mono">
                    PAR
                  </div>
                  {COINS.map(c => (
                    <div key={c.symbol} className="p-2 bg-gray-900/40 border border-white/5 rounded-xl text-center text-[10px] font-black text-gray-400 tracking-tighter">
                      {c.symbol.replace('USDT', '')}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                <div className="space-y-1.5">
                  {COINS.map((rowCoin) => (
                    <div key={rowCoin.symbol} className="grid grid-cols-7 gap-1.5">
                      {/* Row Header */}
                      <div className="p-2 bg-gray-900/40 border border-white/5 rounded-xl flex items-center justify-end pr-3 text-[10px] font-black text-gray-400 tracking-tighter font-mono">
                        {rowCoin.symbol.replace('USDT', '')}
                      </div>

                      {/* Row Cells */}
                      {COINS.map((colCoin) => {
                        const val = stats.matrix[rowCoin.symbol]?.[colCoin.symbol] ?? 0;
                        const isSelected = selectedPair.x === rowCoin.symbol && selectedPair.y === colCoin.symbol;
                        
                        return (
                          <div
                            key={colCoin.symbol}
                            onClick={() => handleCellClick(rowCoin.symbol, colCoin.symbol)}
                            className={`p-3.5 border rounded-xl text-center text-xs font-mono font-bold transition-all cursor-pointer relative group ${getCellColor(val)} ${
                              isSelected ? 'ring-2 ring-indigo-500 scale-95 border-indigo-400 z-10' : 'hover:scale-[1.02] hover:border-white/20'
                            }`}
                          >
                            {val.toFixed(2)}
                            
                            {/* Tiny hover effect indicator */}
                            <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scale legend */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5 text-[10px] font-mono text-gray-500">
              <div className="flex items-center gap-1.5">
                <span>Modsat (-1.0)</span>
                <span className="w-3 h-3 bg-rose-950 border border-rose-500/20 rounded-md" />
                <span className="w-3 h-3 bg-gray-900 border border-white/5 rounded-md" />
                <span className="w-3 h-3 bg-emerald-950/30 border border-emerald-500/10 rounded-md" />
                <span className="w-3 h-3 bg-emerald-950 border border-emerald-500/30 rounded-md" />
                <span>Synkron (+1.0)</span>
              </div>
              <span className="text-gray-400 flex items-center gap-1">
                <Info className="size-3 text-indigo-400" /> Klik på en celle for at åbne scatter-analyse
              </span>
            </div>
          </div>

          {/* Dynamic Hedging & Pair Trading Advice Card */}
          <div className={`border rounded-3xl p-5 text-left transition-all ${hedgingAdvice.colorClass}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Scale className="size-4 animate-pulse" /> Hedging-Strategi & Arbitrage rådgiver
              </h5>
              <span className="text-[10px] uppercase font-mono font-bold border border-current px-2 py-0.5 rounded-full">
                Anbefaling
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-black uppercase tracking-wide">
                {hedgingAdvice.strategy}
              </p>
              <p className="text-xs font-bold font-mono opacity-80 flex items-center gap-1.5">
                Sikringsratio: <span className="bg-black/30 px-2 py-0.5 rounded border border-white/5">{hedgingAdvice.ratio}</span>
              </p>
              <p className="text-[11px] opacity-75 leading-relaxed mt-2.5">
                {hedgingAdvice.description}
              </p>
            </div>
          </div>
        </div>

        {/* Scatter Plot & Pair Statistics on the Right (2 columns on xl) */}
        <div className="xl:col-span-2 space-y-4 text-left">
          <div className="bg-gray-950/40 border border-white/5 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <TrendingUp className="size-4 text-indigo-400" /> Prisspredning & Scatter Plot
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                {selectedPair.x.replace('USDT', '')} vs {selectedPair.y.replace('USDT', '')}
              </span>
            </div>

            {/* Scatter chart with regression line */}
            <div className="h-56 bg-black/40 border border-white/5 rounded-2xl p-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    name={selectedPair.x} 
                    unit="%" 
                    stroke="#64748b" 
                    fontSize={9} 
                    tickLine={false} 
                  />
                  <YAxis 
                    dataKey="y" 
                    type="number" 
                    name={selectedPair.y} 
                    unit="%" 
                    stroke="#64748b" 
                    fontSize={9} 
                    tickLine={false} 
                  />
                  <ZAxis range={[30, 30]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                    labelStyle={{ color: '#fff', fontSize: '10px' }}
                  />
                  {/* Scatter Points */}
                  <Scatter 
                    name="Daglige ændringer" 
                    data={scatterData} 
                    fill="#818cf8" 
                    opacity={0.6}
                  >
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={activeCorrelation >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Scatter>
                  {/* Regression Line */}
                  <Line 
                    data={regressionLine} 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#818cf8" 
                    strokeWidth={1.5} 
                    dot={false} 
                    activeDot={false} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="absolute top-2 right-4 text-[8px] font-mono text-gray-500">
                Linje: Best Fit Regression (Beta)
              </div>
            </div>

            {/* Statistical summary panel */}
            <div className="grid grid-cols-2 gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Korrelationskoefficient (r)</span>
                <span className="text-lg font-mono font-black text-gray-100 flex items-baseline gap-1.5">
                  {activeCorrelation >= 0 ? '+' : ''}{activeCorrelation.toFixed(3)}
                  <span className="text-[10px] text-gray-400 font-normal">
                    ({Math.abs(activeCorrelation) > 0.7 ? 'Stærk' : Math.abs(activeCorrelation) > 0.4 ? 'Moderat' : 'Svag'})
                  </span>
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Beta-Koefficient (β)</span>
                <span className="text-lg font-mono font-black text-gray-100 flex items-baseline gap-1.5">
                  {activeBeta}
                  <span className="text-[10px] text-gray-400 font-normal">rel. til Y</span>
                </span>
              </div>
            </div>

            {/* Educational guide banner */}
            <div className="bg-gray-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Hvad betyder tallene?</span>
              <ul className="text-[10px] text-gray-400 space-y-1 font-sans">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500">•</span>
                  <span><strong>r = +1.00:</strong> Perfekt positiv korrelation. Aktiverne stiger og falder helt synkront.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-500">•</span>
                  <span><strong>r = -1.00:</strong> Modsat rettet. Når det ene aktiv stiger, falder det andet.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500">•</span>
                  <span><strong>Beta (β) &gt; 1.0:</strong> Mere volatil end basen. Reagerer kraftigere på markedsstød.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
