import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  ArrowDown, 
  TrendingDown, 
  RefreshCw, 
  AlertTriangle, 
  Coins, 
  HelpCircle, 
  Check, 
  ChevronDown, 
  Percent, 
  DollarSign, 
  BarChart4, 
  Activity, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export interface JournalEntry {
  id: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  price: number;
  time: string;
  notes: string;
  tags: string[];
}

interface PortfolioStressTestProps {
  journalEntries: JournalEntry[];
}

interface HeldAsset {
  ticker: string;
  lotCount: number;
  avgBuyPrice: number;
  lots: { price: number; time: string; id: string }[];
}

// Default beta/volatility factors for typical assets relative to Bitcoin
const DEFAULT_BETAS: Record<string, number> = {
  'BTCUSDT': 1.0,
  'BTC': 1.0,
  'ETHUSDT': 1.2,
  'ETH': 1.2,
  'SOLUSDC': 1.5,
  'SOL': 1.5,
  'BNBUSDT': 1.1,
  'BNB': 1.1,
  'ADAUSDT': 1.6,
  'XRPUSDT': 1.4,
  'DOGEUSDT': 2.2,
  'SHIBUSDT': 2.5,
};

export function PortfolioStressTest({ journalEntries = [] }: PortfolioStressTestProps) {
  const [valuationMode, setValuationMode] = useState<'unit' | 'fixed' | 'custom'>('fixed');
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [selectedScenario, setSelectedScenario] = useState<string>('custom');
  const [masterDropPercent, setMasterDropPercent] = useState<number>(20);
  const [useBetaWeighting, setUseBetaWeighting] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [tickerPrices, setTickerPrices] = useState<Record<string, number>>({});
  const [fetchingPrices, setFetchingPrices] = useState<boolean>(false);

  // Parse journal entries into active holdings (FIFO logic)
  const realHoldings = useMemo(() => {
    const sorted = [...journalEntries].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const openLots: Record<string, { price: number; time: string; id: string }[]> = {};

    sorted.forEach(entry => {
      const ticker = entry.ticker.toUpperCase();
      if (!openLots[ticker]) openLots[ticker] = [];

      if (entry.side === 'BUY') {
        openLots[ticker].push({ price: entry.price, time: entry.time, id: entry.id });
      } else if (entry.side === 'SELL') {
        if (openLots[ticker].length > 0) {
          openLots[ticker].shift(); // FIFO: close oldest buy lot
        }
      }
    });

    return Object.entries(openLots)
      .filter(([_, lots]) => lots.length > 0)
      .map(([ticker, lots]) => {
        const totalCost = lots.reduce((acc, lot) => acc + lot.price, 0);
        const avgBuyPrice = totalCost / lots.length;
        return {
          ticker,
          lotCount: lots.length,
          avgBuyPrice,
          lots
        } as HeldAsset;
      });
  }, [journalEntries]);

  // Demo holdings fallback to explore the feature easily
  const demoHoldings: HeldAsset[] = useMemo(() => [
    {
      ticker: 'BTCUSDT',
      lotCount: 2,
      avgBuyPrice: 65420,
      lots: [
        { price: 64200, time: '2026-06-15T12:00:00Z', id: 'demo-1' },
         { price: 66640, time: '2026-06-18T14:30:00Z', id: 'demo-2' },
      ],
    },
    {
      ticker: 'ETHUSDT',
      lotCount: 3,
      avgBuyPrice: 3450,
      lots: [
         { price: 3400, time: '2026-06-10T09:00:00Z', id: 'demo-3' },
         { price: 3500, time: '2026-06-12T10:15:00Z', id: 'demo-4' },
         { price: 3450, time: '2026-06-16T11:00:00Z', id: 'demo-5' },
      ],
    },
    {
      ticker: 'SOLUSDC',
      lotCount: 1,
      avgBuyPrice: 142.5,
      lots: [
         { price: 142.5, time: '2026-06-19T08:00:00Z', id: 'demo-6' },
      ],
    },
    {
      ticker: 'DOGEUSDT',
      lotCount: 4,
      avgBuyPrice: 0.125,
      lots: [
         { price: 0.12, time: '2026-06-14T19:00:00Z', id: 'demo-7' },
         { price: 0.13, time: '2026-06-15T20:00:00Z', id: 'demo-8' },
         { price: 0.12, time: '2026-06-17T21:00:00Z', id: 'demo-9' },
         { price: 0.13, time: '2026-06-18T22:00:00Z', id: 'demo-10' },
      ],
    },
  ], []);

  // Determine active dataset
  const activeHoldings = useMemo(() => {
    // If no real holdings exist, automatically enable demo mode to prevent blank states
    if (realHoldings.length === 0) {
      return demoHoldings;
    }
    return isDemoMode ? demoHoldings : realHoldings;
  }, [realHoldings, demoHoldings, isDemoMode]);

  // Is using real or demo database
  const usingRealHoldings = realHoldings.length > 0 && !isDemoMode;

  // Sync / Fetch live prices from Binance proxy
  const fetchLivePrices = async () => {
    if (activeHoldings.length === 0) return;
    setFetchingPrices(true);
    const newPrices: Record<string, number> = {};
    
    try {
      const promises = activeHoldings.map(async (h) => {
        try {
          const res = await fetch(`/api/binance-proxy/ticker/price?symbol=${h.ticker}`);
          if (res.ok) {
            const data = await res.json();
            const p = parseFloat(data.price);
            if (!isNaN(p)) {
              newPrices[h.ticker] = p;
            }
          }
        } catch (e) {
          console.warn(`Could not fetch price for ${h.ticker}`, e);
        }
      });
      
      await Promise.all(promises);
      setTickerPrices(prev => ({ ...prev, ...newPrices }));
      toast.success('Live priser opdateret!');
    } catch (err) {
      console.error('Failure fetching stress prices', err);
      toast.error('Kunne ikke hente markedets live priser.');
    } finally {
      setFetchingPrices(false);
    }
  };

  // Auto fetch once holdings load
  useEffect(() => {
    fetchLivePrices();
  }, [activeHoldings]);

  // Initialize custom quantities based on valuation mode
  useEffect(() => {
    const freshQuantities: Record<string, number> = {};
    activeHoldings.forEach(h => {
      const price = tickerPrices[h.ticker] || h.avgBuyPrice || 1;
      if (valuationMode === 'unit') {
        freshQuantities[h.ticker] = h.lotCount;
      } else if (valuationMode === 'fixed') {
        // Assume $1000 invested per lot
        const lotVal = 1000;
        const qtyPerLot = lotVal / h.avgBuyPrice;
        freshQuantities[h.ticker] = parseFloat((qtyPerLot * h.lotCount).toFixed(4));
      } else {
        // Keep existing or default to unit
        freshQuantities[h.ticker] = customQuantities[h.ticker] || h.lotCount;
      }
    });
    setCustomQuantities(freshQuantities);
  }, [activeHoldings, valuationMode, tickerPrices]);

  // Pre-configured Stress Scenarios
  const scenarios = [
    { id: 'custom', name: 'Brugerdefineret Chok', drop: masterDropPercent, desc: 'Juster din egen overordnede chok-parameter på skyderen nedenfor.' },
    { id: 'correction', name: 'Almindelig Markedskorrektion', drop: 10, desc: 'En standard 10% korrektion i det overordnede kryptomarked.' },
    { id: 'flash_crash', name: 'Pludseligt Flash-Crash', drop: 25, desc: 'Hurtig likviditetsklemme med en pludselig 25% nedtur i alle aktiver.' },
    { id: 'black_thursday', name: 'Sorte Torsdag (Systemisk chok)', drop: 45, desc: 'Globale likviditetsproblemer fører til et markant kollaps på 45%.' },
    { id: 'crypto_winter', name: 'Kryptovinter (Langvarigt bjørnemarked)', drop: 65, desc: 'Udbredt kapitulering og langvarig modgang, der barberer 65% af porteføljens værdi.' },
    { id: 'regulatory', name: 'Målrettet Reguleringspres (Asymmetrisk)', drop: 35, desc: 'Asymmetrisk pres: Bitcoin falder 15%, Ethereum falder 30%, og altcoins falder 55%.' }
  ];

  // Update slider/scenario linkages
  const handleScenarioSelect = (scenId: string) => {
    setSelectedScenario(scenId);
    const selected = scenarios.find(s => s.id === scenId);
    if (selected && scenId !== 'custom' && scenId !== 'regulatory') {
      setMasterDropPercent(selected.drop);
    }
  };

  // Individual asset detailed drops
  const evaluatedHoldings = useMemo(() => {
    return activeHoldings.map(h => {
      const currentPrice = tickerPrices[h.ticker] || h.avgBuyPrice;
      const quantity = customQuantities[h.ticker] || 0;
      const currentVal = quantity * currentPrice;
      const totalCostVal = quantity * h.avgBuyPrice;

      // Determine drop percentage for this specific holding
      let assetDropPercent = masterDropPercent;

      if (selectedScenario === 'regulatory') {
        const cleanTicker = h.ticker.toUpperCase();
        if (cleanTicker.startsWith('BTC') || cleanTicker === 'BTCUSDT' || cleanTicker === 'BTC') {
          assetDropPercent = 15;
        } else if (cleanTicker.startsWith('ETH') || cleanTicker === 'ETHUSDT' || cleanTicker === 'ETH') {
          assetDropPercent = 30;
        } else {
          assetDropPercent = 55; // High exposure regulatory altcoin hit
        }
      } else if (useBetaWeighting) {
        // Scale the drop based on beta factor
        const baseSymbol = h.ticker.replace('USDT', '');
        const beta = DEFAULT_BETAS[h.ticker] || DEFAULT_BETAS[baseSymbol] || 1.8; // default to 1.8 for lesser Alts
        assetDropPercent = Math.min(99, masterDropPercent * beta);
      }

      const stressPrice = currentPrice * (1 - assetDropPercent / 100);
      const stressVal = quantity * stressPrice;
      const projectedLoss = currentVal - stressVal;
      const currentPnL = currentVal - totalCostVal;
      const stressedPnL = stressVal - totalCostVal;

      return {
        ...h,
        currentPrice,
        quantity,
        currentVal,
        totalCostVal,
        assetDropPercent,
        stressPrice,
        stressVal,
        projectedLoss,
        currentPnL,
        stressedPnL
      };
    });
  }, [activeHoldings, tickerPrices, customQuantities, masterDropPercent, selectedScenario, useBetaWeighting]);

  // Aggregate totals
  const totals = useMemo(() => {
    let currentTotal = 0;
    let stressedTotal = 0;
    let costTotal = 0;

    evaluatedHoldings.forEach(item => {
      currentTotal += item.currentVal;
      stressedTotal += item.stressVal;
      costTotal += item.totalCostVal;
    });

    const projectedLoss = currentTotal - stressedTotal;
    const projectedLossPercent = currentTotal > 0 ? (projectedLoss / currentTotal) * 100 : 0;
    const currentProfit = currentTotal - costTotal;
    const currentProfitPercent = costTotal > 0 ? (currentProfit / costTotal) * 100 : 0;

    // Risk tier evaluation
    let riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'SYSTEMIC' = 'LOW';
    if (projectedLossPercent > 50) riskTier = 'SYSTEMIC';
    else if (projectedLossPercent > 25) riskTier = 'HIGH';
    else if (projectedLossPercent > 10) riskTier = 'MODERATE';

    return {
      currentTotal,
      stressedTotal,
      projectedLoss,
      projectedLossPercent,
      currentProfit,
      currentProfitPercent,
      riskTier
    };
  }, [evaluatedHoldings]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return evaluatedHoldings.map(h => ({
      navn: h.ticker.replace('USDT', ''),
      'Nuværende Værdi': parseFloat(h.currentVal.toFixed(2)),
      'Stresset Værdi': parseFloat(h.stressVal.toFixed(2)),
      'Anslået Tab': parseFloat(h.projectedLoss.toFixed(2)),
      'Drop %': parseFloat(h.assetDropPercent.toFixed(1))
    }));
  }, [evaluatedHoldings]);

  // Handle custom quantity change manually
  const handleQuantityEdit = (ticker: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setCustomQuantities(prev => ({
        ...prev,
        [ticker]: num
      }));
    } else if (value === '') {
      setCustomQuantities(prev => ({
        ...prev,
        [ticker]: 0
      }));
    }
  };

  const activeScenarioDesc = scenarios.find(s => s.id === selectedScenario)?.desc || '';

  return (
    <div id="portfolio-stress-test-card" className="p-6 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden mt-6">
      
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Portefølje Stresstest & Særlige Scenarioer
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">
                Simuler ekstreme markedsdyk og analyser modstandsdygtighed (baseret på journal-køb)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
          {realHoldings.length === 0 && (
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-900/30 text-amber-400 text-[10px] rounded">
              Ingen aktive logførte køb - Demotilstand aktiv
            </span>
          )}

          {realHoldings.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setIsDemoMode(false)}
                className={`px-3 py-1 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider ${
                  !isDemoMode 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Rigtig Journal
              </button>
              <button
                onClick={() => setIsDemoMode(true)}
                className={`px-3 py-1 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider ${
                  isDemoMode 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Demo-portefølje
              </button>
            </div>
          )}

          <button
            onClick={fetchLivePrices}
            disabled={fetchingPrices}
            className="p-2 bg-gray-950 border border-gray-800 text-gray-400 hover:text-gray-100 hover:border-gray-700 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
            title="Synkroniser live-priser"
          >
            <RefreshCw className={`size-3.5 ${fetchingPrices ? 'animate-spin' : ''}`} />
            {fetchingPrices ? 'Opdaterer...' : 'Opdater Live'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        
        {/* Nul-værdi alarm hvis der slet ingen beholdninger er */}
        {activeHoldings.length === 0 && (
          <div className="col-span-full p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-sm text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2.5 items-start">
              <AlertTriangle className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Ingen åbne positioner i din handelsjournal</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Vi kunne ikke finde uafsluttede BUY-ordrer i din handelsdagbog. Tilføj nogle BUY-transaktioner i Dagbogen nedenfor for at stressteste din virkelige portefølje!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Total Current Value */}
        <div className="p-4 bg-gray-950 rounded-2xl border border-gray-850 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-widest">Nuværende Værdi</span>
            <Coins className="size-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-gray-100">
              ${totals.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <span>Samlet anskaffelse:</span>
              <span className={`font-semibold ${totals.currentProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totals.currentProfit >= 0 ? '+' : ''}
                {totals.currentProfitPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Projected Loss */}
        <div className="p-4 bg-gray-950 rounded-2xl border border-gray-850 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5 text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-widest">Simuleret Tab</span>
            <TrendingDown className="size-4 text-rose-400 animate-pulse" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-rose-400">
              -${totals.projectedLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
              <ArrowDown className="size-3" />
              <span>{totals.projectedLossPercent.toFixed(1)}% af porteføljen</span>
            </div>
          </div>
        </div>

        {/* 3. Post-Crash Value */}
        <div className="p-4 bg-gray-950 rounded-2xl border border-gray-850 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-widest">Estimeret Bund</span>
            <DollarSign className="size-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-amber-300">
              ${totals.stressedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Værdi efter crash-simulering
            </div>
          </div>
        </div>

        {/* 4. Risk Rating Assessment */}
        <div className="p-4 bg-gray-950 rounded-2xl border border-gray-850 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5 text-gray-500">
            <span className="text-[10px] uppercase font-bold tracking-widest">Sårbarheds Vurdering</span>
            <span className={`w-2.5 h-2.5 rounded-full ${
              totals.riskTier === 'LOW' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
              totals.riskTier === 'MODERATE' ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' :
              totals.riskTier === 'HIGH' ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' :
              'bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping'
            }`} />
          </div>
          <div>
            <div className={`text-lg md:text-xl font-bold uppercase tracking-wide ${
              totals.riskTier === 'LOW' ? 'text-emerald-400' :
              totals.riskTier === 'MODERATE' ? 'text-yellow-400' :
              totals.riskTier === 'HIGH' ? 'text-orange-400' :
              'text-red-400 font-extrabold'
            }`}>
              {totals.riskTier === 'LOW' && 'Lav Risiko'}
              {totals.riskTier === 'MODERATE' && 'Moderat Risiko'}
              {totals.riskTier === 'HIGH' && 'Høj Risiko'}
              {totals.riskTier === 'SYSTEMIC' && 'Kritisk Nedsmelt'}
            </div>
            <p className="text-[9px] text-gray-400 mt-1 leading-snug">
              {totals.riskTier === 'LOW' && "Solid polstring mod pludselige crash-korrektioner."}
              {totals.riskTier === 'MODERATE' && "Mindre følsom, men overvej rebalancering til stabilt afkast."}
              {totals.riskTier === 'HIGH' && "Stor eksponering i volatile aktiver. Overvej Stop-Loss alarmer."}
              {totals.riskTier === 'SYSTEMIC' && "Alvorlig risiko for likvidering og totalt tab ved markedskollaps."}
            </p>
          </div>
        </div>

      </div>

      {/* Main Interactive Controls & Config Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Scenario Selectors & Controls */}
        <div className="lg:col-span-4 space-y-5 bg-gray-950/40 p-4 rounded-2xl border border-gray-850 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Scenario Quick Presets */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                <span>Vælg Chok-scenario</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {scenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => handleScenarioSelect(scen.id)}
                    className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                      selectedScenario === scen.id 
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' 
                        : 'bg-gray-900/60 border-gray-850 text-gray-400 hover:text-gray-200 hover:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full font-bold">
                      <span>{scen.name}</span>
                      <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-[10px] text-rose-400">
                        {scen.id === 'regulatory' ? 'Asymmetrisk' : `-${scen.drop}%`}
                      </span>
                    </div>
                    {selectedScenario === scen.id && (
                      <p className="text-[10px] text-gray-400 leading-normal animate-in fade-in duration-300">
                        {scen.desc}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Parameter Slider (Manual tuning) */}
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-900">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-gray-400 font-semibold">Portefølje Chokværdi:</span>
                <span className="text-sm font-bold text-rose-400 font-mono">-{masterDropPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterDropPercent}
                onChange={(e) => {
                  setMasterDropPercent(parseInt(e.target.value));
                  if (selectedScenario !== 'custom') {
                    setSelectedScenario('custom');
                  }
                }}
                disabled={selectedScenario === 'regulatory'}
                className="w-full accent-rose-500 h-1 bg-gray-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono mt-1">
                <span>0%</span>
                <span>50% (Skarpt fald)</span>
                <span>100% (Konkurs)</span>
              </div>
            </div>

            {/* Volatility Multiplier Setting (Beta Weighting) */}
            <div className="flex items-center justify-between p-3 bg-gray-950 rounded-xl border border-gray-900 text-xs">
              <div>
                <span className="font-semibold text-gray-300 block">Vægtet Beta-stresstest</span>
                <span className="text-[9px] text-gray-500 block leading-tight mt-0.5">Skaler tab ud fra historisk volatilitet (f.eks. større fald i altcoins)</span>
              </div>
              <button
                type="button"
                onClick={() => setUseBetaWeighting(!useBetaWeighting)}
                disabled={selectedScenario === 'regulatory'}
                className={`p-1.5 rounded-lg border transition-all ${
                  useBetaWeighting
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                }`}
                title="Aktiver vægtet volatilitet"
              >
                {useBetaWeighting ? (
                  <div className="flex items-center gap-1 px-1 font-bold text-[9px] uppercase tracking-wider">
                    <span>Aktiv</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-1 font-bold text-[9px] uppercase tracking-wider">
                    <span>Inaktiv</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-900 text-[10px] text-gray-500 leading-normal flex gap-2">
            <Info className="size-4 text-gray-400 shrink-0" />
            <span>
              <strong>Stress Advisor:</strong> At køre stressanalyser hjælper dig med at identificere likviditetsklemmer før stormen rammer. Juster værdierne for at kortlægge din risikotolerance.
            </span>
          </div>

        </div>

        {/* Visual Charts Allocation & Projections */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Chart Header */}
          <div className="p-4 bg-gray-950 rounded-2xl border border-gray-850 flex flex-col h-[280px]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <BarChart4 className="size-3.5 text-rose-500" /> Værdi-fald pr. Aktiv (USD)
              </span>
              <div className="flex bg-gray-900 border border-gray-850 rounded-lg p-0.5 text-[9px] font-mono font-bold uppercase tracking-wider">
                <button
                  onClick={() => setValuationMode('fixed')}
                  className={`px-2 py-1 rounded transition-all ${valuationMode === 'fixed' ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Spore $1000 investeret pr lot"
                >
                  $1.000/lot
                </button>
                <button
                  onClick={() => setValuationMode('unit')}
                  className={`px-2 py-1 rounded transition-all ${valuationMode === 'unit' ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Simuler 1 mønt per lot"
                >
                  1 Enhed/lot
                </button>
                <button
                  onClick={() => setValuationMode('custom')}
                  className={`px-2 py-1 rounded transition-all ${valuationMode === 'custom' ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Indtast egne beholdninger"
                >
                  Indtast Egen
                </button>
              </div>
            </div>

            <div className="flex-1 w-full text-xs">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Intet diagram at vise
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="navn" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#030712', borderColor: '#1f2937', borderRadius: '12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                    <Bar dataKey="Nuværende Værdi" fill="#10b981" radius={[4, 4, 0, 0]} filter="drop-shadow(0 0 4px rgba(16,185,129,0.15))" />
                    <Bar dataKey="Stresset Værdi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Anslået Tab" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Holdings Config Table list */}
          <div className="bg-gray-950 rounded-2xl border border-gray-850 overflow-hidden flex-1 flex flex-col">
            <div className="p-3 bg-gray-900 border-b border-gray-850 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <span>Porteføljens sammensætning</span>
              <span>Model: {valuationMode === 'unit' ? '1 Enhed per Købslog' : valuationMode === 'fixed' ? 'Simuleret $1,000 Investering pr. Køb' : 'Manuel mængde'}</span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[220px] scrollbar-thin">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-gray-950 font-semibold border-b border-gray-900 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">Aktiv</th>
                    <th className="px-3 py-2.5 text-right">Logførte Køb</th>
                    <th className="px-3 py-2.5 text-center">Simuleret Mængde</th>
                    <th className="px-3 py-2.5 text-right">Anskaf. Pris</th>
                    <th className="px-3 py-2.5 text-right">Gældende Pris</th>
                    <th className="px-3 py-2.5 text-right">Projected Drop</th>
                    <th className="px-4 py-2.5 text-right">Anslået Tab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {evaluatedHoldings.map((h) => {
                    const baseSymbol = h.ticker.replace('USDT', '');
                    const beta = DEFAULT_BETAS[h.ticker] || DEFAULT_BETAS[baseSymbol] || 1.8;

                    return (
                      <tr key={h.ticker} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span>{h.ticker}</span>
                          <span className="text-[10px] text-gray-500 font-mono" title={`Beta: ${beta}`}>
                            (β: {beta})
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-300">
                          {h.lotCount}x Lot
                        </td>
                        <td className="px-3 py-3 text-center">
                          {valuationMode === 'custom' ? (
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={customQuantities[h.ticker] !== undefined ? customQuantities[h.ticker] : ''}
                              onChange={(e) => handleQuantityEdit(h.ticker, e.target.value)}
                              className="w-18 px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded font-mono text-xs text-center text-gray-100 hover:border-gray-700 focus:border-rose-500 focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono text-gray-300">{h.quantity.toFixed(4)}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-500">
                          ${h.avgBuyPrice < 10 ? h.avgBuyPrice.toFixed(4) : h.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-emerald-400 font-semibold">
                          ${h.currentPrice < 10 ? h.currentPrice.toFixed(4) : h.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right text-rose-400 font-mono font-bold">
                          -{h.assetDropPercent}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-rose-500 font-bold">
                          -${h.projectedLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Helper Explainer bottom bar */}
            <div className="p-3 bg-gray-950 border-t border-gray-900 text-[10px] text-gray-500 flex justify-between items-center">
              <span>* β (Beta-faktor) indikerer aktivets historiske sårbarhed over for overordnede kryptomarkeds-udsving.</span>
              <span>FIFO (First In First Out) afvikling af positioner</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
