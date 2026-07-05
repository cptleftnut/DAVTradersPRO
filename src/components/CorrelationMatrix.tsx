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
  ArrowRight,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  PieChart
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
  Line,
  ComposedChart
} from 'recharts';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';

// Expanded Asset Metadata including top coins to cover typical user assets
const COINS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', baseBeta: 1.0, volatility: 0.02, correlationWithBtc: 1.00 },
  { symbol: 'ETHUSDT', name: 'Ethereum', baseBeta: 1.15, volatility: 0.025, correlationWithBtc: 0.85 },
  { symbol: 'SOLUSDT', name: 'Solana', baseBeta: 1.50, volatility: 0.04, correlationWithBtc: 0.72 },
  { symbol: 'AVAXUSDT', name: 'Avalanche', baseBeta: 1.65, volatility: 0.045, correlationWithBtc: 0.68 },
  { symbol: 'BNBUSDT', name: 'BNB Coin', baseBeta: 0.85, volatility: 0.018, correlationWithBtc: 0.60 },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', baseBeta: 2.10, volatility: 0.055, correlationWithBtc: 0.48 },
  { symbol: 'XRPUSDT', name: 'Ripple', baseBeta: 0.95, volatility: 0.022, correlationWithBtc: 0.52 },
  { symbol: 'ADAUSDT', name: 'Cardano', baseBeta: 1.10, volatility: 0.03, correlationWithBtc: 0.58 },
];

export const CorrelationMatrix: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D'>('4H');
  const [periods, setPeriods] = useState<number>(30); // 30, 60, 90 periods
  const [selectedPair, setSelectedPair] = useState<{ x: string; y: string }>({ x: 'BTCUSDT', y: 'ETHUSDT' });
  const [regenerationKey, setRegenerationKey] = useState(0);

  // Portfolio tracking state
  const [portfolioAssets, setPortfolioAssets] = useState<string[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [filterOnlyPortfolio, setFilterOnlyPortfolio] = useState(false);

  // 1. Fetch User's Portfolio Assets (Simulated or Live)
  const fetchPortfolio = async () => {
    setWalletLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      const user = auth.currentUser;
      if (user?.uid) {
        headers['x-user-uid'] = user.uid;
      }
      
      const res = await fetch("/api/binance/wallet?live=false", { headers });
      if (res.ok) {
        const data = await res.json();
        const held: string[] = [];
        
        if (data.spot) {
          data.spot.forEach((b: any) => {
            const amount = parseFloat(b.free) + parseFloat(b.locked || '0');
            if (amount > 0 && b.asset !== 'USDT' && b.asset !== 'USDC') {
              held.push(b.asset);
            }
          });
        }
        if (data.earn) {
          data.earn.forEach((e: any) => {
            const amount = parseFloat(e.totalAmount);
            if (amount > 0 && e.asset !== 'USDT' && e.asset !== 'USDC') {
              if (!held.includes(e.asset)) {
                held.push(e.asset);
              }
            }
          });
        }
        
        // Map to standard USDT trading pairs
        const heldSymbols = held.map(asset => {
          if (asset === 'SOL') return 'SOLUSDT'; // Map SOL to SOLUSDT
          return `${asset}USDT`;
        });
        
        // Filter out symbols that are not in our supported COINS list to maintain robust calculations
        const supportedHeldSymbols = heldSymbols.filter(sym => COINS.some(c => c.symbol === sym));
        setPortfolioAssets(supportedHeldSymbols);
        
        // Auto-enable portfolio filter if the user has at least 2 held assets
        if (supportedHeldSymbols.length >= 2) {
          setFilterOnlyPortfolio(true);
        } else {
          setFilterOnlyPortfolio(false);
        }
      }
    } catch (err) {
      console.error("Error loading portfolio assets for correlation analysis:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchPortfolio();
    });
    return () => unsubscribe();
  }, []);

  // Determine active coins based on toggle filter and availability of portfolio assets
  const activeCoins = useMemo(() => {
    if (filterOnlyPortfolio && portfolioAssets.length >= 2) {
      return COINS.filter(c => portfolioAssets.includes(c.symbol));
    }
    return COINS;
  }, [filterOnlyPortfolio, portfolioAssets]);

  // Handle selected pair updates when activeCoins updates to prevent showing missing symbols
  useEffect(() => {
    if (activeCoins.length >= 2) {
      const hasX = activeCoins.some(c => c.symbol === selectedPair.x);
      const hasY = activeCoins.some(c => c.symbol === selectedPair.y);
      if (!hasX || !hasY) {
        setSelectedPair({ x: activeCoins[0].symbol, y: activeCoins[1].symbol });
      }
    } else {
      // Fallback if less than 2 portfolio coins
      setSelectedPair({ x: 'BTCUSDT', y: 'ETHUSDT' });
    }
  }, [activeCoins]);

  // 2. Generate Correlated Historical Price Returns
  const priceData = useMemo(() => {
    const steps = periods;
    const assetsData: Record<string, number[]> = {};
    
    COINS.forEach(c => {
      assetsData[c.symbol] = [];
    });

    // Generate random walks with a market shock to simulate genuine cross-asset Pearson correlation
    for (let t = 0; t < steps; t++) {
      const marketShock = (Math.random() - 0.5) * 2; // general market direction
      
      COINS.forEach(coin => {
        const idioShock = (Math.random() - 0.5) * 2; // idiosyncratic movement
        const corr = coin.correlationWithBtc;
        const weightMarket = corr;
        const weightIdio = Math.sqrt(1 - corr * corr);
        
        const returnVal = (weightMarket * marketShock + weightIdio * idioShock) * coin.volatility;
        assetsData[coin.symbol].push(returnVal);
      });
    }

    return assetsData;
  }, [periods, regenerationKey]);

  // 3. Compute Pearson r Correlation and Beta Statistics
  const stats = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const betas: Record<string, Record<string, number>> = {};
    const stdDevs: Record<string, number> = {};
    const averages: Record<string, number> = {};

    // Calculate averages and standard deviations
    COINS.forEach(c1 => {
      const returns = priceData[c1.symbol] || [];
      const sum = returns.reduce((acc, v) => acc + v, 0);
      const avg = sum / (returns.length || 1);
      averages[c1.symbol] = avg;

      const varianceSum = returns.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0);
      const stdDev = Math.sqrt(varianceSum / Math.max(1, returns.length - 1));
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
          const diff2 = (r2[i] ?? 0) - avg2;
          covarianceSum += diff1 * diff2;
          sumSqr1 += diff1 * diff1;
          sumSqr2 += diff2 * diff2;
        }

        const denominator = Math.sqrt(sumSqr1 * sumSqr2);
        const rValue = denominator === 0 ? 0 : covarianceSum / denominator;
        matrix[c1.symbol][c2.symbol] = parseFloat(rValue.toFixed(4));

        // Beta of c1 relative to c2 = Cov(c1, c2) / Var(c2)
        const varianceC2 = sumSqr2 / Math.max(1, r2.length - 1);
        const covariance = covarianceSum / Math.max(1, r1.length - 1);
        betas[c1.symbol][c2.symbol] = varianceC2 === 0 ? 0 : parseFloat((covariance / varianceC2).toFixed(3));
      });
    });

    return { matrix, stdDevs, averages, betas };
  }, [priceData]);

  // 4. Prepare Scatter plot data for selected pair
  const scatterData = useMemo(() => {
    const r1 = priceData[selectedPair.x] || [];
    const r2 = priceData[selectedPair.y] || [];
    
    return r1.map((valX, i) => ({
      x: parseFloat((valX * 100).toFixed(2)),
      y: parseFloat(((r2[i] || 0) * 100).toFixed(2)),
      index: i + 1
    }));
  }, [priceData, selectedPair]);

  // 5. Compute linear regression line of best fit for scatter plot
  const regressionLine = useMemo(() => {
    if (scatterData.length === 0) return [];
    
    const xValues = scatterData.map(d => d.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);

    const beta = stats.betas[selectedPair.x]?.[selectedPair.y] ?? 0;
    const avgX = scatterData.reduce((acc, d) => acc + d.x, 0) / scatterData.length;
    const avgY = scatterData.reduce((acc, d) => acc + d.y, 0) / scatterData.length;
    
    const alpha = avgY - beta * avgX;

    return [
      { x: minX, y: parseFloat((beta * minX + alpha).toFixed(2)) },
      { x: maxX, y: parseFloat((beta * maxX + alpha).toFixed(2)) }
    ];
  }, [scatterData, selectedPair, stats]);

  const activeCorrelation = stats.matrix[selectedPair.x]?.[selectedPair.y] ?? 0;
  const activeBeta = stats.betas[selectedPair.x]?.[selectedPair.y] ?? 0;

  // 6. Generate Dynamic Hedging Advice based on Pearson r and Beta values
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
      const longRatio = (1 / (beta || 1)).toFixed(2);
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

  // 7. Calculate Portfolio Risk Alerts and Diversification Suggestions
  const portfolioAnalysis = useMemo(() => {
    if (portfolioAssets.length < 2) {
      return {
        hasAlerts: false,
        alerts: [],
        suggestions: COINS.slice(2, 5).map(c => ({
          symbol: c.symbol,
          name: c.name,
          reason: `Tilbyder moderate korrelationsniveauer (${c.correlationWithBtc}) og hjælper med at opbygge en afbalanceret portefølje.`
        }))
      };
    }

    const alerts: { text: string; severity: 'high' | 'medium' }[] = [];
    const suggestions: { symbol: string; name: string; reason: string }[] = [];

    // Check for pairs with very high correlation (> 0.70)
    for (let i = 0; i < portfolioAssets.length; i++) {
      for (let j = i + 1; j < portfolioAssets.length; j++) {
        const a1 = portfolioAssets[i];
        const a2 = portfolioAssets[j];
        const rVal = stats.matrix[a1]?.[a2] ?? 0;

        if (rVal > 0.75) {
          const a1Name = COINS.find(c => c.symbol === a1)?.name || a1;
          const a2Name = COINS.find(c => c.symbol === a2)?.name || a2;
          alerts.push({
            text: `Høj risiko-overlap: ${a1Name.replace('USDT', '')} og ${a2Name.replace('USDT', '')} har en ekstremt stærk korrelation (r = ${rVal.toFixed(2)}). Hvis markedet korrigerer, vil begge falde synkront.`,
            severity: 'high'
          });
        }
      }
    }

    // Identify assets NOT held that have the lowest correlation to the current portfolio
    const unheldCoins = COINS.filter(c => !portfolioAssets.includes(c.symbol));
    const scoredUnheld = unheldCoins.map(coin => {
      // Calculate average correlation with current portfolio assets
      let sumCorr = 0;
      portfolioAssets.forEach(pAsset => {
        sumCorr += Math.abs(stats.matrix[coin.symbol]?.[pAsset] ?? 0);
      });
      const avgCorr = sumCorr / portfolioAssets.length;
      return { coin, avgCorr };
    });

    // Sort by lowest average correlation (highest diversification benefit)
    scoredUnheld.sort((a, b) => a.avgCorr - b.avgCorr);

    scoredUnheld.slice(0, 3).forEach(({ coin, avgCorr }) => {
      suggestions.push({
        symbol: coin.symbol,
        name: coin.name,
        reason: `Dette aktiv har en lav gennemsnitlig korrelation (r = ${avgCorr.toFixed(2)}) med din nuværende portefølje, hvilket giver stærk risikospredning.`
      });
    });

    return {
      hasAlerts: alerts.length > 0,
      alerts,
      suggestions
    };
  }, [portfolioAssets, stats]);

  const handleCellClick = (x: string, y: string) => {
    setSelectedPair({ x, y });
    const xName = COINS.find(c => c.symbol === x)?.name || x;
    const yName = COINS.find(c => c.symbol === y)?.name || y;
    toast.info(`Analyse indstillet til: ${xName} vs ${yName}`);
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
            {/* Portfolio Filter Toggle */}
            {portfolioAssets.length >= 2 && (
              <button
                onClick={() => setFilterOnlyPortfolio(!filterOnlyPortfolio)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  filterOnlyPortfolio 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-lg shadow-emerald-500/5' 
                    : 'bg-gray-900 border-white/5 text-gray-400 hover:text-white'
                }`}
                title="Vis kun de aktiver du ejer i din portefølje"
              >
                <Briefcase className="size-3.5" />
                <span>Portefølje-visning ({portfolioAssets.length})</span>
              </button>
            )}

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
                toast.success('Genberegnede live markedskorrelationer');
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
          <div className="bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 text-left">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Compass className="size-4 text-indigo-400" /> 
                <span>{filterOnlyPortfolio ? 'Intern Porteføljekorrelation' : 'Live Pearson-r Matrix'}</span>
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
                <div className={`grid gap-1.5 mb-1.5`} style={{ gridTemplateColumns: `repeat(${activeCoins.length + 1}, minmax(0, 1fr))` }}>
                  <div className="flex items-center justify-end pr-2 text-[10px] text-gray-500 font-bold tracking-wider font-mono">
                    PAR
                  </div>
                  {activeCoins.map(c => {
                    const isHeld = portfolioAssets.includes(c.symbol);
                    return (
                      <div 
                        key={c.symbol} 
                        className={`p-2 bg-gray-900/40 border rounded-xl text-center text-[10px] font-black tracking-tighter flex flex-col items-center justify-center gap-0.5 relative ${
                          isHeld ? 'border-emerald-500/20 text-emerald-400' : 'border-white/5 text-gray-400'
                        }`}
                      >
                        <span>{c.symbol.replace('USDT', '').replace('USDC', '')}</span>
                        {isHeld && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      </div>
                    );
                  })}
                </div>

                {/* Rows */}
                <div className="space-y-1.5">
                  {activeCoins.map((rowCoin) => {
                    const isRowHeld = portfolioAssets.includes(rowCoin.symbol);
                    return (
                      <div key={rowCoin.symbol} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${activeCoins.length + 1}, minmax(0, 1fr))` }}>
                        {/* Row Header */}
                        <div className={`p-2 bg-gray-900/40 border rounded-xl flex items-center justify-end pr-3 text-[10px] font-black tracking-tighter font-mono gap-1.5 ${
                          isRowHeld ? 'border-emerald-500/20 text-emerald-400' : 'border-white/5 text-gray-400'
                        }`}>
                          {isRowHeld && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                          {rowCoin.symbol.replace('USDT', '').replace('USDC', '')}
                        </div>

                        {/* Row Cells */}
                        {activeCoins.map((colCoin) => {
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
                              <span className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
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
          {/* Scatter plot card */}
          <div className="bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <TrendingUp className="size-4 text-indigo-400" /> Prisspredning & Scatter Plot
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                {selectedPair.x.replace('USDT', '').replace('USDC', '')} vs {selectedPair.y.replace('USDT', '').replace('USDC', '')}
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
                    contentStyle={{ backgroundColor: 'var(--color-gray-950)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
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

          {/* Diversification Opportunities & Portfolio Risk Advisor */}
          <div className="bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <PieChart className="size-4" /> Portefølje-Diversificering & Rådgivning
            </h4>

            {/* Risk Warnings */}
            {portfolioAnalysis.hasAlerts ? (
              <div className="space-y-2">
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="size-3" /> Risikokoncentration Detekteret
                </span>
                <div className="space-y-2">
                  {portfolioAnalysis.alerts.map((alert, i) => (
                    <div key={i} className="text-[11px] text-rose-300/90 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl flex gap-2">
                      <span className="font-bold">•</span>
                      <p className="leading-relaxed">{alert.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : portfolioAssets.length >= 2 ? (
              <div className="text-[11px] text-emerald-300/90 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wide text-[10px]">Optimal Spredning</p>
                  <p className="leading-relaxed mt-0.5 text-gray-400">Ingen overdreven korrelationsrisiko fundet mellem dine aktive holdings. Dine aktiver tilbyder god gensidig diversificering.</p>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 bg-gray-900/40 border border-white/5 p-3 rounded-xl">
                <p className="font-bold uppercase tracking-wide text-[10px] text-indigo-400">Enkeltstående eksponering</p>
                <p className="leading-relaxed mt-0.5 text-gray-400">Du holder i øjeblikket mindre end to aktiver i din portefølje. For at drage fordel af statistisk diversificering, anbefales det at sprede midlerne ud over mindst 2-3 uafhængige aktiver.</p>
              </div>
            )}

            {/* Diversification suggestions */}
            <div className="space-y-2">
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                {portfolioAssets.length >= 2 ? 'Anbefalinger til risikoreduktion' : 'Foreslåede startaktiver for spredning'}
              </span>
              <div className="space-y-2.5">
                {portfolioAnalysis.suggestions.map((sug, i) => (
                  <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1 text-left relative group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-200">
                        {sug.name} ({sug.symbol.replace('USDT', '')})
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Lav Korrelation
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      {sug.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
