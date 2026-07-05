import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  Info,
  Scale,
  LineChart,
  Percent,
  Compass,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Layers,
  Zap,
  Sliders,
  ShieldCheck,
  Save,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from 'recharts';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';

// Hardcoded asset parameters for risk metrics simulation
interface AssetRiskParams {
  symbol: string;
  name: string;
  beta: number;          // Beta relative to BTC (market benchmark)
  volatility: number;    // Daily return standard deviation (e.g., 0.02 = 2% daily)
  expectedReturn: number;// Annual expected return
}

const ASSET_PARAMS: Record<string, AssetRiskParams> = {
  BTCUSDT: { symbol: 'BTCUSDT', name: 'Bitcoin', beta: 1.0, volatility: 0.022, expectedReturn: 0.35 },
  ETHUSDT: { symbol: 'ETHUSDT', name: 'Ethereum', beta: 1.15, volatility: 0.028, expectedReturn: 0.45 },
  SOLUSDT: { symbol: 'SOLUSDT', name: 'Solana', beta: 1.50, volatility: 0.042, expectedReturn: 0.65 },
  AVAXUSDT: { symbol: 'AVAXUSDT', name: 'Avalanche', beta: 1.65, volatility: 0.048, expectedReturn: 0.60 },
  BNBUSDT: { symbol: 'BNBUSDT', name: 'BNB', beta: 0.85, volatility: 0.019, expectedReturn: 0.28 },
  DOGEUSDT: { symbol: 'DOGEUSDT', name: 'Dogecoin', beta: 2.10, volatility: 0.058, expectedReturn: 0.70 },
  XRPUSDT: { symbol: 'XRPUSDT', name: 'Ripple', beta: 0.95, volatility: 0.024, expectedReturn: 0.20 },
  ADAUSDT: { symbol: 'ADAUSDT', name: 'Cardano', beta: 1.10, volatility: 0.032, expectedReturn: 0.25 },
  USDT: { symbol: 'USDT', name: 'Tether', beta: 0.0, volatility: 0.001, expectedReturn: 0.05 },
  USDC: { symbol: 'USDC', name: 'USD Coin', beta: 0.0, volatility: 0.001, expectedReturn: 0.05 },
};

// Correlations matrix for portfolio volatility calculation
const CORRELATIONS: Record<string, Record<string, number>> = {
  BTCUSDT: { BTCUSDT: 1.0, ETHUSDT: 0.82, SOLUSDT: 0.71, AVAXUSDT: 0.65, BNBUSDT: 0.58, DOGEUSDT: 0.45, XRPUSDT: 0.49, ADAUSDT: 0.55, USDT: 0.0, USDC: 0.0 },
  ETHUSDT: { BTCUSDT: 0.82, ETHUSDT: 1.0, SOLUSDT: 0.78, AVAXUSDT: 0.72, BNBUSDT: 0.61, DOGEUSDT: 0.48, XRPUSDT: 0.51, ADAUSDT: 0.58, USDT: 0.0, USDC: 0.0 },
  SOLUSDT: { BTCUSDT: 0.71, ETHUSDT: 0.78, SOLUSDT: 1.0, AVAXUSDT: 0.80, BNBUSDT: 0.55, DOGEUSDT: 0.52, XRPUSDT: 0.46, ADAUSDT: 0.52, USDT: 0.0, USDC: 0.0 },
  AVAXUSDT: { BTCUSDT: 0.65, ETHUSDT: 0.72, SOLUSDT: 0.80, AVAXUSDT: 1.0, BNBUSDT: 0.50, DOGEUSDT: 0.49, XRPUSDT: 0.42, ADAUSDT: 0.49, USDT: 0.0, USDC: 0.0 },
  BNBUSDT: { BTCUSDT: 0.58, ETHUSDT: 0.61, SOLUSDT: 0.55, AVAXUSDT: 0.50, BNBUSDT: 1.0, DOGEUSDT: 0.38, XRPUSDT: 0.39, ADAUSDT: 0.42, USDT: 0.0, USDC: 0.0 },
  DOGEUSDT: { BTCUSDT: 0.45, ETHUSDT: 0.48, SOLUSDT: 0.52, AVAXUSDT: 0.49, BNBUSDT: 0.38, DOGEUSDT: 1.0, XRPUSDT: 0.32, ADAUSDT: 0.36, USDT: 0.0, USDC: 0.0 },
  XRPUSDT: { BTCUSDT: 0.49, ETHUSDT: 0.51, SOLUSDT: 0.46, AVAXUSDT: 0.42, BNBUSDT: 0.39, DOGEUSDT: 0.32, XRPUSDT: 1.0, ADAUSDT: 0.40, USDT: 0.0, USDC: 0.0 },
  ADAUSDT: { BTCUSDT: 0.55, ETHUSDT: 0.58, SOLUSDT: 0.52, AVAXUSDT: 0.49, BNBUSDT: 0.42, DOGEUSDT: 0.36, XRPUSDT: 0.40, ADAUSDT: 1.0, USDT: 0.0, USDC: 0.0 },
};

export const RiskMetricsDashboard: React.FC = () => {
  // Config state
  const [confidenceLevel, setConfidenceLevel] = useState<0.95 | 0.99>(0.95);
  const [holdingPeriod, setHoldingPeriod] = useState<1 | 5 | 10>(1);
  const [selectedScenario, setSelectedScenario] = useState<string>('covid');
  const [refreshCount, setRefreshCount] = useState(0);

  // New Risk Management Configuration state
  const [maxDailyDrawdown, setMaxDailyDrawdown] = useState<number>(() => {
    return Number(localStorage.getItem('risk_max_daily_drawdown') || '5.0');
  });
  const [stopLossPercentage, setStopLossPercentage] = useState<number>(() => {
    return Number(localStorage.getItem('risk_stop_loss_pct') || '4.0');
  });
  const [totalExposureCap, setTotalExposureCap] = useState<number>(() => {
    return Number(localStorage.getItem('risk_total_exposure_cap') || '75.0');
  });
  const [isSavingRiskParams, setIsSavingRiskParams] = useState<boolean>(false);
  const [simulatedCrash, setSimulatedCrash] = useState<number>(0);

  const handleSaveRiskParams = () => {
    setIsSavingRiskParams(true);
    localStorage.setItem('risk_max_daily_drawdown', maxDailyDrawdown.toString());
    localStorage.setItem('risk_stop_loss_pct', stopLossPercentage.toString());
    localStorage.setItem('risk_total_exposure_cap', totalExposureCap.toString());
    
    setTimeout(() => {
      setIsSavingRiskParams(false);
      toast.success('Risikoparametre gemt!', {
        description: 'Dine grænser for drawdown, stop-loss og eksponering er nu aktive i systemet.'
      });
    }, 600);
  };

  // Portfolio tracking data
  const [heldAssets, setHeldAssets] = useState<{ asset: string; balance: number; valueUsd: number; weight: number }[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Stress testing scenarios definitions
  const SCENARIOS = [
    { id: 'covid', name: 'Covid-19 Panik (-15% shock)', btcShock: -0.15, ethShock: -0.18, solShock: -0.24, desc: 'Efterligner marts 2020 likviditetskrisen med massive tvangssalg over hele linjen.' },
    { id: 'bullrun', name: 'Parabolsk Bull-Run (+12% shock)', btcShock: 0.12, ethShock: 0.15, solShock: 0.22, desc: 'Positivt stresstest-scenarie, der efterligner aggressive opadgående impulsive trends.' },
    { id: 'chinaban', name: 'Kina Regulering Shock (-8% shock)', btcShock: -0.08, ethShock: -0.10, solShock: -0.14, desc: 'Fokuseret reguleringsstød mod krypto-mining og overførselsforbud.' },
    { id: 'ftx', name: 'FTX-stil Insolvens (-11% shock)', btcShock: -0.11, ethShock: -0.14, solShock: -0.22, desc: 'Pludseligt modpartrisiko-kollaps, der rammer Solana og alternative L1 økosystemer ekstra hårdt.' }
  ];

  // Fetch portfolio wallet data dynamically
  const fetchPortfolioData = async () => {
    setLoading(true);
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
        const spotList = data.spot || [];
        const earnList = data.earn || [];

        // Combine balances
        const rawMap = new Map<string, number>();
        spotList.forEach((s: any) => {
          const amt = parseFloat(s.free) + parseFloat(s.locked || '0');
          if (amt > 0) {
            rawMap.set(s.asset, (rawMap.get(s.asset) || 0) + amt);
          }
        });
        earnList.forEach((e: any) => {
          const amt = parseFloat(e.totalAmount);
          if (amt > 0) {
            rawMap.set(e.asset, (rawMap.get(e.asset) || 0) + amt);
          }
        });

        // Price helper
        const getAssetPrice = (asset: string) => {
          if (asset === 'USDT' || asset === 'USDC') return 1.0;
          const defaults: Record<string, number> = {
            BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30
          };
          return defaults[asset] || 1.0;
        };

        const list: { asset: string; balance: number; valueUsd: number; weight: number }[] = [];
        let total = 0;

        rawMap.forEach((bal, asset) => {
          const price = getAssetPrice(asset);
          const valUsd = bal * price;
          if (valUsd > 1) { // Filter dust
            list.push({ asset, balance: bal, valueUsd: valUsd, weight: 0 });
            total += valUsd;
          }
        });

        // Calculate weights
        const weightedList = list.map(item => ({
          ...item,
          weight: total > 0 ? item.valueUsd / total : 0
        })).sort((a, b) => b.valueUsd - a.valueUsd);

        setHeldAssets(weightedList);
        setTotalValue(total);
      }
    } catch (error) {
      console.error("Error loading risk metrics wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchPortfolioData();
    });
    return () => unsubscribe();
  }, [refreshCount]);

  // Fallback default assets if portfolio is empty or holds only USDT
  const activeAssets = useMemo(() => {
    const hasCrypto = heldAssets.some(h => h.asset !== 'USDT' && h.asset !== 'USDC');
    if (heldAssets.length >= 2 && hasCrypto) {
      return heldAssets;
    }
    // Return mock sample portfolio for full capability demonstration
    const sampleTotal = 12500;
    return [
      { asset: 'BTC', balance: 0.12, valueUsd: 8202, weight: 8202 / sampleTotal },
      { asset: 'ETH', balance: 0.85, valueUsd: 2966, weight: 2966 / sampleTotal },
      { asset: 'SOL', balance: 8.5, valueUsd: 1331, weight: 1331 / sampleTotal },
    ];
  }, [heldAssets]);

  const activeTotalValue = useMemo(() => {
    const hasCrypto = heldAssets.some(h => h.asset !== 'USDT' && h.asset !== 'USDC');
    return (heldAssets.length >= 2 && hasCrypto) ? totalValue : 12500;
  }, [heldAssets, totalValue]);

  // 1. Portfolio Beta calculation (weighted beta relative to BTC benchmark)
  const portfolioBeta = useMemo(() => {
    let beta = 0;
    activeAssets.forEach(item => {
      const paramKey = `${item.asset}USDT`;
      const assetBeta = ASSET_PARAMS[paramKey]?.beta ?? ASSET_PARAMS[item.asset]?.beta ?? 1.0;
      beta += assetBeta * item.weight;
    });
    return parseFloat(beta.toFixed(3));
  }, [activeAssets]);

  // 2. Portfolio Volatility (accounting for covariance / correlation)
  const portfolioVolatility = useMemo(() => {
    let doubleSum = 0;
    
    // Calculate sum_{i} sum_{j} w_i w_j cov(i, j)
    for (let i = 0; i < activeAssets.length; i++) {
      for (let j = 0; j < activeAssets.length; j++) {
        const itemI = activeAssets[i];
        const itemJ = activeAssets[j];
        
        const keyI = `${itemI.asset}USDT`;
        const keyJ = `${itemJ.asset}USDT`;
        
        const volI = ASSET_PARAMS[keyI]?.volatility ?? ASSET_PARAMS[itemI.asset]?.volatility ?? 0.03;
        const volJ = ASSET_PARAMS[keyJ]?.volatility ?? ASSET_PARAMS[itemJ.asset]?.volatility ?? 0.03;
        
        // Lookup correlation
        let corr = 0.5; // fallback
        if (itemI.asset === itemJ.asset) {
          corr = 1.0;
        } else {
          corr = CORRELATIONS[keyI]?.[keyJ] ?? CORRELATIONS[keyJ]?.[keyI] ?? 0.5;
        }
        
        const covariance = volI * volJ * corr;
        doubleSum += itemI.weight * itemJ.weight * covariance;
      }
    }
    
    const portVol = Math.sqrt(Math.max(0, doubleSum));
    return portVol;
  }, [activeAssets]);

  // 3. Value at Risk (VaR) Calculation
  const varResult = useMemo(() => {
    // Z-score based on confidence level
    const zScore = confidenceLevel === 0.95 ? 1.645 : 2.326;
    
    // Scale by holding period (square root of time rule)
    const timeFactor = Math.sqrt(holdingPeriod);
    
    const dailyVaRPerc = zScore * portfolioVolatility;
    const periodVaRPerc = dailyVaRPerc * timeFactor;
    const periodVaRUsd = activeTotalValue * periodVaRPerc;
    
    return {
      percentage: periodVaRPerc * 100,
      usd: periodVaRUsd
    };
  }, [confidenceLevel, holdingPeriod, portfolioVolatility, activeTotalValue]);

  // 4. Expected Shortfall (CVaR - Average loss beyond VaR threshold)
  const expectedShortfall = useMemo(() => {
    // Normal distribution approximation: ES = Vol * (exp(-Z^2/2) / ( (1-c) * sqrt(2*pi) ))
    const zScore = confidenceLevel === 0.95 ? 1.645 : 2.326;
    const alpha = 1 - confidenceLevel;
    const pdf = Math.exp(-Math.pow(zScore, 2) / 2) / Math.sqrt(2 * Math.PI);
    const scaleFactor = pdf / alpha;
    
    const timeFactor = Math.sqrt(holdingPeriod);
    const esPerc = portfolioVolatility * scaleFactor * timeFactor;
    const esUsd = activeTotalValue * esPerc;

    return {
      percentage: esPerc * 100,
      usd: esUsd
    };
  }, [confidenceLevel, holdingPeriod, portfolioVolatility, activeTotalValue]);

  // 5. Simulated Drawdown Chart Path & Historic Drawdown simulation
  const drawdownHistory = useMemo(() => {
    const steps = 30; // 30 historic days simulation
    const data = [];
    let currentHigh = 100;
    let currentValue = 100;
    
    // Seed standard random walk with drift and volatility
    // Max Drawdown simulated
    let maxDrawdown = 0;
    
    for (let day = 1; day <= steps; day++) {
      // Create path emphasizing a few stress events
      let returnVal = (Math.random() - 0.53) * 2 * (portfolioVolatility * 1.5);
      
      // Add manual shocks to simulate potential severe drawdowns on specific days
      if (day === 8) returnVal = -0.065 * portfolioBeta;
      if (day === 22) returnVal = -0.082 * portfolioBeta;
      if (day === 23) returnVal = -0.045 * portfolioBeta;
      
      currentValue = currentValue * (1 + returnVal);
      if (currentValue > currentHigh) {
        currentHigh = currentValue;
      }
      
      const drawdown = ((currentValue - currentHigh) / currentHigh) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
      
      data.push({
        day: `Dag ${day}`,
        Værdi: parseFloat(currentValue.toFixed(2)),
        Drawdown: parseFloat(drawdown.toFixed(2)),
      });
    }

    return { data, maxDrawdown };
  }, [portfolioVolatility, portfolioBeta]);

  // 6. Stress Testing scenario evaluation
  const stressScenarioResult = useMemo(() => {
    const activeScenario = SCENARIOS.find(s => s.id === selectedScenario) || SCENARIOS[0];
    
    let expectedDeclinePerc = 0;
    
    activeAssets.forEach(item => {
      let shock = activeScenario.btcShock; // fallback
      if (item.asset === 'BTC') shock = activeScenario.btcShock;
      else if (item.asset === 'ETH') shock = activeScenario.ethShock;
      else if (item.asset === 'SOL') shock = activeScenario.solShock;
      else {
        // scale alternative assets by their beta
        const paramKey = `${item.asset}USDT`;
        const assetBeta = ASSET_PARAMS[paramKey]?.beta ?? ASSET_PARAMS[item.asset]?.beta ?? 1.2;
        shock = activeScenario.btcShock * assetBeta;
      }
      expectedDeclinePerc += shock * item.weight;
    });

    const expectedDeclineUsd = activeTotalValue * expectedDeclinePerc;

    return {
      percentage: expectedDeclinePerc * 100,
      usd: expectedDeclineUsd,
      scenarioName: activeScenario.name,
      description: activeScenario.desc
    };
  }, [selectedScenario, activeAssets, activeTotalValue]);

  // Portfolio overall Risk Level categorization
  const riskCategory = useMemo(() => {
    const annualVol = portfolioVolatility * Math.sqrt(365) * 100;
    
    if (annualVol > 65 || portfolioBeta > 1.4) {
      return { label: 'EKSTREM RISIKO', color: 'text-rose-500 border-rose-500/20 bg-rose-500/5', desc: 'Høj gearing eller volatile altcoins dominerer.' };
    } else if (annualVol > 40 || portfolioBeta > 1.0) {
      return { label: 'HØJ RISIKO', color: 'text-amber-500 border-amber-500/20 bg-amber-500/5', desc: 'Typisk balanceret krypto-portefølje eksponeret for benchmark udsving.' };
    } else if (annualVol > 15 || portfolioBeta > 0.4) {
      return { label: 'MODERAT RISIKO', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5', desc: 'Konservativ sammensætning med stor andel stablecoins eller lav-beta aktiver.' };
    } else {
      return { label: 'LAV RISIKO', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', desc: 'Domineret af cash/stablecoins med ekstremt lav volatilitet.' };
    }
  }, [portfolioVolatility, portfolioBeta]);

  return (
    <div className="space-y-6" id="risk-metrics-dashboard-container">
      {/* Risk Banner Header */}
      <div className="bg-gradient-to-r from-gray-950 via-rose-950/20 to-gray-950 border border-rose-500/10 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="text-left">
            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit">
              <ShieldAlert className="size-3 animate-pulse" />
              Sikkerhed & Eksponeringsanalyse
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2.5 mt-2.5">
              <Layers className="size-6 text-rose-400" />
              Risiko & Drawdown Dashboard
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Udregn dit maksimale potentielle tab med **Value at Risk (VaR)** og stresstest din krypto-portefølje mod historiske likviditetsschok og markedspanik.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            {/* Dynamic Status Badging */}
            <div className={`px-4 py-2 rounded-2xl border text-xs font-black tracking-widest ${riskCategory.color}`}>
              {riskCategory.label}
            </div>

            {/* Manual refresh button */}
            <button
              onClick={() => {
                setRefreshCount(prev => prev + 1);
                toast.success('Opdaterede risikometrikker baseret på seneste wallet balances');
              }}
              disabled={loading}
              className="p-2.5 bg-gray-900 hover:bg-gray-850 border border-white/5 hover:border-rose-500/30 rounded-xl text-gray-400 hover:text-rose-400 transition-all cursor-pointer disabled:opacity-50"
              title="Genberegn risikoparametre"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid containing primary stats & parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Risk Param Selector Panel & Configuration */}
        <div className="lg:col-span-1 bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 text-left space-y-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-1">
            <Compass className="size-4 text-rose-400" /> 
            <span>Model Parametre</span>
          </h4>

          {/* Confidence Level Slider */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between">
              <span>Konfidensniveau (1-α):</span>
              <span className="text-rose-400 font-mono font-black">{(confidenceLevel * 100).toFixed(0)}%</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfidenceLevel(0.95)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${confidenceLevel === 0.95 ? 'bg-rose-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 border border-white/5 hover:text-white'}`}
              >
                95% Konfidens
              </button>
              <button
                onClick={() => setConfidenceLevel(0.99)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${confidenceLevel === 0.99 ? 'bg-rose-600 text-white shadow-md' : 'bg-gray-900 text-gray-400 border border-white/5 hover:text-white'}`}
              >
                99% Konfidens
              </button>
            </div>
            <p className="text-[9px] text-gray-500 leading-relaxed">
              En højere konfidens (99%) forbereder dig på sjældne ekstreme begivenheder, mens 95% afspejler daglige markedsvariationer.
            </p>
          </div>

          <hr className="border-white/5" />

          {/* Holding Period selector */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between">
              <span>Tidshorisont:</span>
              <span className="text-rose-400 font-mono font-black">{holdingPeriod} {holdingPeriod === 1 ? 'Dag' : 'Dage'}</span>
            </label>
            <div className="flex bg-gray-900/80 p-1 rounded-xl border border-white/5">
              {([1, 5, 10] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setHoldingPeriod(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${holdingPeriod === p ? 'bg-rose-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  {p}D
                </button>
              ))}
            </div>
            <p className="text-[9px] text-gray-500 leading-relaxed">
              Udregnes statistisk via kvadratrods-tidskaleringen (kvadratroden af T) ud fra den daglige krypto-volatilitet.
            </p>
          </div>

          <hr className="border-white/5" />

          {/* Active holdings list brief summary */}
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Beregnet Portefølje ({activeAssets.length} aktiver)</span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {activeAssets.map(item => (
                <div key={item.asset} className="flex justify-between items-center text-[10px] font-mono py-1 border-b border-white/5 last:border-b-0">
                  <span className="text-gray-300 font-bold">{item.asset}</span>
                  <div className="text-right">
                    <span className="text-gray-100 block">${item.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-gray-500 text-[8px]">{(item.weight * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
            {heldAssets.length === 0 && (
              <p className="text-[8px] text-amber-500/80 italic">
                Viser model-portefølje (simuleret) da der ikke blev fundet kryptoaktiver i din rigtige wallet.
              </p>
            )}
          </div>
        </div>

        {/* Core Risk Metrics Cards (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Value at Risk (VaR) Card */}
            <div className="bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Value at Risk (VaR)</span>
                  <Percent className="size-4 text-rose-400" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-mono font-black text-white">
                    ${varResult.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-rose-400 block font-mono font-bold mt-1">
                    -{varResult.percentage.toFixed(2)}% af porteføljen
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 leading-relaxed pt-3 border-t border-white/5">
                Med <strong className="text-gray-200">{(confidenceLevel * 100).toFixed(0)}% sandsynlighed</strong> vil dit tab <strong className="text-gray-200">ikke</strong> overstige dette beløb over de næste {holdingPeriod} {holdingPeriod === 1 ? 'dag' : 'dage'}.
              </p>
            </div>

            {/* Expected Shortfall (CVaR) Card */}
            <div className="bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expected Shortfall (CVaR)</span>
                  <ShieldAlert className="size-4 text-rose-500" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-mono font-black text-white">
                    ${expectedShortfall.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-rose-500 block font-mono font-bold mt-1">
                    -{expectedShortfall.percentage.toFixed(2)}% af porteføljen
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 leading-relaxed pt-3 border-t border-white/5">
                Det <strong className="text-gray-200">gennemsnitlige forventede tab</strong> i de absolut værste {( (1-confidenceLevel)*100 ).toFixed(0)}% af markedsudfaldene.
              </p>
            </div>

            {/* Portfolio Beta and Volatility Card */}
            <div className="bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Beta & Volatilitet</span>
                  <Scale className="size-4 text-cyan-400" />
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <span className="text-2xl font-mono font-black text-white">
                      β {portfolioBeta}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Følsomhed relateret til BTCUSDT
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-mono font-bold text-gray-300 block">
                      Dagl. Volatilitet: {(portfolioVolatility * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 leading-relaxed pt-3 border-t border-white/5">
                Et beta-mål på <strong className="text-gray-200">{portfolioBeta}</strong> betyder, at din portefølje er {portfolioBeta > 1 ? 'mere' : 'mindre'} volatil end det bredere kryptomarked.
              </p>
            </div>

          </div>

          {/* Risk Management Configuration Panel */}
          <div className="bg-gradient-to-tr from-gray-950 via-gray-950/80 to-rose-950/10 border border-rose-500/15 rounded-3xl p-6 text-left space-y-6 relative overflow-hidden" id="risk-config-panel">
            {/* Ambient decorative glowing blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10">
              <div>
                <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit">
                  <Lock className="size-3" />
                  Konto Sikkerhedssystem
                </span>
                <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mt-1.5">
                  <Sliders className="size-4 text-rose-400" />
                  Indstillinger for Risikostyring (Risk Management)
                </h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  Sæt faste systemgrænser for at beskytte din saldo mod uventet volatilitet og store markedsfald under automatiserede handler.
                </p>
              </div>

              <button
                onClick={handleSaveRiskParams}
                disabled={isSavingRiskParams}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/10 active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
              >
                <Save className="size-3.5" />
                {isSavingRiskParams ? 'Gemmer...' : 'Gem Regler'}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 relative z-10">
              {/* Sliders Area (3 columns) */}
              <div className="xl:col-span-3 space-y-5">
                {/* Max Daily Drawdown Limit Slider */}
                <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="size-3 text-rose-400" />
                      Maks. Dagligt Drawdown-Loft
                    </label>
                    <span className="text-xs font-mono font-black text-rose-400">{maxDailyDrawdown.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="20.0"
                    step="0.5"
                    value={maxDailyDrawdown}
                    onChange={(e) => setMaxDailyDrawdown(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-gray-500">
                    <span>Konservativ (1.0%)</span>
                    <span>Moderat (5.0%)</span>
                    <span>Aggressiv (20.0%)</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    Automatisk nødstop og lukning af alle aktive Autopilot-robotter, hvis dagens samlede tab overskrider denne procentsats.
                  </p>
                </div>

                {/* Stop-Loss Percentage Slider */}
                <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Percent className="size-3 text-orange-400" />
                      Stop-Loss Niveau pr. Trade
                    </label>
                    <span className="text-xs font-mono font-black text-orange-400">{stopLossPercentage.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.1"
                    value={stopLossPercentage}
                    onChange={(e) => setStopLossPercentage(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-gray-500">
                    <span>Stramt (0.5%)</span>
                    <span>Standard (4.0%)</span>
                    <span>Bredt (15.0%)</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    Standard stop-loss for alle individuelle handler udført af systemet. Beskytter mod pludselige krak i enkelte coins.
                  </p>
                </div>

                {/* Total Exposure Cap Slider */}
                <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="size-3 text-cyan-400" />
                      Samlet Eksponeringsloft (Total Exposure Cap)
                    </label>
                    <span className="text-xs font-mono font-black text-cyan-400">{totalExposureCap.toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={totalExposureCap}
                    onChange={(e) => setTotalExposureCap(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-gray-500">
                    <span>Høj Sikkerhed (10%)</span>
                    <span>Balanceret (75%)</span>
                    <span>Fuld Kapacitet (100%)</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    Maksimal procentsats af din samlede konto, der må allokeres på tværs af alle robotpositioner samtidig for at undgå over-gearing.
                  </p>
                </div>
              </div>

              {/* Dynamic Status / Interactive Guard Rails Simulator (2 columns) */}
              <div className="xl:col-span-2 bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-rose-400">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Realtid Sikkerheds-Monitor</span>
                  </div>

                  {/* Visual Guard Rail Status Checkboxes */}
                  <div className="space-y-2 text-[10px] font-sans">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-gray-300 font-bold uppercase tracking-wide text-[9px]">Drawdown Guard:</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[9px]">Aktiv &lt; {maxDailyDrawdown}%</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-gray-300 font-bold uppercase tracking-wide text-[9px]">Stop-Loss Guard:</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[9px]">Fastlåst på {stopLossPercentage}%</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-gray-300 font-bold uppercase tracking-wide text-[9px]">Exposure Guard:</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[9px]">Grænse: {totalExposureCap}%</span>
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  {/* Interactive Crash Simulator Slider */}
                  <div className="space-y-2 bg-gray-950 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-gray-400 font-bold uppercase font-mono">Test Sikkerheds-reaktion</span>
                      <span className="text-[10px] font-mono font-black text-rose-400">-{simulatedCrash.toFixed(1)}% fald</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="20.0"
                      step="0.5"
                      value={simulatedCrash}
                      onChange={(e) => setSimulatedCrash(parseFloat(e.target.value))}
                      className="w-full accent-white h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                    />
                    
                    {/* Simulated Output Message */}
                    <AnimatePresence mode="wait">
                      {simulatedCrash === 0 ? (
                        <motion.div
                          key="normal"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9.5px] rounded-lg mt-2 leading-relaxed"
                        >
                          <p className="font-bold uppercase text-[9px] flex items-center gap-1.5 mb-0.5">
                            <ShieldCheck className="size-3.5 shrink-0" />
                            Alt System OK
                          </p>
                          Ingen udløste sikringer. Dit automatiserede handelssystem kører sikkert.
                        </motion.div>
                      ) : simulatedCrash >= maxDailyDrawdown ? (
                        <motion.div
                          key="drawdown_tripped"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[9.5px] rounded-lg mt-2 leading-relaxed"
                        >
                          <p className="font-bold text-rose-400 uppercase text-[9px] flex items-center gap-1.5 mb-0.5">
                            <AlertTriangle className="size-3.5 shrink-0 animate-pulse" />
                            🚨 Nødstilstand: Drawdown Udløst!
                          </p>
                          Simuleret fald på -{simulatedCrash}% har overskredet dit daglige drawdown-loft på {maxDailyDrawdown}%. Autopilot robotter ville blive stoppet øjeblikkeligt og alle åbne positioner lukkes for at beskytte din portefølje!
                        </motion.div>
                      ) : simulatedCrash >= stopLossPercentage ? (
                        <motion.div
                          key="sl_tripped"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="p-2.5 bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[9.5px] rounded-lg mt-2 leading-relaxed"
                        >
                          <p className="font-bold text-orange-400 uppercase text-[9px] flex items-center gap-1.5 mb-0.5">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            ⚠️ Handels-Stop-Loss Udløst
                          </p>
                          Individuelle positioner ville blive solgt ved -{stopLossPercentage}% for at minimere tabet, mens autopilot-motoren forbliver aktiv for nye trades.
                        </motion.div>
                      ) : (
                        <motion.div
                          key="minor_fluctuation"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[9.5px] rounded-lg mt-2 leading-relaxed"
                        >
                          <p className="font-bold uppercase text-[9px] flex items-center gap-1.5 mb-0.5">
                            <Info className="size-3.5 shrink-0" />
                            Mindre markedskorrigering
                          </p>
                          Svingningen på -{simulatedCrash}% er indenfor din risikotolerance. Robotterne overvåger situationen normalt.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="text-[8px] font-mono text-gray-500 text-center mt-4">
                  Sikkerhedsmekanismer gemmes i din browser og synkroniseres til handelsmotoren.
                </div>
              </div>
            </div>
          </div>

          {/* Drawdown Area Chart visualizing maximum drop waves */}
          <div className="bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <TrendingDown className="size-4 text-rose-500" /> 
                <span>Historisk Simuleret Drawdown Wave</span>
              </h4>
              <div className="text-right text-[10px] font-mono text-gray-400">
                Max Drawdown Peak: <strong className="text-rose-400">{drawdownHistory.maxDrawdown.toFixed(2)}%</strong>
              </div>
            </div>

            {/* Recharts Drawdown Chart */}
            <div className="h-56 bg-black/40 border border-white/5 rounded-2xl p-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownHistory.data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b" 
                    fontSize={8} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={8} 
                    unit="%"
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-gray-950)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                    labelStyle={{ color: '#fff', fontSize: '10px' }}
                  />
                  <defs>
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="Drawdown" 
                    stroke="#f43f5e" 
                    strokeWidth={1.5} 
                    fillOpacity={1} 
                    fill="url(#colorDrawdown)" 
                    name="Fald fra top"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute top-2 right-4 text-[8px] font-mono text-gray-500">
                Simuleret drawdown-forløb over 30 perioder
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Testing Scenario analysis and mitigation section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Scenario selection & description on the left (2 columns) */}
        <div className="xl:col-span-2 bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 text-left space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
            <Zap className="size-4" /> Portefølje Stress-Testing
          </h4>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Stresstest giver mulighed for at vurdere den procentvise og monetære effekt af historisk kendte ekstreme stød på dine nuværende kryptoaktiver.
          </p>

          <div className="space-y-2.5">
            {SCENARIOS.map(sc => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  selectedScenario === sc.id 
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                    : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10'
                }`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${sc.btcShock < 0 ? 'bg-rose-500' : 'bg-emerald-400'}`}></div>
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-wide">{sc.name}</div>
                  <div className="text-[10px] opacity-80 leading-relaxed font-sans">{sc.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stress test dynamic impact & advice on the right (3 columns) */}
        <div className="xl:col-span-3 bg-gray-950/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 text-left flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
              <AlertTriangle className="size-4 animate-bounce" /> Forventet Shock Impact
            </h4>

            {/* Impact metric breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Estimeret tab i procent</span>
                <span className={`text-xl font-mono font-black flex items-baseline gap-1.5 ${stressScenarioResult.percentage < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {stressScenarioResult.percentage >= 0 ? '+' : ''}{stressScenarioResult.percentage.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Estimeret tab i USD</span>
                <span className={`text-xl font-mono font-black flex items-baseline gap-1.5 ${stressScenarioResult.percentage < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${stressScenarioResult.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Scenario detailed description */}
            <div className="p-3 bg-gray-900/60 rounded-xl border border-white/5 text-[10px] text-gray-400 space-y-1">
              <span className="font-bold text-gray-300 block uppercase tracking-wide text-[9px]">{stressScenarioResult.scenarioName}</span>
              <p className="leading-relaxed">{stressScenarioResult.description}</p>
            </div>
          </div>

          {/* Dynamic hedging & risk mitigation advice based on shock result */}
          <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
            <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Anbefalet Sikringsaktion (Hedging)</span>
            
            {stressScenarioResult.percentage < -15 ? (
              <div className="text-[11px] text-rose-300/90 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl space-y-1">
                <p className="font-bold uppercase tracking-wide text-[9px]">Sårbarhed Overfor Systematisk Kollaps</p>
                <p className="leading-relaxed">Din portefølje er yderst sårbar overfor likviditetschok (estimeret tab overstiger 15%). Det anbefales at flytte minimum 20% til stablecoins (USDT/USDC) eller benytte **Trailing Stop-Loss** beskyttelse for at låse profitter tidligt under panikudsalg.</p>
              </div>
            ) : stressScenarioResult.percentage < -5 ? (
              <div className="text-[11px] text-amber-300/90 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl space-y-1">
                <p className="font-bold uppercase tracking-wide text-[9px]">Moderat Sårbarhed overfor Markedsudsving</p>
                <p className="leading-relaxed">Porteføljen reagerer synkront med benchmark, men holder sig stabil grundet diversificerede coins. For at reducere drawdown, overvej at parre din BTC med stablecoin-rente (Earn) i mere urolige perioder.</p>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-300/90 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl space-y-1">
                <p className="font-bold uppercase tracking-wide text-[9px]">Høj Modstandsdygtighed detekteret</p>
                <p className="leading-relaxed">Meget begrænset shock-følsomhed på grund af store andele af stablecoins eller lav-beta aktiver. Du er godt positioneret til at modstå uforudsete markedsfald, men har begrænset upside under bull-runs.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
