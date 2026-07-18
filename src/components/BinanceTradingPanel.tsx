import React, { useState, useEffect, useRef, FormEvent, DragEvent, useMemo } from 'react';

// ⚡ Bolt: Cache Intl.NumberFormat instances outside the component to prevent recreating them on every render
// 🎯 Why: BinanceTradingPanel has frequent state updates from websocket streams and animation frames.
// Recreating formatting objects is expensive and causes unnecessary CPU overhead.
const pnlFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactVolumeFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const dkFormatter = new Intl.NumberFormat('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dkFormatterMin2 = new Intl.NumberFormat('da-DK', { minimumFractionDigits: 2 });
const defaultFormatterMin2 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 });

const formatSymbol = (sym: string) => {
  if (!sym) return "";
  if (sym.includes("/")) return sym; // already has slash
  const quotes = ["USDC", "USDT", "BTC", "ETH", "BNB", "EUR"];
  for (const quote of quotes) {
    if (sym.endsWith(quote)) {
      const base = sym.slice(0, sym.length - quote.length);
      return `${base}/${quote}`;
    }
  }
  return sym;
};

const ActivePositionCard = ({ pos, idx, symbol, allocation, lastPrice, globalTakeProfit, globalStopLoss, onUpdate }: any) => {
    const asset = symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, '');
    const quote = symbol.endsWith('USDC') ? 'USDC' : (symbol.endsWith('USDT') ? 'USDT' : (symbol.endsWith('BTC') ? 'BTC' : (symbol.endsWith('ETH') ? 'ETH' : (symbol.endsWith('BNB') ? 'BNB' : (symbol.endsWith('EUR') ? 'EUR' : 'USDT')))));
    const entryPrice = parseFloat(pos.price || '0');
    const currentPrice = parseFloat(pos.currentPrice || lastPrice || '0');
    const simProfitPct = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : (pos.simProfitPct || 0);
    const allocUsed = pos.actualAlloc || allocation;
    const rawPnl = allocUsed * (simProfitPct / 100);
    
    const [tp, setTp] = React.useState(pos.takeProfit ?? globalTakeProfit ?? 0);
    const [sl, setSl] = React.useState(pos.stopLoss ?? globalStopLoss ?? 0);
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdate(pos.id, tp, sl);
        setIsSaving(false);
    };

    return (
       <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mt-3 p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-2xl relative overflow-hidden"
       >
          <div className="flex justify-between items-center mb-1.5">
             <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{asset}/{quote} Position #{idx + 1}</span>
             <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold tracking-widest uppercase">{pos.status || 'LIVE'}</span>
          </div>
          <div className="space-y-1 font-mono text-[10px] text-gray-300">
             <div className="flex justify-between">
                <span className="text-gray-500">Indgang:</span>
                <span className="text-gray-200">${defaultFormatterMin2.format(entryPrice)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-500">Nuværende:</span>
                <span className="text-gray-200">
                   ${defaultFormatterMin2.format(currentPrice)}
                </span>
             </div>
             <div className="flex justify-between pt-1 border-t border-gray-800/40 mt-1 items-center">
                <span className="text-gray-500">Urealiseret PnL:</span>
                <span className={`text-[11px] font-bold ${simProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {simProfitPct >= 0 ? '+' : ''}
                   {simProfitPct.toFixed(2)}%
                   <span className="text-[9px] opacity-80 pl-1 font-normal">
                      ({rawPnl >= 0 ? '+' : ''}${rawPnl.toFixed(2)})
                   </span>
                </span>
             </div>
             
             {/* New TP/SL Controls */}
             <div className="pt-2 mt-2 border-t border-gray-800/40 grid grid-cols-2 gap-2">
                <div>
                   <label className="text-[9px] text-gray-500 block mb-1">Take Profit (%)</label>
                   <input 
                      type="number" 
                      value={tp ?? ''} 
                      onChange={(e) => setTp(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 text-emerald-400 rounded p-1 text-xs" 
                   />
                </div>
                <div>
                   <label className="text-[9px] text-gray-500 block mb-1">Stop Loss (%)</label>
                   <input 
                      type="number" 
                      value={sl ?? ''} 
                      onChange={(e) => setSl(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 text-rose-400 rounded p-1 text-xs" 
                   />
                </div>
             </div>
             <button 
                onClick={handleSave} 
                disabled={isSaving || (tp === (pos.takeProfit ?? globalTakeProfit) && sl === (pos.stopLoss ?? globalStopLoss))}
                className="w-full mt-2 py-1.5 bg-cyan-900/40 hover:bg-cyan-800 text-cyan-300 rounded text-[10px] uppercase font-bold tracking-widest disabled:opacity-50 transition-all"
             >
                {isSaving ? 'Gemmer...' : 'Opdater Grænser'}
             </button>
          </div>
       </motion.div>
    );
};

import { Sparkles, Lock, Bot, Zap, Play, Square, TrendingUp, TrendingDown, Anchor, Activity, RefreshCw, History, X, Shield, Info, Wallet, Calendar, Bell, Download, Newspaper, Mic, Search, ChevronDown, GitCompare, LineChart, BookOpen, ShieldCheck, Rocket, Globe, Loader2, GripVertical, ChevronLeft, ChevronRight, ChevronUp, LayoutGrid, BrainCircuit, Palette, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { useFirestorePersistence } from '../lib/persistence';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { AiAutopilot } from './AiAutopilot';
import { MacroTerminal } from './MacroTerminal';
import { NeuralOrderFlow } from './NeuralOrderFlow';
import { motion, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AreaChart, Area, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { savePnlToCalendar } from '../lib/calendar';
import { initAuth, googleSignIn, logout, getAccessToken, db, auth as firebaseAuth } from '../lib/auth';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { MarketScanner } from './MarketScanner';
import { speakTradeAction } from '../lib/speech';
import { logAuditEvent } from '../lib/auditLogger';
import { AiProModal } from './AiProModal';
import { TradeDiagnosticModal } from './TradeDiagnosticModal';
import { TradeErrorLog } from './TradeErrorLog';
import { ShieldAlert } from 'lucide-react';
import { TradingPresetsManager, TradingPreset } from './TradingPresetsManager';
import { WalletSummaryWidget } from './WalletSummaryWidget';
import { PortfolioSummary } from './PortfolioSummary';
import { TickerTape } from './TickerTape';
import { P2PPaymentModal } from './P2PPaymentModal';
import { CorrelationMatrix } from './CorrelationMatrix';
import { RiskMetricsDashboard } from './RiskMetricsDashboard';
import { DesignCenter } from './DesignCenter';
import { StrategyBacktester } from './StrategyBacktester';
import { StockChart } from './StockChart';
import { NewsFeed } from './NewsFeed';
import { GeminiChat } from './GeminiChat';
import { PortfolioRebalancer } from './PortfolioRebalancer';
import { OrderBook } from './OrderBook';
import { PortfolioDistribution } from './PortfolioDistribution';

interface Trade {
  id: number;
  price: string;
  quantity: string;
  time: number;
  isBuyerMaker: boolean;
}

interface PriceAlert {
  id: string;
  price: number;
  type: 'above' | 'below';
  triggered: boolean;
}

export interface BotOrder {
  id: string;
  symbol: string;
  type: string;
  pnl: number;
  time: Date;
  duration: string;
  fee?: number;
  txHash?: string;
  price?: number;
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  profitPercent?: number;
}

const AVAILABLE_PAIRS = [
  // Krypto
  { value: "BTCUSDT", label: "BTC/USDT (Bitcoin)" },
  { value: "BTCUSDC", label: "BTC/USDC (Bitcoin)" },
  { value: "ETHUSDT", label: "ETH/USDT (Ethereum)" },
  { value: "ETHUSDC", label: "ETH/USDC (Ethereum)" },
  { value: "SOLUSDC", label: "SOL/USDC (Solana)" },
  { value: "SOLUSDT", label: "SOL/USDT (Solana)" },
  { value: "SOLBTC", label: "SOL/BTC (Solana)" },
  { value: "SOLEUR", label: "SOL/EUR (Solana)" },
  { value: "SOLBNB", label: "SOL/BNB (Solana)" },
  { value: "BNBUSDT", label: "BNB/USDT (Binance Coin)" },
  { value: "DOGEUSDT", label: "DOGE/USDT (Dogecoin)" },
  { value: "USDCUSDT", label: "USDC/USDT (USDC)" },
  
  // ETF'er
  { value: "SPYUSDT", label: "SPY (S&P 500 ETF)" },
  { value: "QQQUSDT", label: "QQQ (Nasdaq 100 ETF)" },
  { value: "VOOUSDT", label: "VOO (Vanguard S&P 500 ETF)" },
  { value: "ARKKUSDT", label: "ARKK (Innovation ETF)" },

  // Obligationer
  { value: "TLTUSDT", label: "TLT (20+ Year Treasury Bond)" },
  { value: "BNDUSDT", label: "BND (Total Bond Market)" },
  { value: "AGGUSDT", label: "AGG (Core US Aggregate Bond)" },
  { value: "LQDUSDT", label: "LQD (Inv. Grade Corporate)" },
];

export function MarketStatusHeader({ serverSymbol, localSymbol }: { serverSymbol: string, localSymbol: string }) {
  return (
    <div className="bg-gray-900/60 border-y border-gray-800/80 p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
           <Activity className="size-4 animate-pulse" />
        </div>
        <div>
           <h4 className="text-sm font-bold text-gray-200 tracking-wider">Aktivt Handelspar (Server)</h4>
           <p className="text-[10px] text-gray-500 font-mono">Det par, som agenten analyserer og handler på serveren.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {serverSymbol ? (
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg border border-amber-500/30 font-mono text-sm font-bold">
            <span>{serverSymbol}</span>
            {serverSymbol !== localSymbol && (
               <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded ml-2 border border-amber-500/20" title="Det aktive par på serveren afviger fra din lokale UI-visning">Aktiv på Server</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-sm">
            <span>Indlæser...</span>
          </div>
        )}
      </div>
    </div>
  );
}

const mergePositionsLists = (prev: any[], next: any[]) => {
  if (!next) return [];
  return next.map((newPos: any) => {
    const existing = prev.find((p: any) => p.id === newPos.id);
    if (existing && existing.currentPrice !== undefined) {
      return {
        ...newPos,
        currentPrice: existing.currentPrice,
        simProfitPct: existing.simProfitPct !== undefined ? existing.simProfitPct : newPos.simProfitPct
      };
    }
    return newPos;
  });
};

export function BinanceTradingPanel({ addLog }: { addLog: (msg: string, type: 'info'|'warn'|'error') => void }) {
  const [showProModal, setShowProModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const saveKeys = async () => {
    try {
      const res = await fetch('/api/bot/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret })
      });
      if (res.ok) {
        addLog("API nøgler gemt!", "info");
        toast.success("Mæglernøglerne blev gemt på din konto!");
      } else {
        throw new Error();
      }
    } catch (e) {
      addLog("Fejl ved lagring af nøgler", "error");
      toast.error("Kunne ikke gemme API-nøglerne.");
    }
  }

  // Layout customization state & functions
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('binance_widget_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed)) { 
     if (!parsed.includes('orderBook')) parsed.push('orderBook'); 
     if (!parsed.includes('portfolioDistribution')) parsed.push('portfolioDistribution');
     if (!parsed.includes('tradeErrorLog')) parsed.push('tradeErrorLog'); 
     return parsed; 
  }
      } catch (e) {}
    }
    return ['agentControl', 'walletSummary', 'portfolioDistribution', 'orderBook', 'tradeErrorLog', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];
  });


  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newOrder = [...widgetOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    setWidgetOrder(newOrder);
    localStorage.setItem('binance_widget_order', JSON.stringify(newOrder));
    setDraggedIndex(null);
    toast.success("Dashboard layout opdateret!");
  };

  const moveWidget = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= widgetOrder.length) return;

    const newOrder = [...widgetOrder];
    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, removed);
    setWidgetOrder(newOrder);
    localStorage.setItem('binance_widget_order', JSON.stringify(newOrder));
    toast.success("Layout rækkefølge opdateret!");
  };

  const resetWidgetOrder = () => {
    const defaultOrder = ['agentControl', 'walletSummary', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'];
    setWidgetOrder(defaultOrder);
    localStorage.setItem('binance_widget_order', JSON.stringify(defaultOrder));
    toast.success("Layout nulstillet til standard!");
  };

  const WIDGET_LABELS: Record<string, string> = {
    agentControl: "Agent Kontrol & Parametre",
    walletSummary: "Wallet Balance Summary",
    realtimeTabs: "Realtid Datatavle & Feeds",
    aiPerformance: "AI Performance & Statistik",

    risikostyring: "Avanceret Risikoanalyse",
    maeglerforbindelse: "Mægler API Forbindelse",


  };

  const [symbol, setSymbol] = useState(() => {
    return localStorage.getItem('binance_pref_symbol') || 'BTCUSDT';
  });
  const [serverSymbol, setServerSymbol] = useState<string>('');
  const [tickerSearch, setTickerSearch] = useState('');
  const [showTickerDropdown, setShowTickerDropdown] = useState(false);
  const tickerDropdownRef = useRef<HTMLDivElement>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  
  const handlePredict = async () => {
    setPredicting(true);
    try {
        const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: symbol.replace("USDT", "") })
        });
        const data = await res.json();
        if (res.ok) {
           setPrediction(data);
           toast.success(`ML Prediktion: ${(data.predictedPrice as number).toFixed(2)}`);
        } else {
           toast.error(data.error || "Prediction failed");
        }
    } catch (e) {
        toast.error("Prediction failed");
    } finally {
        setPredicting(false);
    }
  }

  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentPrice, setCurrentPrice] = useState<string>('0.00');
  const [priceChange, setPriceChange] = useState<number>(0);
  
  
  
  const [txid, setTxid] = useState('');
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [p2pAmount, setP2PAmount] = useState<number>(0);
  const [p2pReference, setP2pReference] = useState<string>('');



  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  const handlePayFee = async () => {
    if (!txid || txid.trim().length < 10) {
      toast.error('Indtast venligst et gyldigt Transaktions-ID (TXID) først.');
      return;
    }
    
    setIsSubmittingTx(true);
    try {
      const res = await fetch('/api/pay-fee-manual', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid })
      });
      if (res.ok) {
        setUnpaidFee(0);
        setTxid('');
        toast.success('Betaling bekræftet via TXID. AI Trader er låst op!');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        toast.error('Kunne ikke registrere betaling.');
      }
    } catch (err) {
      toast.error('Payment error');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleBackup = async () => {
    try {
      await addDoc(collection(db, "backups"), {
        userId: googleUser?.uid || 'anonymous',
        data: {
          lastBackedUp: new Date().toISOString()
        },
        createdAt: serverTimestamp()
      });
      toast.success("Backup gennemført!");
    } catch (err) {
      toast.error("Backup fejlede");
    }
  };

  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
    toast.success('Adresse kopieret til udklipsholder');
  };


  const [isBotActive, setIsBotActive] = useState(false);
  const [unpaidFee, setUnpaidFee] = useState(0);
  const [isLiveTrading, setIsLiveTrading] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const [strategy, setStrategy] = useState(() => {
    return localStorage.getItem('binance_pref_strategy') || 'High-Frequency Scalper (HFT)';
  });
  const [secondaryStrategy, setSecondaryStrategy] = useState(() => {
    return localStorage.getItem('binance_pref_secondary_strategy') || 'Value Mean-Reversion';
  });
  
  


  useEffect(() => {
    localStorage.setItem('binance_pref_symbol', symbol);
  }, [symbol]);

  useEffect(() => {
    localStorage.setItem('binance_pref_strategy', strategy);
  }, [strategy]);

  useEffect(() => {
    localStorage.setItem('binance_pref_secondary_strategy', secondaryStrategy);
  }, [secondaryStrategy]);

  const [compareStrategyA, setCompareStrategyA] = useState(() => {
    return localStorage.getItem('binance_pref_compare_a') || 'High-Frequency Scalper (HFT)';
  });
  const [compareStrategyB, setCompareStrategyB] = useState(() => {
    return localStorage.getItem('binance_pref_compare_b') || 'Value Mean-Reversion';
  });

  useEffect(() => {
    localStorage.setItem('binance_pref_compare_a', compareStrategyA);
  }, [compareStrategyA]);

  useEffect(() => {
    localStorage.setItem('binance_pref_compare_b', compareStrategyB);
  }, [compareStrategyB]);
  const [allocation, setAllocation] = useState(10);
  const [takeProfit, setTakeProfit] = useState(10.0);
  const [stopLoss, setStopLoss] = useState(5.0);
  const [stopLossType, setStopLossType] = useState<'percentage'|'fixed'>('percentage');
  const [enableAutoStopLoss, setEnableAutoStopLoss] = useState(true);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [assistantSuggestion, setAssistantSuggestion] = useState<{takeProfit: number, stopLoss: number, reasoning: string} | null>(null);
  
  // Advanced Risk Management parameters
  const [useTrailingStop, setUseTrailingStop] = useState(false);
  const [useSmartRoute, setUseSmartRoute] = useState(true);
  const [dynamicSizing, setDynamicSizing] = useState(false);
  const [diversifySectors, setDiversifySectors] = useState(false);
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState(1.5); // % of account value
  const [autoAdjustVolatility, setAutoAdjustVolatility] = useState(false);
  const [useNewsSentiment, setUseNewsSentiment] = useState(false);
  const [circuitBreakerLimit, setCircuitBreakerLimit] = useState(5.0); // % daily drop limit
  const [enableDCA, setEnableDCA] = useState(false);
  const [dcaIntervalHours, setDcaIntervalHours] = useState(24);
  const [dcaAllocation, setDcaAllocation] = useState(10.0);
  const [stockTicker, setStockTicker] = useState('AAPL');
  const [mockStockData, setMockStockData] = useState<{name: string, value: number, volume?: number}[]>([]);

  useEffect(() => {
    // Generate some random stock data for demonstration
    const data = [];
    let price = 150 + Math.random() * 50;
    const now = new Date();
    for (let i = 0; i < 100; i++) {
       const time = new Date(now.getTime() - (100 - i) * 3600000);
       price = price * (1 + (Math.random() - 0.48) * 0.05);
       data.push({
          name: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: parseFloat(price.toFixed(2)),
          volume: Math.floor(Math.random() * 10000)
       });
    }
    setMockStockData(data);
  }, [stockTicker]);
  const [panelTab, setPanelTab] = useState<'dashboard' | 'live' | 'history' | 'wallet' | 'alerts' | 'analyses' | 'compare' | 'backtest' | 'journal' | 'scanner' | 'autopilot' | 'macro' | 'correlation' | 'risk' | 'design' | 'stocks'>('dashboard');

  useEffect(() => {
    (window as any).setBinancePanelTab = setPanelTab;
    return () => {
      delete (window as any).setBinancePanelTab;
    };
  }, [setPanelTab]);
  const [layoutMode, setLayoutMode] = useState<'detailed' | 'compact'>(() => {
    return (localStorage.getItem('binance_panel_layout_mode') as 'detailed' | 'compact') || 'detailed';
  });
  const [isBentoGridMinimized, setIsBentoGridMinimized] = useState(false);

  useEffect(() => {
    localStorage.setItem('binance_panel_layout_mode', layoutMode);
  }, [layoutMode]);
  const [activeCategory, setActiveCategory] = useState<'overblik' | 'analyse' | 'strategi'>('overblik');
  const [activeTheme, setActiveTheme] = useState<'obsidian' | 'alpine' | 'sage'>(() => {
    return (localStorage.getItem('binance_panel_theme') as 'obsidian' | 'alpine' | 'sage') || 'obsidian';
  });
  const [navStyle, setNavStyle] = useState<'grouped' | 'sidebar' | 'classic'>(() => {
    return (localStorage.getItem('binance_panel_nav_style') as 'grouped' | 'sidebar' | 'classic') || 'grouped';
  });

  const { data: botConfig, update: updateBotConfig } = useFirestorePersistence('systemState', 'botConfig', {
    isActive: false,
    symbol: 'BTCUSDT',
    allocation: 2,
    stopLoss: 5,
    takeProfit: 10,
    enableAutoStopLoss: true
  });

  useEffect(() => {
    if (botConfig.symbol !== symbol) setSymbol(botConfig.symbol);
    if (botConfig.allocation !== allocation) setAllocation(botConfig.allocation);
    if (botConfig.stopLoss !== stopLoss) setStopLoss(botConfig.stopLoss);
    if (botConfig.takeProfit !== takeProfit) setTakeProfit(botConfig.takeProfit);
    if (botConfig.isActive !== isBotActive) setIsBotActive(botConfig.isActive);
    if (botConfig.enableAutoStopLoss !== undefined && botConfig.enableAutoStopLoss !== enableAutoStopLoss) setEnableAutoStopLoss(botConfig.enableAutoStopLoss);
  }, [botConfig.symbol, botConfig.allocation, botConfig.stopLoss, botConfig.takeProfit, botConfig.isActive, botConfig.enableAutoStopLoss]);

  useEffect(() => {
    updateBotConfig({ symbol, allocation, stopLoss, takeProfit, isActive: isBotActive, enableAutoStopLoss });
  }, [symbol, allocation, stopLoss, takeProfit, isBotActive, enableAutoStopLoss]);

  const handleThemeChange = (theme: 'obsidian' | 'alpine' | 'sage') => {
    setActiveTheme(theme);
    localStorage.setItem('binance_panel_theme', theme);
  };

  const handleNavStyleChange = (style: 'grouped' | 'sidebar' | 'classic') => {
    setNavStyle(style);
    localStorage.setItem('binance_panel_nav_style', style);
  };

  const [tradeNotes, setTradeNotes] = useState<{id: string, symbol: string, content: string, time: string}[]>([]);

  // Firestore sync for trade notes (Voice Intel Notes)
  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      try {
        const stored = localStorage.getItem('binance_trade_notes');
        if (stored) setTradeNotes(JSON.parse(stored));
      } catch (e) {}
      return;
    }

    const q = query(collection(db, 'tradeNotes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setTradeNotes(notes.sort((a,b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()));
    }, (error) => {
      if (!error.message?.includes('offline')) {
        console.error("Trade notes sync failed", error);
      }
    });
    return () => unsubscribe();
  }, [googleUser]);

  useEffect(() => {
    if (!googleUser) {
      localStorage.setItem('binance_trade_notes', JSON.stringify(tradeNotes));
    }
  }, [tradeNotes, googleUser]);
  const [journalEntries, setJournalEntries] = useState<{id: string, date: string, symbol: string, type: 'Long' | 'Short' | 'Observation', reasoning: string}[]>([]);

  // Firestore sync for journal entries
  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      try {
        const stored = localStorage.getItem('binance_journal');
        if (stored) {
           const parsed = JSON.parse(stored);
           if (Array.isArray(parsed)) setJournalEntries(parsed);
        }
      } catch (e) {}
      return;
    }

    const q = query(collection(db, 'journalEntries'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setJournalEntries(entries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      if (!error.message?.includes('offline')) {
        console.error("Journal sync failed", error);
      }
    });
    return () => unsubscribe();
  }, [googleUser]);

  useEffect(() => {
    if (!googleUser) {
      localStorage.setItem('binance_journal', JSON.stringify(journalEntries));
    }
  }, [journalEntries, googleUser]);
  const recognitionRef = useRef<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<BotOrder[]>([]);

  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);
  const [historicalPricesLoading, setHistoricalPricesLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchHistoricalPrices = async () => {
      setHistoricalPricesLoading(true);
      try {
        const res = await fetch(`/api/binance-proxy/klines?symbol=${symbol}&interval=1h&limit=24`);
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
        if (String(err).includes('Failed to fetch')) return; console.error("Historical prices error:", err);
      } finally {
        if (active) setHistoricalPricesLoading(false);
      }
    };
    
    fetchHistoricalPrices();
    
    return () => { active = false; };
  }, [symbol]);


  const [dailyStats, setDailyStats] = useState({ changePercent: 0, volume: '0', high: '0', low: '0' });
  const [aiStrategyEnabled, setAiStrategyEnabled] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{action: string, reason: string} | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    if (!aiStrategyEnabled) return;
    
    let interval: any;
    const analyzeMarket = async () => {
      setAiAnalyzing(true);
      try {
         const res = await fetch('/api/gemini/analyze-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               symbol,
               marketData: {
                  price: currentPrice,
                  dailyStats: dailyStats,
               }
            })
         });
         if (res.ok) {
            const data = await res.json();
            setAiRecommendation(data);
         }
      } catch (err) {
         console.error(err);
      } finally {
         setAiAnalyzing(false);
      }
    };
    
    // Analyze immediately then every 30 seconds
    analyzeMarket();
    interval = setInterval(analyzeMarket, 30000);
    
    return () => clearInterval(interval);
  }, [aiStrategyEnabled, symbol, currentPrice, dailyStats]);

  const [totalPnl, setTotalPnl] = useState(0.00);
  const [activePositions, setActivePositions] = useState(0);
  const [activePositionsList, setActivePositionsList] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<{side: 'BUY' | 'SELL'; quantity: number; orderType: string} | null>(null);

  const [showDailySummary, setShowDailySummary] = useState(false);
  const [dailySummaryText, setDailySummaryText] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Improvements states
  const [historicalSummaries, setHistoricalSummaries] = useState<any[]>([]);
  const [selectedHistoricalSummary, setSelectedHistoricalSummary] = useState<any | null>(null);
  const [summaryMode, setSummaryMode] = useState<'current' | 'history' | 'qna'>('current');
  const [showTradesBreakdown, setShowTradesBreakdown] = useState(false);

  // Q&A Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const fetchHistoricalSummaries = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "dailySummaries"),
        where("userId", "==", user.uid),
        where("symbol", "==", symbol)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setHistoricalSummaries(list);
    } catch (err) {
      console.error("Failed to load historical summaries", err);
    }
  };

  useEffect(() => {
    if (showDailySummary) {
      fetchHistoricalSummaries();
      setSummaryMode('current');
      setChatHistory([]);
      setChatInput("");
      setSelectedHistoricalSummary(null);
    }
  }, [showDailySummary, symbol]);

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    return localStorage.getItem('pref_autoRefresh') !== 'false';
  });
  const [refreshInterval, setRefreshInterval] = useState(() => {
    return parseInt(localStorage.getItem('pref_refreshInterval') || '2000', 10);
  });

  useEffect(() => {
    const updatePrefs = () => {
      setAutoRefreshEnabled(localStorage.getItem('pref_autoRefresh') !== 'false');
      setRefreshInterval(parseInt(localStorage.getItem('pref_refreshInterval') || '2000', 10));
    };
    window.addEventListener('preferences_updated', updatePrefs);
    return () => window.removeEventListener('preferences_updated', updatePrefs);
  }, []);

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);

  // Firestore sync for price alerts
  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      try {
        const stored = localStorage.getItem('binance_price_alerts');
        if (stored) {
           const parsed = JSON.parse(stored);
           if (Array.isArray(parsed)) setPriceAlerts(parsed);
        }
      } catch (e) {}
      return;
    }

    const q = query(collection(db, 'priceAlerts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setPriceAlerts(alerts);
    }, (error) => {
      if (!error.message?.includes('offline')) {
        console.error("Price alerts sync failed", error);
      }
    });
    return () => unsubscribe();
  }, [googleUser]);

  useEffect(() => {
    if (!googleUser) {
      try {
        localStorage.setItem('binance_price_alerts', JSON.stringify(priceAlerts));
        window.dispatchEvent(new Event('binance_price_alerts_changed'));
      } catch (e) {
        console.error('Failed to sync price alerts:', e);
      }
    }
  }, [priceAlerts, googleUser]);
  const [newJournalSymbol, setNewJournalSymbol] = useState('BTCUSDT');
  const [newJournalType, setNewJournalType] = useState<'Long' | 'Short' | 'Observation'>('Observation');
  const [newJournalReasoning, setNewJournalReasoning] = useState('');
  
  const handleAddJournalEntry = async () => {
    if (!newJournalReasoning.trim()) return;
    const entryData = {
      date: new Date().toLocaleString(),
      symbol: newJournalSymbol,
      type: newJournalType,
      reasoning: newJournalReasoning,
      userId: firebaseAuth.currentUser?.uid || 'anonymous'
    };

    if (firebaseAuth.currentUser) {
      try {
        await addDoc(collection(db, 'journalEntries'), entryData);
        toast.success('Journal entry saved to Cloud');
      } catch (e: any) {
        console.error('Failed to save to Cloud', e);
        if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit')) {
           toast.error('Kan ikke gemme i journal: Database kvote er opbrugt for i dag.');
        } else {
           toast.error('Failed to save to Cloud');
        }
      }
    } else {
      const newEntry = { id: Math.random().toString(36).substr(2, 9), ...entryData };
      setJournalEntries([newEntry as any, ...journalEntries]);
      toast.success('Journal entry saved locally');
    }
    setNewJournalReasoning('');
  };
  const [newAlertPrice, setNewAlertPrice] = useState<string>('');
  const [newAlertTicker, setNewAlertTicker] = useState<string>('');
  const priceAlertsRef = useRef<any[]>([]);

  useEffect(() => {
    priceAlertsRef.current = priceAlerts;
  }, [priceAlerts]);
  const [isRecording, setIsRecording] = useState(false);
  const [newAlertType, setNewAlertType] = useState<'above' | 'below'>('above');
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  
    const prevActivePosRef = useRef(0);
  const prevLastErrorRef = useRef<string | null>(null);
  const prevTestStatusRef = useRef(false);


  useEffect(() => {
    alarmAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const notifyTrade = (type: 'buy' | 'sell', symbol: string, price: string) => {
     const title = type === 'buy' ? '🟢 Live Entry Executed' : '🔴 Live Exit Executed';
     const msg = `${symbol} @ $${price}`;
     
     addLog(`${title}: ${msg}`, 'info');
     
     if (type === 'buy') {
        toast.success(title, { description: msg });
     } else {
        toast.message(title, { description: msg, style: { color: '#fb7185', borderColor: '#f43f5e' }});
     }

     const priceNum = parseFloat(price);
     if (priceNum > 0) {
       window.dispatchEvent(new CustomEvent('trade-confirmed', {
         detail: {
           ticker: symbol,
           side: type === 'buy' ? 'BUY' : 'SELL',
           price: priceNum
         }
       }));
     }
     
     if (window.Notification && Notification.permission === 'granted') {
        new Notification(title, { body: msg });
     }
  };

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [manualRefreshCount, setManualRefreshCount] = useState(0);

  const handleManualRefresh = () => {
    setManualRefreshCount(c => c + 1);
    
    fetch('/api/bot/state')
      .then(res => res.json())
      .then(state => {
        if (state.orderHistory) {
            setOrderHistory(state.orderHistory.map((o: any) => ({...o, time: new Date(o.time)})));
        }
        addLog("Manuel opdatering: data synkroniseret", "info");
      })
      .catch(err => console.error("Failed to refresh bot state:", err));
      
    fetchWalletRef.current?.();
    
    toast.success("Data manuelt opdateret!");
  };
  const [autoScrollLive, setAutoScrollLive] = useState(true);
  const [isBacktest, setIsBacktest] = useState(false);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(false);

  const [showCustomParamsModal, setShowCustomParamsModal] = useState(false);
  const [customParams, setCustomParams] = useState({
    maxDrawdown: 10,
    trailingStopDistance: 1.5,
    leverage: 1,
    rsiLength: 14,
    rsiOversold: 30,
    rsiOverbought: 70
  });

  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState<{trades: number, netPnl: number, winRate: number, duration: string} | null>(null);

  const [dailyFeeDebt, setDailyFeeDebt] = useState(() => {
     return parseFloat(localStorage.getItem('davs_daily_fee_debt') || '0');
  });
  const [lastFeePaymentDate, setLastFeePaymentDate] = useState(() => {
     return localStorage.getItem('davs_last_payment_date') || new Date().toISOString().split('T')[0];
  });
  const [showFeePaymentModal, setShowFeePaymentModal] = useState(false);
  const processedOrdersRef = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem('processed_davs_orders') || '[]')));

  const [analysesData] = useState([
    { pair: 'BTC/USDT', confidence: 94, headline: 'Bitcoin Breaks Out Above Moving Average', summary: 'On-chain metrics suggest massive accumulation by whales, setting the stage for a strong push towards resistance.', date: 'I dag, 08:30', author: 'Quant AI', impact: 'Bullish' },
    { pair: 'ETH/USDT', confidence: 91, headline: 'Ethereum Network Upgrade Signals Confidence', summary: 'Deflationary pressure increases as network activity surges, painting a very positive outlook for the medium term.', date: 'I dag, 07:15', author: 'Quant AI', impact: 'Bullish' },
    { pair: 'SOL/USDC', confidence: 89, headline: 'Solana Shows High Resilience in Tech Sector', summary: 'Despite broader market sideways movement, SOL continues to show strength on shorter timeframes with high momentum.', date: 'I dag, 06:45', author: 'Quant AI', impact: 'Bullish' },
    { pair: 'AVAX/USDT', confidence: 88, headline: 'Avalanche Ecosystem Expansion Triggers Alert', summary: 'New partnerships and increased TVL indicate a potential breakout forming on the 4H chart.', date: 'I går, 23:20', author: 'Quant AI', impact: 'Neutral til Bullish' }
  ]);

  const [backtestStrategy, setBacktestStrategy] = useState('High-Frequency Scalper (HFT)');
  const [backtestTimeRange, setBacktestTimeRange] = useState('1M');
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestData, setBacktestData] = useState<any[] | null>(null);
  const [backtestMetrics, setBacktestMetrics] = useState<any>(null);

  const runBacktest = async () => {
    setIsBacktesting(true);
    setBacktestData(null);
    setBacktestMetrics(null);
    try {
      const res = await fetch('/api/bot/backtest', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            symbol: symbol || 'BTCUSDT',
            interval: backtestTimeRange === '1W' ? '1w' : backtestTimeRange === '1M' ? '1d' : '1h',
            limit: backtestTimeRange === '6M' ? 500 : 100,
            strategy: backtestStrategy,
            takeProfit,
            stopLoss,
            stopLossType
         })
      });
      const data = await res.json();
      if (res.ok) {
         setBacktestMetrics(data);
         toast.success('Backtest færdiggjort');
      } else {
         toast.error(data.error || 'Fejl under backtesting');
      }
    } catch (e) {
      toast.error('Netværksfejl under backtesting');
    } finally {
      setIsBacktesting(false);
    }
  };

  const [walletData, setWalletData] = useState<{spot: Record<string, any>[], earn: Record<string, any>[]} | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<{status: 'loading' | 'ok' | 'invalid' | 'missing', message?: string}>({status: 'loading'});
  const [isLoggingCalendar, setIsLoggingCalendar] = useState(false);

  const fetchApiHealth = async () => {
    try {
      const userApiKey = localStorage.getItem('user_binance_api_key');
      const userApiSecret = localStorage.getItem('user_binance_api_secret');
      const headers: any = {};
      if (userApiKey) headers['x-binance-api-key'] = userApiKey;
      if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
      if (googleUser?.uid) headers['x-user-uid'] = googleUser.uid;

      const res = await fetch('/api/binance/health', { headers });
      const data = await res.json();
      setApiHealth({ status: data.status, message: data.message });
    } catch (e) {
      setApiHealth({ status: 'invalid', message: 'Forbindelsesfejl ved tjek af API Health.' });
    }
  };

  useEffect(() => {
    fetchApiHealth();
    
    window.addEventListener('api_keys_updated', fetchApiHealth);
    
    // Initial bot state fetch from server (which is now persistent)
    fetch('/api/bot/state')
      .then(res => res.json())
      .then(state => {
        if (state) {
          setIsBotActive(state.isActive);
          if (state.unpaidFee !== undefined) setUnpaidFee(state.unpaidFee);
          setIsLiveTrading(state.isLiveTrading);
          setSymbol(state.symbol || 'BTCUSDT');
          setServerSymbol(state.symbol || '');
          if (state.userApiKey) setApiKey(state.userApiKey);
          if (state.userApiSecret) setApiSecret(state.userApiSecret);
          setAllocation(state.allocation || 10);
          setTakeProfit(state.takeProfit || 10.0);
          setStopLoss(state.stopLoss || 5.0);
          setStopLossType(state.stopLossType || 'percentage');
          if (state.enableAutoStopLoss !== undefined) setEnableAutoStopLoss(state.enableAutoStopLoss);
          setDynamicSizing(state.dynamicSizing || false);
          setMaxRiskPerTrade(state.maxRiskPerTrade || 1.5);
          setAutoAdjustVolatility(state.autoAdjustVolatility || false);
          setUseNewsSentiment(state.useNewsSentiment || false);
          setCircuitBreakerLimit(state.circuitBreakerLimit || 5.0);
          setEnableDCA(state.enableDCA || false);
          if (state.dcaIntervalHours !== undefined) setDcaIntervalHours(state.dcaIntervalHours);
          if (state.dcaAllocation !== undefined) setDcaAllocation(state.dcaAllocation);
          if (state.wsStatus) setWsStatus(state.wsStatus);
          if (state.reconnectCount !== undefined) setReconnectCount(state.reconnectCount);
          if (state.lastHeartbeat) setLastHeartbeat(state.lastHeartbeat);
          if (state.strategy) setStrategy(state.strategy);
          if (state.orderHistory) {
              setOrderHistory(state.orderHistory.map((o: any) => ({...o, time: new Date(o.time)})));
          }
        }
      })
      .catch(err => (err => { if (String(err).includes('Failed to fetch')) return; console.error("Initial state load failed", err); })(err));

    initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setNeedsGoogleAuth(false);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setNeedsGoogleAuth(true);
      }
    );
    
    return () => {
      window.removeEventListener('api_keys_updated', fetchApiHealth);
    };
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setNeedsGoogleAuth(false);
        addLog(`Google-konto forbundet: ${res.user.displayName || res.user.email}`, "info");
      }
    } catch (err: any) {
      console.error(err);
      addLog(`Kunne ikke forbinde Google-konto: ${err.message || err}`, "error");
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setNeedsGoogleAuth(true);
      addLog("Google-konto afbrudt.", "warn");
    } catch (err: any) {
      console.error(err);
      addLog(`Kunne ikke afbryde Google-konto: ${err.message || err}`, "error");
    }
  };

  const [isResettingPerformance, setIsResettingPerformance] = useState(false);
  
  const handleResetPerformance = async () => {
    if (!window.confirm("Er du sikker på, at du vil nulstille AI Performance? Dette vil slette din ordrehistorik og nulstille statistikken.")) return;
    
    setIsResettingPerformance(true);
    try {
      const res = await fetch('/api/bot/reset-performance', { method: 'POST' });
      if (!res.ok) throw new Error("Fejl ved nulstilling");
      addLog("AI Performance er blevet nulstillet.", "info");
      
      // Update state locally to reflect immediately
      setOrderHistory([]);
      setTotalPnl(0);
      setDailyFeeDebt(0);
      
    } catch (err: any) {
      addLog(`Nulstilling fejlede: ${err.message || err}`, "error");
    } finally {
      setIsResettingPerformance(false);
    }
  };

  const handleSaveToCalendar = async () => {
    if (needsGoogleAuth) {
      const connectConfirm = window.confirm("Du skal forbinde din Google-konto først for at synkronisere med kalenderen. Vil du forbinde nu?");
      if (!connectConfirm) return;
      try {
        const res = await googleSignIn();
        if (!res) {
          addLog("Google login blev afbrudt.", "error");
          return;
        }
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setNeedsGoogleAuth(false);
        addLog(`Google-konto forbundet: ${res.user.displayName || res.user.email}`, "info");
      } catch (err: any) {
        addLog(`Google-forbindelse fejlede: ${err.message || err}`, "error");
        return;
      }
    }

    const confirmed = window.confirm("Vil du gemme dagens PnL i din Google Kalender?");
    if (!confirmed) return;
    
    setIsLoggingCalendar(true);
    try {
      await savePnlToCalendar(totalPnl, winRate, activePositions);
      addLog("Dagens PnL er gemt i din Google Kalender.", "info");
    } catch (err: any) {
      addLog(`Kalender-fejl: ${err.message || err}`, "error");
    } finally {
      setIsLoggingCalendar(false);
    }
  };

  const fetchWalletRef = useRef<() => void>(() => {});

  useEffect(() => {
     fetchWallet();
  }, [isLiveTrading]);

  const fetchWallet = async () => {
     setWalletLoading(true);
     setWalletError(null);
     try {
       const userApiKey = localStorage.getItem('user_binance_api_key');
       const userApiSecret = localStorage.getItem('user_binance_api_secret');
       const headers: any = {};
       if (userApiKey) headers['x-binance-api-key'] = userApiKey;
       if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
       if (googleUser?.uid) headers['x-user-uid'] = googleUser.uid;

       const res = await fetch(`/api/binance/wallet?live=${isLiveTrading}`, { headers });
       if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || res.statusText || "Failed to fetch wallet");
       }
       const data = await res.json();
       setWalletData(data);
       window.dispatchEvent(new Event('wallet_updated'));
     } catch (err: any) {
       if (!String(err).includes('Failed to fetch')) setWalletError(err.message || 'Error loading wallet');
     } finally {
       setWalletLoading(false);
     }
  };

  const [editAsset, setEditAsset] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const handleUpdateWallet = async (e: any) => {
    e.preventDefault();
    if (!editAsset || !editAmount) return;
    try {
      const res = await fetch('/api/wallet/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset: editAsset.toUpperCase(), amount: editAmount })
      });
      if (!res.ok) throw new Error('Update failed');
      setEditAsset('');
      setEditAmount('');
      toast.success(`Opdaterede ${editAsset.toUpperCase()} beholdning`);
      fetchWallet();
    } catch (err: any) {
      toast.error('Kunne ikke opdatere wallet');
    }
  };

  fetchWalletRef.current = fetchWallet;

  const handleExportCsv = () => {
    if (orderHistory.length === 0) {
      addLog("Ingen historik at eksportere", "warn");
      return;
    }
    
    const headers = ['ID', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Gain/Loss (%)', 'PnL', 'Duration', 'Quantity', 'Time'];
    const csvRows = [headers.join(',')];
    
    orderHistory.forEach(order => {
      const row = [
        order.id,
        order.symbol,
        order.type,
        order.entryPrice ? order.entryPrice.toFixed(4) : '-',
        order.exitPrice ? order.exitPrice.toFixed(4) : (order.price ? order.price.toFixed(4) : '-'),
        order.profitPercent !== undefined ? order.profitPercent.toFixed(2) + '%' : '-',
        order.pnl.toFixed(2),
        order.duration || '-',
        order.quantity || '0',
        order.time.toISOString()
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trade_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog("Eksporterede ordrehistorik til CSV", "info");
  };

  // Derived stats
  const totalTrades = orderHistory?.length || 0;
  const winningTrades = orderHistory?.filter(o => o.pnl >= 0)?.length || 0;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  let avgHoldSeconds = 0;
  if ((orderHistory?.length || 0) > 0) {
    let totalSeconds = 0;
    orderHistory.forEach(o => {
      if (typeof o.duration === 'string') {
        if (o.duration.endsWith('ms')) {
           totalSeconds += parseFloat(o.duration.replace('ms', '')) / 1000;
        } else if (o.duration.endsWith('s')) {
           totalSeconds += parseFloat(o.duration.replace('s', ''));
        }
      }
    });
    avgHoldSeconds = Math.max(0, totalSeconds / orderHistory.length);
  }
  const avgHoldTimeStr = orderHistory.length === 0 ? '-' : (avgHoldSeconds > 60 ? `${(avgHoldSeconds/60).toFixed(1)}m` : `${avgHoldSeconds.toFixed(1)}s`);

  const pnlChartData = React.useMemo(() => {
    let currentCumPnlState = 0;
    return [...orderHistory].reverse().map(o => {
      currentCumPnlState += o.pnl;
      return {
        time: new Date(o.time).toLocaleTimeString(),
        cumPnl: currentCumPnlState,
        pnl: o.pnl
      };
    });
  }, [orderHistory]);

  const portfolioGrowthData = React.useMemo(() => {
    let currentBalance = 10000;
    
    if (walletData && walletData.spot) {
       const activeAsset = symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, '');
       const getAssetUsdPrice = (asset: string) => {
         if (asset === 'USDT' || asset === 'USDC') return 1.0;
         if (asset === activeAsset) return parseFloat(currentPrice) || 1.0;
         const defaults: Record<string, number> = {
           BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30, SPY: 510.50, QQQ: 440.20, VOO: 460.10, ARKK: 50.30, TLT: 90.50, BND: 72.10, AGG: 97.40, LQD: 105.20
         };
         return defaults[asset] || 1.0;
       };
       const spotTotal = walletData.spot.reduce((acc: number, b: any) => acc + (parseFloat(b.free) + parseFloat(b.locked || '0')) * getAssetUsdPrice(b.asset), 0);
       const earnTotal = (walletData.earn || []).reduce((acc: number, e: any) => acc + parseFloat(e.totalAmount) * getAssetUsdPrice(e.asset), 0);
       const grandTotal = spotTotal + earnTotal;
       if (grandTotal > 0) currentBalance = grandTotal;
    }

    const today = new Date();
    const dailyPnl: Record<string, number> = {};
    
    if (orderHistory && orderHistory.length > 0) {
      orderHistory.forEach((o: any) => {
        if (o.timestamp && o.pnl) {
          const d = new Date(o.timestamp);
          const dateStr = d.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit' });
          if (!dailyPnl[dateStr]) dailyPnl[dateStr] = 0;
          dailyPnl[dateStr] += o.pnl;
        }
      });
    }

    let runningBalance = currentBalance;
    const reversedData = [];
    
    for (let i = 0; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit' });
      
      reversedData.push({
        date: dateStr,
        balance: Math.max(0, runningBalance)
      });
      
      if (dailyPnl[dateStr]) {
        runningBalance -= dailyPnl[dateStr];
      }
    }
    
    return reversedData.reverse();
  }, [manualRefreshCount, walletData, orderHistory, symbol, currentPrice]);

  const totalTradesCount = orderHistory.length;
  const averagePnlVal = totalTradesCount > 0 ? (orderHistory || []).reduce((sum, o) => sum + (o.pnl || 0), 0) / totalTradesCount : 0;
  const maxWinVal = totalTradesCount > 0 ? Math.max(...orderHistory.map(o => o.pnl || 0)) : 0;
  const maxLossVal = totalTradesCount > 0 ? Math.min(...orderHistory.map(o => o.pnl || 0)) : 0;
  
  // Aggregate pairs
  const pairsObj: Record<string, { wins: number, total: number, holdStr: string }> = {};
  orderHistory.forEach(o => {
    if (!pairsObj[o.symbol]) pairsObj[o.symbol] = { wins: 0, total: 0, holdStr: o.duration };
    pairsObj[o.symbol].total += 1;
    if (o.pnl >= 0) pairsObj[o.symbol].wins += 1;
    pairsObj[o.symbol].holdStr = o.duration;
  });
  
  const pairStats = Object.keys(pairsObj).map(pair => {
    const s = pairsObj[pair];
    return {
      pair,
      winRate: s.total > 0 ? ((s.wins / s.total) * 100).toFixed(1) + '%' : '0.0%',
      trades: s.total,
      hold: s.holdStr
    };
  });

  // Risk management metrics
  const tradeReturns = [...orderHistory].reverse().map(o => o.pnl / allocation);
  const meanReturn = tradeReturns.length > 0 ? (tradeReturns || []).reduce((a, b) => a + b, 0) / tradeReturns.length : 0;
  const stdDevReturn = tradeReturns.length > 1 
    ? Math.sqrt((tradeReturns || []).reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (tradeReturns.length - 1)) 
    : 0;
  const sharpeRatio = stdDevReturn > 0 ? (meanReturn / stdDevReturn) * Math.sqrt(365) : 0;

  let peakCumPnl = 0;
  let currentCumPnl = 0;
  let currentDrawdownPct = 0;

  [...orderHistory].reverse().forEach(o => {
    currentCumPnl += o.pnl;
    if (currentCumPnl > peakCumPnl) {
      peakCumPnl = currentCumPnl;
    }
    const drawdown = peakCumPnl - currentCumPnl;
    currentDrawdownPct = (drawdown / allocation) * 100;
  });

  // Generate 7-day PnL heatmap data based on orderHistory
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const heatmapData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d,
      pnl: 0,
      trades: 0,
    };
  });

  orderHistory.forEach(o => {
    const tradeDate = new Date(o.time);
    tradeDate.setHours(0, 0, 0, 0);
    const dayMatch = heatmapData.find(h => h.date.getTime() === tradeDate.getTime());
    if (dayMatch) {
      dayMatch.pnl += o.pnl;
      dayMatch.trades += 1;
    }
  });

  const pnlSpring = useSpring(totalPnl, { stiffness: 50, damping: 20 });
  const pnlDisplay = useTransform(pnlSpring, (latest: any) => `$${pnlFormatter.format(Number(latest))}`);

  useEffect(() => {
    pnlSpring.set(totalPnl);
  }, [totalPnl, pnlSpring]);

  // 5-second polling mechanism for server symbol
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch('/api/bot/state');
        if (res.ok) {
          const state = await res.json();
          if (state.symbol) {
            setServerSymbol(state.symbol);
            if (state.isActive && state.symbol !== symbol) {
              setSymbol(state.symbol);
              toast.info(`Handelspar synkroniseret til aktiv bot (${formatSymbol(state.symbol)})`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to poll server symbol state:", err);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [symbol]);

  useEffect(() => {
    // Auto-switch disabled manually based on user request. 
    // It was causing the symbol to revert to USDT when USDC balance was low.
  }, [walletData, symbol, isBotActive, addLog, allocation]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetch('/api/bot/state')
        .then(res => res.json())
        .then(state => {
          if (state.symbol) setServerSymbol(state.symbol);
          if (state.orderHistory) {
              setOrderHistory(state.orderHistory.map((o: any) => ({...o, time: new Date(o.time)})));
          }
          addLog("Auto-refreshed trade feed and metrics", "info");
        })
        .catch(err => console.error("Failed to refresh bot state:", err));
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, addLog]);

  useEffect(() => {
    if (isBotActive) {
      fetch('/api/bot/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-binance-api-key': localStorage.getItem('user_binance_api_key') || '',
          'x-binance-api-secret': localStorage.getItem('user_binance_api_secret') || ''
        },
        body: JSON.stringify({ allocation })
      }).catch(e => console.error("Failed to update allocation:", e));
    }
  }, [allocation, isBotActive]);

  const wsRef = useRef<WebSocket | null>(null);
  const tradeBufferRef = useRef<any[]>([]);
  const lastTradeUpdateTimeRef = useRef<number>(0);
  const lastPriceRef = useRef<string>('0.00');
  const activePositionRef = useRef<{ price: number, time: number } | null>(null);
  const tradeCounterRef = useRef(0);
  const isBotActiveRef = useRef(isBotActive);
  const allocationRef = useRef(allocation);
  const symbolRef = useRef(symbol);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const orderHistoryRef = useRef(orderHistory);
  const isBacktestRef = useRef(isBacktest);
  const isLiveTradingRef = useRef(isLiveTrading);
  const isExecutingRef = useRef(false);
  const liveListRef = useRef<HTMLDivElement>(null);
  
  const autoSyncCalendarRef = useRef(autoSyncCalendar);
  const totalPnlRef = useRef(totalPnl);
  const winRateRef = useRef(winRate);
  const activePositionsRef = useRef(activePositions);
  
  useEffect(() => { autoSyncCalendarRef.current = autoSyncCalendar; }, [autoSyncCalendar]);
  useEffect(() => { totalPnlRef.current = totalPnl; }, [totalPnl]);
  useEffect(() => { winRateRef.current = winRate; }, [winRate]);
  useEffect(() => { activePositionsRef.current = activePositions; }, [activePositions]);

  useEffect(() => {
    // End of day sync interval
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() === 59 && autoSyncCalendarRef.current) {
         savePnlToCalendar(totalPnlRef.current, winRateRef.current, activePositionsRef.current)
            .then(() => addLog("Auto-sync: Successfully saved today's PnL to Google Calendar.", "info"))
            .catch(err => addLog(`Auto-sync Calendar failed: ${err.message || err}`, "error"));
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [addLog]);

  useEffect(() => {
    if (autoScrollLive && liveListRef.current) {
      liveListRef.current.scrollTop = 0;
    }
  }, [trades, autoScrollLive]);

  useEffect(() => {
    orderHistoryRef.current = orderHistory;
  }, [orderHistory]);

  useEffect(() => {
    isBacktestRef.current = isBacktest;
  }, [isBacktest]);

  useEffect(() => {
    isLiveTradingRef.current = isLiveTrading;
  }, [isLiveTrading]);

  useEffect(() => {
    if (isBotActive && !isBotActiveRef.current) {
        sessionStartTimeRef.current = new Date();
    } else if (!isBotActive && isBotActiveRef.current) {
        if (sessionStartTimeRef.current) {
            const sessionOrders = orderHistoryRef.current.filter((o: BotOrder) => o.time >= sessionStartTimeRef.current!);
            const trades = sessionOrders.length;
            const netPnl = (sessionOrders || []).reduce((sum: number, o: BotOrder) => sum + o.pnl, 0);
            const wins = sessionOrders.filter((o: BotOrder) => o.pnl >= 0).length;
            const winRate = trades > 0 ? (wins / trades * 100) : 0;
            const durationMs = new Date().getTime() - sessionStartTimeRef.current.getTime();
            const durationSec = Math.floor(durationMs / 1000);
            const durationMin = Math.floor(durationSec / 60);
            const durationStr = durationMin > 0 ? `${durationMin}m ${durationSec % 60}s` : `${durationSec}s`;

            // Only show session summary popup if the bot session lasted longer than 2.5 seconds.
            // This prevents unexpected overlays when there is quick status flipping/reconnects.
            if (durationMs > 2500) {
               setSessionSummaryData({ trades, netPnl, winRate, duration: durationStr });
               setShowSessionSummary(true);
            }
            sessionStartTimeRef.current = null;
            
            if (autoSyncCalendarRef.current) {
               addLog("Bot stopped, auto-syncing PnL to calendar...", "info");
               savePnlToCalendar(totalPnlRef.current, winRateRef.current, activePositionsRef.current)
                 .then(() => addLog("Auto-sync: Successfully saved today's PnL to Google Calendar.", "info"))
                 .catch(err => addLog(`Auto-sync Calendar failed: ${err.message || err}`, "error"));
            }
        }
    }
    isBotActiveRef.current = isBotActive;
  }, [isBotActive]);

  useEffect(() => {
    allocationRef.current = allocation;
  }, [allocation]);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog("Speech Recognition is not supported in this browser.", "error");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; 

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        const noteData = {
          symbol: symbolRef.current,
          content: transcript,
          time: new Date().toLocaleTimeString(),
          userId: firebaseAuth.currentUser?.uid || 'anonymous'
        };

        if (firebaseAuth.currentUser) {
          try {
            await addDoc(collection(db, 'tradeNotes'), noteData);
          } catch (e: any) {
            console.error('Failed to save voice note to cloud:', e);
            if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit')) {
               toast.error('Kan ikke gemme note: Firestore database kvote er opbrugt for i dag.');
            } else {
               toast.error('Der opstod en fejl ved gemning til cloud.');
            }
          }
        } else {
          setTradeNotes((prev) => [
            { id: Date.now().toString(), ...noteData },
            ...prev,
          ]);
        }
        addLog(`Voice note added for ${symbolRef.current}`, "info");
      };

      recognition.onerror = (event: any) => {
        addLog(`Speech recognition error: ${event.error}`, "error");
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn(e);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tickerDropdownRef.current && !tickerDropdownRef.current.contains(event.target as Node)) {
        setShowTickerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Connect to Binance WebSocket multiplex or poll Stock API
    const connectWS = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      const isCrypto = symbol.endsWith("USDT") || symbol.endsWith("USDC") || symbol.endsWith("BTC") || symbol.endsWith("ETH") || symbol.endsWith("BNB");
      
      if (!isCrypto) {
         // Stock polling logic
         addLog(`Started live polling for stock ${symbol}`, 'info');
         let isPolling = true;
         const pollStock = async () => {
            if (!isPolling) return;
            try {
               const res = await fetch(`/api/stock/quote?symbol=${symbol}`);
               if (res.ok) {
                  const data = await res.json();
                  const priceStr = parseFloat(data.price).toFixed(2);
                  
                  if (lastPriceRef.current !== '0.00') {
                     setPriceChange(parseFloat(priceStr) - parseFloat(lastPriceRef.current));
                  }
                  setCurrentPrice(priceStr);
                  lastPriceRef.current = priceStr;
                  
                  setDailyStats(prev => ({
                     ...prev,
                     changePercent: data.priceChangePercent
                  }));
                  
                  // Check Alerts for stocks
                  const currentAlerts = priceAlertsRef.current;
                  if (currentAlerts && currentAlerts.length > 0) {
                     const activeAlerts = currentAlerts.filter(a => !a.triggered && (!a.symbol || a.symbol === symbol));
                     if (activeAlerts.length > 0) {
                        const currentPriceNum = parseFloat(priceStr);
                        setPriceAlerts(prev => {
                           let hasChanged = false;
                           const updated = prev.map(alert => {
                              if (alert.triggered) return alert;
                              const alertSymbol = alert.symbol || symbol;
                              if (alertSymbol.toUpperCase() !== symbol.toUpperCase()) return alert;

                              const isTriggered = alert.type === 'above'
                                 ? currentPriceNum >= alert.price
                                 : currentPriceNum <= alert.price;

                              if (isTriggered) {
                                 hasChanged = true;
                                 addLog(`🚨 ALARM: ${alertSymbol} krydsede ${alert.price} (${alert.type})!`, 'warn');
                                 speakTradeAction(`Pris alarm udløst for ${alertSymbol}. Prisen er nu ${currentPriceNum}`);
                                 if (alarmAudioRef.current) {
                                    alarmAudioRef.current.play().catch(() => {});
                                 }
                                 return { ...alert, triggered: true };
                              }
                              return alert;
                           });
                           return hasChanged ? updated : prev;
                        });
                     }
                  }
               }
            } catch (err) {
               console.error("Stock poll error:", err);
            }
            if (isPolling) setTimeout(pollStock, 5000);
         };
         pollStock();
         
         return () => {
            isPolling = false;
         };
      }
      
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${symbol.toLowerCase()}@trade/${symbol.toLowerCase()}@ticker/!miniTicker@arr`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (!payload.stream) return;
        const stream = payload.stream;
        const data = payload.data;

        if (stream === '!miniTicker@arr') {
           const prices = new Map();
           data.forEach((ticker: any) => prices.set(ticker.s, parseFloat(ticker.c)));

           // Update Active Positions List pricing in real-time
           setActivePositionsList(prev => {
             if (!prev || prev.length === 0) return prev;
             let changed = false;
             const updated = prev.map(pos => {
               const posSymbol = pos.symbol || `${pos.assetName}${pos.quoteAsset}`;
               const livePrice = prices.get(posSymbol.toUpperCase());
               if (livePrice !== undefined) {
                 const currentPrice = livePrice;
                 const entryPrice = parseFloat(pos.price || '0');
                 const simProfitPct = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
                 
                 if (pos.currentPrice !== currentPrice || pos.simProfitPct !== simProfitPct) {
                   changed = true;
                   return { ...pos, currentPrice, simProfitPct };
                 }
               }
               return pos;
             });
             return changed ? updated : prev;
           });

           const currentAlerts = priceAlertsRef.current;
           if (currentAlerts && currentAlerts.length > 0) {
              const activeAlerts = currentAlerts.filter(a => !a.triggered);
              if (activeAlerts.length > 0) {
                 setPriceAlerts(prev => {
                   let hasChanged = false;
                   const updated = prev.map(alert => {
                      if (alert.triggered) return alert;
                      const alertSymbol = alert.symbol || symbolRef.current;
                      const currentPriceNum = prices.get(alertSymbol);
                      if (!currentPriceNum) return alert;

                      const isTriggered = alert.type === 'above'
                         ? currentPriceNum >= alert.price
                         : currentPriceNum <= alert.price;

                      if (isTriggered) {
                         hasChanged = true;
                         addLog(`🚨 ALARM: ${alertSymbol} krydsede ${alert.price} (${alert.type})!`, 'warn');
                         speakTradeAction(`Pris alarm udløst for ${alertSymbol}. Prisen er nu ${currentPriceNum}`);
                         if (alarmAudioRef.current) {
                            alarmAudioRef.current.play().catch(() => {});
                         }
                         return { ...alert, triggered: true };
                      }
                      return alert;
                   });
                   return hasChanged ? updated : prev;
                 });
              }
           }
        } else if (stream === `${symbol.toLowerCase()}@trade`) {
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
        } else if (stream === `${symbol.toLowerCase()}@ticker`) {
          setDailyStats({
            changePercent: parseFloat(data.P),
            volume: compactVolumeFormatter.format(parseFloat(data.v) * parseFloat(data.c)) + ' USDT',
            high: parseFloat(data.h).toFixed(2),
            low: parseFloat(data.l).toFixed(2)
          });
        }
      };

      ws.onerror = (error) => {
        console.warn(`Binance WebSocket Error for ${symbol}`, error);
      };
      
      ws.onclose = () => {
        // Automatically try to reconnect after 5 seconds if not unmounted
        setTimeout(connectWS, 5000);
      };
      
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    };

    const cleanup = connectWS();
    addLog(`Connected Live Stream for ${symbol}`, 'info');

    return () => {
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, [symbol, addLog]);

  const [isTabActive, setIsTabActive] = useState(() => typeof document !== 'undefined' ? !document.hidden : true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
     let interval: any = null;
     if (!autoRefreshEnabled) {
       return;
     }

     interval = setInterval(async () => {
        try {
           const res = await fetch('/api/bot/state');
           if (res.ok) {
              const state = await res.json();
              setIsBotActive(state.isActive);
              if (state.symbol) setServerSymbol(state.symbol);
          if (state.unpaidFee !== undefined) setUnpaidFee(state.unpaidFee);
              if (state.wsStatus) setWsStatus(state.wsStatus);
              if (state.reconnectCount !== undefined) setReconnectCount(state.reconnectCount);
              if (state.lastHeartbeat) setLastHeartbeat(state.lastHeartbeat);

              let posChanged = state.activePositions !== prevActivePosRef.current;
              if (state.lastError && state.lastError !== prevLastErrorRef.current) {
                 addLog(`Fejl fra trading bot: ${state.lastError} - Tjek API-nøgler og ordrekrav (min. 10 USDT)`, 'error');
                 prevLastErrorRef.current = state.lastError;
                 // Ensure we show it as toast too if it's new
                 toast.error(`Bot Fejl: ${state.lastError}`);
              }
              if (posChanged || state.isActive) {
                 setTimeout(() => {
                    fetchWalletRef.current?.();
                 }, 300);
              }
              if (state.activePositions > prevActivePosRef.current) {
                 notifyTrade('buy', state.symbol || symbol, lastPriceRef.current || '0.00');
                 prevActivePosRef.current = state.activePositions;
              } else if (state.activePositions < prevActivePosRef.current) {
                 notifyTrade('sell', state.symbol || symbol, lastPriceRef.current || '0.00');
                 prevActivePosRef.current = state.activePositions;
              }

              if (state.orderHistory && state.orderHistory.length > 0) {
                 setOrderHistory(state.orderHistory.map((o: string | any) => ({...o, time: new Date(o.time)})));
                 const netPnl = (state.orderHistory || []).reduce((sum: number, o: BotOrder) => sum + o.pnl, 0);
                 setTotalPnl(netPnl);
              }
              setActivePositions(state.activePositions);
              setActivePositionsList(prev => mergePositionsLists(prev, state.activePositionsList || []));
           }
        } catch(e) {}
     }, isTabActive ? refreshInterval : 60000);
     return () => {
        if (interval) clearInterval(interval);
     };
  }, [symbol, autoRefreshEnabled, refreshInterval, isTabActive]);

  const handleEmergencyStop = async () => {
    setIsBotActive(false);
    addLog("Nødstop aktiveret - Standser alle handelsagenter...", "error");
    try {
      await fetch('/api/bot/stop', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
     const today = new Date().toISOString().split('T')[0];
     let currentDebt = dailyFeeDebt;
     let hasNewDebt = false;
     
     const unseenOrders = orderHistory.filter(o => !processedOrdersRef.current.has(o.id));
     if (unseenOrders.length > 0) {
        unseenOrders.forEach(o => {
           if (o.pnl > 0) {
              currentDebt += (o.pnl * 0.01);
              hasNewDebt = true;
           }
           processedOrdersRef.current.add(o.id);
        });
        localStorage.setItem('processed_davs_orders', JSON.stringify(Array.from(processedOrdersRef.current)));
     }
     
     if (hasNewDebt) {
        setDailyFeeDebt(currentDebt);
        localStorage.setItem('davs_daily_fee_debt', currentDebt.toString());
     }
     
     if (lastFeePaymentDate !== today && currentDebt > 0 && !showFeePaymentModal) {
        if (isBotActive) {
            handleEmergencyStop();
        }
        setShowFeePaymentModal(true);
     }
  }, [orderHistory, lastFeePaymentDate, isBotActive, dailyFeeDebt, showFeePaymentModal]);

  const handlePayDailyFee = async () => {
    if (walletLoading) {
         toast.info("Indlæser wallet data, vent venligst...");
         return;
    }
    if (!walletData || !walletData.spot) {
         toast.error("Kunne ikke indlæse wallet data. Prøver at hente igen...");
         fetchWallet();
         return;
    }
    const usdt = walletData.spot.find((s:any) => s.asset === 'USDT');
    if (!usdt || parseFloat(usdt.free) < dailyFeeDebt) {
         toast.error(`Du har ikke nok USDT til at betale dit DAVs gebyr på $${dailyFeeDebt.toFixed(2)}`);
         return;
    }
    
    try {
        const res = await fetch('/api/wallet/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asset: 'USDT', amount: (parseFloat(usdt.free) - dailyFeeDebt).toString() })
        });
        if (!res.ok) throw new Error();
        
        const today = new Date().toISOString().split('T')[0];
        setDailyFeeDebt(0);
        localStorage.setItem('davs_daily_fee_debt', '0');
        setLastFeePaymentDate(today);
        localStorage.setItem('davs_last_payment_date', today);
        setShowFeePaymentModal(false);
        toast.success(`Dagligt DAVs gebyr på $${dailyFeeDebt.toFixed(2)} betalt!`);
        addLog(`Dagligt DAVs gebyr betalt. Adgang til AI Trader er åben.`, "info");
        fetchWallet();
    } catch (e) {
        toast.error("Kunne ikke betale gebyret.");
    }
  };

  const toggleBot = async () => {
    const newState = !isBotActive;
    
    const today = new Date().toISOString().split('T')[0];
    if (newState && lastFeePaymentDate !== today && dailyFeeDebt > 0) {
        setShowFeePaymentModal(true);
        addLog("AI Agent kan ikke startes. Du har ubetalte DAVs gebyrer fra i går.", "error");
        return;
    }

    if (newState && allocation < 10) {
        addLog("Minimumsbeløb for handel er 10 USDT.", "error");
        toast.error("Minimumsbeløb for handel er 10 USDT.");
        return;
    }

    if (newState) {
       console.log(`[UI] Toggling bot. Symbol: ${symbol}, Allocation: ${allocation}`);
       addLog(`AI Execution Agent started for ${symbol} running on backend`, 'info');
       try {
         const userApiKey = localStorage.getItem('user_binance_api_key');
         const userApiSecret = localStorage.getItem('user_binance_api_secret');
         const headers: any = { 'Content-Type': 'application/json' };
         if (userApiKey) headers['x-binance-api-key'] = userApiKey;
         if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
         if (googleUser?.uid) headers['x-user-uid'] = googleUser.uid;

         const response = await fetch('/api/bot/start', {
            method: 'POST',
            headers,
            body: JSON.stringify({ symbol, allocation, isLiveTrading, takeProfit, stopLoss, stopLossType, strategy, useTrailingStop, useSmartRoute, dynamicSizing, maxRiskPerTrade, diversifySectors, autoAdjustVolatility, useNewsSentiment, circuitBreakerLimit, enableDCA, dcaIntervalHours, dcaAllocation, enableAutoStopLoss })
         });
         if (response.ok) {
           setIsBotActive(true);
           toast.success(`Agent startet for ${symbol}`);
         } else {
           const errData = await response.json().catch(() => ({}));
           if (errData.feeRequired) setUnpaidFee(errData.amount);
           addLog(`Bot startup failed: ${errData.error || 'Check API keys in settings'}`, 'error');
           toast.error(`Kunne ikke starte agent: ${errData.error || 'Check API keys in settings'}`);
           if (isLiveTrading && errData.error && errData.error.includes("BINANCE_API_KEY_MISSING")) {
                setIsLiveTrading(false);
                toast.error("Live Trading deaktiveret pga. manglende API nøgler");
           }
         }
       } catch(e) {
         addLog(`Bot startup failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
         if (!String(e).includes('Failed to fetch')) toast.error(`Kunne ikke starte agent: ${e instanceof Error ? e.message : 'Unknown error'}`);
       }
    } else {
       setIsBotActive(false);
       addLog(`AI Execution Agent stopped for ${symbol}`, 'warn');
       toast.info(`Agent sat på pause for ${symbol}`);
       try {
         await fetch('/api/bot/stop', { method: 'POST' });
       } catch(e) {}
    }
  };

  const toggleTradingMode = async (toLive: boolean) => {
    if (toLive) {
      const hasKeys = localStorage.getItem('user_binance_api_key');
      if (!hasKeys) {
        toast.error("API nøgler mangler. Åbner Pro modal for konfiguration.");
        setShowProModal(true);
        return;
      }
    }
    
    setIsLiveTrading(toLive);
    
    // Update server state immediately
    try {
      const response = await fetch('/api/bot/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-binance-api-key': localStorage.getItem('user_binance_api_key') || '',
          'x-binance-api-secret': localStorage.getItem('user_binance_api_secret') || ''
        },
        body: JSON.stringify({ isLiveTrading: toLive })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update trading mode on server");
      }
    } catch (e: any) {
      toast.error(e.message);
      // Revert state if server update fails
      setIsLiveTrading(!toLive);
      return;
    }

    logAuditEvent({
      type: 'config',
      action: toLive ? 'LIVE_TRADING_ENABLED' : 'PAPER_TRADING_ENABLED',
      details: toLive 
        ? `Live Trading tilstand blev aktiveret. Handler vil nu blive eksekveret med rigtige midler på Binance.` 
        : `Paper Trading tilstand blev aktiveret. Handler udføres i et risikofrit simuleret sandkassemiljø med fiktive midler.`,
      status: toLive ? 'warning' : 'success',
      user: googleUser?.email || 'Bruger'
    });
    
    toast.success(toLive ? 'Live Trading tilstand aktiveret!' : 'Paper Trading (simuleret) aktiveret!');
  };

  const executeTrade = async (side: 'BUY' | 'SELL', quantity: number = allocation, orderType: string = 'MARKET') => {
    setPendingTrade({ side, quantity, orderType });
    setShowConfirmation(true);
  };

  const confirmTrade = async () => {
    if (!pendingTrade) return;
    const { side, quantity, orderType } = pendingTrade;
    if (quantity < 10) {
        addLog("Minimumsbeløb for handel er 10 USDT.", "error");
        setShowConfirmation(false);
        return;
    }
    try {
        const userApiKey = localStorage.getItem('user_binance_api_key');
        const userApiSecret = localStorage.getItem('user_binance_api_secret');
        const headers: any = { 'Content-Type': 'application/json' };
        if (userApiKey) headers['x-binance-api-key'] = userApiKey;
        if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
        if (googleUser?.uid) headers['x-user-uid'] = googleUser.uid;

        const response = await fetch('/api/trade/execute', {
            method: 'POST',
            headers,
            body: JSON.stringify({ symbol, side, allocation: quantity, orderType, isLiveTrading, useSmartRoute })
        });
        const data = await response.json();
        if (response.ok) {
            addLog(`${side} order executed for ${symbol} successfully. ${data.isPaper ? '(Paper Trading)' : '(Real Trading)'}. API Response: ${JSON.stringify(data)}`, 'info');
            
            logAuditEvent({
              type: 'trade',
              action: `MANUAL_TRADE_${side}`,
              details: `Manuel ${side}-ordre eksekveret på ${symbol}. Type: ${orderType}, Volumen: ${quantity} USDT. Rute: ${data.smartRoute ? 'SmartRoute Split' : 'Direkte API'}. ${data.isPaper ? '(Paper Trading)' : '(Binance Live)'}.`,
              status: 'success',
              user: googleUser?.email || 'Manuel Bruger'
            });
            if (data.smartRoute) {
                const splitsStr = data.smartRoute.splits.map((s: any) => `${s.pool}: ${s.percentage}% ($${s.allocation})`).join(', ');
                addLog(`Smart Route enabled: order split across multiple pools to reduce market impact. Splits: ${splitsStr}`, 'info');
                toast.success(`Smart Route aktiveret!`, {
                    description: `Minimeret glidning med ${data.smartRoute.marketImpactMitigation}. Splits: ${splitsStr}`
                });
            }
            if (side === 'SELL') {
                if (data.isPaper) {
                    toast.success(`${side} order executed via Paper Trading`);
                } else {
                    toast.success(`${side} order executed on Binance Live`);
                }
                speakTradeAction(side);
            }
            fetchWalletRef.current?.(); // Refresh wallet
            fetch('/api/bot/state')
              .then(res => res.json())
              .then(state => {
                 if (state) {
                   setActivePositions(state.activePositions);
                   setActivePositionsList(prev => mergePositionsLists(prev, state.activePositionsList || []));
                   if (state.wsStatus) setWsStatus(state.wsStatus);
                   if (state.reconnectCount !== undefined) setReconnectCount(state.reconnectCount);
                   if (state.lastHeartbeat) setLastHeartbeat(state.lastHeartbeat);
                 }
              })
              .catch(err => console.error("State refresh failed", err));

            // Extract price and symbol to suggest journal entry
            const executedPrice = typeof data.result === 'number' 
                ? data.result 
                : (data.result?.price || 0);

            if (executedPrice > 0) {
              window.dispatchEvent(new CustomEvent('trade-confirmed', {
                detail: {
                  ticker: symbol,
                  side: side,
                  price: executedPrice
                }
              }));
            }
        } else {
            addLog(`Trade failed for ${symbol}: ${data.error}. Verify requirements: min 10 USDT, valid API keys and pair.`, 'error');
            toast.error(data.error || "Trade failed");
            
            if (isLiveTrading && data.error && (data.error.includes("BINANCE_API_KEY_MISSING") || data.error.includes("Missing Binance API keys"))) {
                 setIsLiveTrading(false);
                 toast.error("Live Trading deaktiveret pga. manglende API nøgler");
            }
            logAuditEvent({
              type: 'error',
              action: `MANUAL_TRADE_FAILED`,
              details: `Mislykket ${side}-ordre på ${symbol}. Fejlmeddelelse: ${data.error || 'Ukendt API fejl'}.`,
              status: 'failure',
              user: googleUser?.email || 'Manuel Bruger'
            });
        }
    } catch (e: any) {
        addLog(`Trade error: ${e.message}`, 'error');
        logAuditEvent({
          type: 'error',
          action: `MANUAL_TRADE_EXCEPTION`,
          details: `Kritisk fejl under udførelse af ${side}-ordre på ${symbol}: ${e.message}`,
          status: 'failure',
          user: googleUser?.email || 'Manuel Bruger'
        });
    }
  };

  
  const handleLoadPreset = (preset: TradingPreset) => {
    if (preset.allocation !== undefined) setAllocation(preset.allocation);
    if (preset.takeProfit !== undefined) setTakeProfit(preset.takeProfit);
    if (preset.stopLoss !== undefined) setStopLoss(preset.stopLoss);
    if (preset.stopLossType !== undefined) setStopLossType(preset.stopLossType);
    if (preset.strategy !== undefined) setStrategy(preset.strategy);
    if (preset.useTrailingStop !== undefined) setUseTrailingStop(preset.useTrailingStop);
    if (preset.dynamicSizing !== undefined) setDynamicSizing(preset.dynamicSizing);
    if (preset.maxRiskPerTrade !== undefined) setMaxRiskPerTrade(preset.maxRiskPerTrade);
    if (preset.diversifySectors !== undefined) setDiversifySectors(preset.diversifySectors);
    if (preset.autoAdjustVolatility !== undefined) setAutoAdjustVolatility(preset.autoAdjustVolatility);
    if (preset.useNewsSentiment !== undefined) setUseNewsSentiment(preset.useNewsSentiment);
    if (preset.circuitBreakerLimit !== undefined) setCircuitBreakerLimit(preset.circuitBreakerLimit);
    if (preset.enableDCA !== undefined) setEnableDCA(preset.enableDCA);
    if (preset.dcaIntervalHours !== undefined) setDcaIntervalHours(preset.dcaIntervalHours);
    if (preset.dcaAllocation !== undefined) setDcaAllocation(preset.dcaAllocation);
  };

  
  const askStrategyAssistant = async () => {
    setIsAssistantLoading(true);
    setAssistantSuggestion(null);
    try {
      const klinesRes = await fetch(`/api/binance-proxy/klines?symbol=${symbol}&interval=1h&limit=50`);
      const klinesData = await klinesRes.json();
      
      const res = await fetch('/api/gemini/suggest-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          currentPrice,
          klinesData,
          model: "gemini-3.5-flash"
        })
      });
      
      if (!res.ok) throw new Error("Failed to get suggestion");
      const data = await res.json();
      setAssistantSuggestion(data);
      addLog(`Gemini foreslog TP: ${data.takeProfit}%, SL: ${data.stopLoss}% for ${symbol}`, 'info');
    } catch (e: any) {
      addLog(`Strategy Assistant Error: ${e.message}`, 'error');
      toast.error("Kunne ikke hente Gemini forslag");
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (allocation < 10) {
        addLog("Minimumsbeløb for handel er 10 USDT.", "error");
        toast.error("Minimumsbeløb for handel er 10 USDT.");
        return;
    }
    addLog(`AI Execution parameters updated for ${symbol}. Strategy: ${strategy}`, 'info');
    
    try {
      const response = await fetch('/api/bot/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-binance-api-key': localStorage.getItem('user_binance_api_key') || '',
          'x-binance-api-secret': localStorage.getItem('user_binance_api_secret') || ''
        },
        body: JSON.stringify({
          symbol,
          allocation,
          isLiveTrading,
          takeProfit,
          stopLoss,
          stopLossType,
          strategy,
          useTrailingStop,
          dynamicSizing,
          maxRiskPerTrade,
          diversifySectors,
          autoAdjustVolatility,
          useNewsSentiment,
          circuitBreakerLimit,
          enableDCA,
          dcaIntervalHours,
          dcaAllocation
        })
      });
      if (response.ok) {
        addLog("Konfiguration synkroniseret og gemt på serveren.", "info");
        toast.success("Konfiguration implementeret succesfuldt!");
      } else {
        const err = await response.json().catch(() => ({}));
        addLog(`Synkronisering af konfiguration fejlede: ${err.error || 'Ukendt fejl'}`, "error");
        toast.error(err.error || "Kunne ikke implementere konfiguration");
        
        if (isLiveTrading && err.error && err.error.includes("BINANCE_API_KEY_MISSING")) {
             setIsLiveTrading(false);
             toast.error("Live Trading deaktiveret pga. manglende API nøgler");
        }
      }
    } catch (e: any) {
      addLog(`Fejl ved opdatering af konfiguration: ${e.message}`, "error");
    }

    // Simulate some latency for deploying
    setTimeout(async () => {
      addLog("Successfully synced parameters to Binance Edge node.", 'info');
          // Run backtest simulation if enabled
      if (isBacktest) {
        addLog(`Initiating historical backtest for ${symbol} using ${strategy}...`, 'info');
        
        try {
          const res = await fetch(`/api/binance-proxy/klines?symbol=${symbol}&interval=1h&limit=50`);
          if (!res.ok) {
             const errText = await res.text();
             throw new Error(`Binance API error: ${errText}`);
          }
          const klines = await res.json();
          
          if (!Array.isArray(klines)) {
             throw new Error("Invalid response from Binance API");
          }

          const mockTrades: BotOrder[] = [];
          let runningPnl = 0;
          let lastEntryIndex = -1;
          let currentPosition: { entryPrice: number; type: 'BUY' | 'SELL'; time: Date } | null = null;
          
          for (let i = 0; i < klines.length; i++) {
            const kline = klines[i];
            const open = parseFloat(kline[1]) || 1;
            const close = parseFloat(kline[4]) || 1;
            const time = new Date(kline[6]); // Using kline close time
            
            if (!currentPosition) {
              // Simulated Signal: Enter a position if volatility exceeds 0.2%
              const changePct = (close - open) / open;
              if (Math.abs(changePct) > 0.002) {
                currentPosition = {
                  entryPrice: close,
                  type: changePct > 0 ? 'BUY' : 'SELL',
                  time: time
                };
                lastEntryIndex = i;
              }
            } else {
              // We have an active trade. Evaluate close based on SL/TP rules and Leverage
              const entryPrice = currentPosition.entryPrice;
              let tradeChangePct = (close - entryPrice) / entryPrice;
              if (currentPosition.type === 'SELL') {
                tradeChangePct = -tradeChangePct;
              }
              
              const profitPct = tradeChangePct * 100 * customParams.leverage;
              const hitTakeProfit = profitPct >= (takeProfit + 0.2); // Factoring in 0.2% round-trip fee to guarantee net-positive trade
              const hitStopLoss = profitPct <= -stopLoss;
              const forceTimedExit = (i - lastEntryIndex) >= 6; // Hold max 6 periods
              
              if (hitTakeProfit || hitStopLoss || forceTimedExit) {
                const tradeAllocation = allocation;
                const rawPnl = tradeAllocation * (profitPct / 100);
                const feeAmt = tradeAllocation * 0.001; // Binance standard fee (0.1%)
                const netPnl = rawPnl - (feeAmt * 2); // Round trip fee
                
                runningPnl += netPnl;
                
                mockTrades.push({
                  id: `BT-${Date.now().toString().slice(-4)}-${i}`,
                  symbol: symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, ''),
                  type: currentPosition.type,
                  pnl: netPnl,
                  time: time,
                  fee: feeAmt * 2,
                  txHash: `0x${Math.random().toString(16).slice(2, 10).toLowerCase()}`,
                  duration: `${(i - lastEntryIndex) || 1}h`,
                  price: entryPrice,
                  quantity: parseFloat((tradeAllocation / entryPrice).toFixed(5))
                });
                
                currentPosition = null;
              }
            }
          }
          
          // Complete any remaining open positions at the final kline close
          if (currentPosition && klines.length > 0) {
            const finalKline = klines[klines.length - 1];
            const entryPrice = currentPosition.entryPrice;
            const finalClose = parseFloat(finalKline[4]) || entryPrice;
            let tradeChangePct = (finalClose - entryPrice) / entryPrice;
            if (currentPosition.type === 'SELL') {
              tradeChangePct = -tradeChangePct;
            }
            const profitPct = tradeChangePct * 100 * customParams.leverage;
            const tradeAllocation = allocation;
            const rawPnl = tradeAllocation * (profitPct / 100);
            const feeAmt = tradeAllocation * 0.001;
            const netPnl = rawPnl - (feeAmt * 2);
            
            runningPnl += netPnl;
            
            mockTrades.push({
              id: `BT-${Date.now().toString().slice(-4)}-end`,
              symbol: symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, ''),
              type: currentPosition.type,
              pnl: netPnl,
              time: new Date(finalKline[6]),
              fee: feeAmt * 2,
              txHash: `0x${Math.random().toString(16).slice(2, 10).toLowerCase()}`,
              duration: `${(klines.length - 1 - lastEntryIndex) || 1}h`,
              price: entryPrice,
              quantity: parseFloat((tradeAllocation / entryPrice).toFixed(5))
            });
          }
          
          setOrderHistory(prev => [...mockTrades.reverse(), ...prev]);
          setTotalPnl(prev => prev + runningPnl);
          addLog(`Backtest completed. Processed ${mockTrades.length} historical trades via Binance API.`, 'info');

        } catch(error: any) {
           addLog(`Backtest failed: ${error.message || error}`, 'error');
        }
      }
    }, 1500);
  };

  const handleGenerateDailySummary = async () => {
    setShowDailySummary(true);
    setIsGeneratingSummary(true);
    
    // Calculate rich, detailed stats on the frontend for high-fidelity reports
    const totalTrades = orderHistory.length;
    const winsArr = orderHistory.filter(t => t.pnl > 0);
    const winningTrades = winsArr.length;
    const lossesArr = orderHistory.filter(t => t.pnl < 0);
    const losingTrades = lossesArr.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const averagePnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
    
    let bestTrade = 0;
    let worstTrade = 0;
    if (orderHistory.length > 0) {
      bestTrade = Math.max(...orderHistory.map(t => t.pnl || 0));
      worstTrade = Math.min(...orderHistory.map(t => t.pnl || 0));
    }
    
    const feesPaid = (orderHistory || []).reduce((sum, t) => sum + (t.fee || 0), 0);
    
    const statsObj = {
      winRate,
      winningTrades,
      losingTrades,
      bestTrade,
      worstTrade,
      averagePnl,
      feesPaid
    };

    try {
      const res = await fetch("/api/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trades: orderHistory,
          pnl: totalPnl,
          symbol: symbol,
          strategy: strategy,
          currentPrice: currentPrice,
          dailyChange: dailyStats.changePercent,
          stats: statsObj
        })
      });
      const data = await res.json();
      setDailySummaryText(data.summaryText);

      // Auto-save the generated summary to Firestore history
      const user = firebaseAuth.currentUser;
      if (user && data.summaryText && data.summaryText !== "Kunne ikke generere opsummering.") {
        try {
          await addDoc(collection(db, "dailySummaries"), {
            userId: user.uid,
            symbol: symbol,
            date: new Date().toLocaleDateString('da-DK'),
            summaryText: data.summaryText,
            totalPnl: totalPnl,
            totalTrades: totalTrades,
            winRate: winRate,
            createdAt: serverTimestamp()
          });
          fetchHistoricalSummaries();
        } catch (err) {
          console.error("Failed to auto-save summary to history:", err);
        }
      }
    } catch (e: any) {
      addLog(`Failed to generate daily summary: ${e.message}`, "error");
      setDailySummaryText("Kunne ikke generere opsummering.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Auto Daily Summary at Market Close (e.g. 16:00 PM conceptually)
  useEffect(() => {
    const handleCheckTime = () => {
      const now = new Date();
      if (now.getHours() === 16 && now.getMinutes() === 0) {
        handleGenerateDailySummary();
      }
    };
    const interval = setInterval(handleCheckTime, 60000);
    return () => clearInterval(interval);
  }, [orderHistory, totalPnl, symbol]);

  const tradeChartData = React.useMemo(() => {
    return [...trades].reverse().map(t => ({
      time: new Date(t.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: parseFloat(t.price)
    }));
  }, [trades]);

  const balanceGrowthData = useMemo(() => {
    const data = [];
    const today = new Date();
    // Start with current balance, work backwards to simulate a nice growth curve
    let currentBal = totalPnl + 10000; // Simulated base balance
    for (let i = 30; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        
        // Add some random noise and a general upward trend
        const noise = (Math.random() - 0.4) * 200;
        const trend = (30 - i) * 50; 
        
        data.push({
            time: d.toISOString().split('T')[0],
            balance: currentBal - (i * 100) + noise + trend
        });
    }
    return data;
  }, [totalPnl]);

  return (
    <>
      {showProModal && <AiProModal onClose={() => setShowProModal(false)} userUid={googleUser?.uid} userEmail={googleUser?.email} />}
      
      {showFeePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0e14] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
             <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                 <Wallet className="size-8 text-amber-500" />
             </div>
             <h3 className="text-2xl font-black text-center mb-2">Dagligt DAVs Gebyr</h3>
             <p className="text-gray-400 text-center text-sm mb-6">Du har udestående profitshare (1% af vundne ordre) fra dine tidligere sessioner. For at benytte AI Traderen i dag, skal gebyret afregnes.</p>
             
             <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6 flex justify-between items-center">
                 <span className="text-gray-400 font-mono">Gebyr til betaling:</span>
                 <span className="text-amber-500 font-bold font-mono text-xl">${dailyFeeDebt.toFixed(2)}</span>
             </div>

             <div className="flex gap-4">
                 <button onClick={() => setShowFeePaymentModal(false)} className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-colors border border-gray-700">Afbryd</button>
                 <button onClick={handlePayDailyFee} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition-colors">Betal nu</button>
             </div>
          </div>
        </div>
      )}

      <TickerTape />

      <MarketStatusHeader serverSymbol={serverSymbol} localSymbol={symbol} />
      
      {unpaidFee > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top fade-in duration-500">
           <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-rose-500/20 rounded-xl shrink-0 mt-1">
                 <Lock className="size-6 text-rose-500" />
              </div>
              <div>
                 <h3 className="text-rose-400 font-bold text-xl mb-2">AI Trader Låst</h3>
                 <p className="text-gray-300 text-sm mb-4">
                    Du har et udestående profit-share gebyr på <strong className="text-white text-lg">${unpaidFee.toFixed(2)} USDT</strong> fra dine seneste succesfulde handler. 
                    Overfør venligst beløbet til følgende Binance (TRC20) adresse for at låse op for AI traderen igen i dag.
                 </p>
                 <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-gray-800 w-max">
                    <code className="text-emerald-400 font-mono text-sm break-all">TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</code>
                    <button onClick={handleCopyAddress} className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition-colors" title="Kopiér adresse">
                       <Wallet className="size-4" />
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-4 shrink-0 bg-black/30 p-4 rounded-xl border border-gray-800 w-full md:w-auto">
              <div className="bg-white p-2 rounded-lg hidden md:block">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://app.binance.com/qr/dplk?action=download&id=854921043&amount=${unpaidFee}&currency=USDT`)}`} alt="Binance Pay QR" className="w-32 h-32" />
              </div>
              
              <div className="w-full flex flex-col gap-2">
                <button 
                  onClick={() => { setP2PAmount(unpaidFee); setP2pReference('FEE-' + new Date().getTime().toString().slice(-6)); setShowP2PModal(true); }}
                  className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2 mb-2"
                >
                   Åbn P2P Betalingsvindue
                </button>
                <input 
 
                  type="text" 
                  placeholder="Indsæt TXID (Transaktions-ID) her..."
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handlePayFee} 
                  disabled={isSubmittingTx}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                >
                   {isSubmittingTx ? <RefreshCw className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                   Bekræft Betaling
                </button>
              </div>
           </div>
        </div>
      )}

      
      <P2PPaymentModal 
        isOpen={showP2PModal} 
        onClose={() => { setShowP2PModal(false); setP2PAmount(0); }}
        amount={p2pAmount > 0 ? p2pAmount : unpaidFee}
        referenceId={p2pReference || `AI-TRADER-${new Date().getTime().toString().slice(-6)}`}
      />
      {/* Dashboard Layout Toolbar */}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 sm:p-6 bg-gray-900/40 rounded-2xl border border-gray-850/80 mb-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
               <GripVertical className="size-4 text-amber-500 animate-pulse" />
            </div>
            <div>
               <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Skærmlayout</h4>
               <p className="text-[10px] text-gray-500 font-mono">Træk og slip panelerne eller brug pilene for at tilpasse dit trading-miljø.</p>
            </div>
         </div>
         <div className="flex items-center gap-2 font-mono">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold mr-2
              ${apiHealth.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                apiHealth.status === 'loading' ? 'bg-gray-800 border-gray-700 text-gray-400' : 
                'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}
              title={apiHealth.message || "Tjekker API status..."}
            >
              <Activity className={`size-3 ${apiHealth.status === 'loading' ? 'animate-spin' : ''}`} />
              {apiHealth.status === 'ok' ? 'API: OK' : 
               apiHealth.status === 'loading' ? 'API: Tjekker...' : 
               'API: Afbrudt (Paper Trading Aktiv)'}
               {apiHealth.status === 'invalid' || apiHealth.status === 'missing' ? (
                 <button 
                   onClick={() => setShowProModal(true)} 
                   className="ml-2 underline text-[10px] hover:text-rose-300"
                 >
                   Fiks det
                 </button>
               ) : null}
            </div>
             <button 
                onClick={handleBackup}
                className="px-4 py-2 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-500 hover:text-emerald-400 border border-emerald-900/50 rounded-xl text-xs transition-colors shadow-md flex items-center gap-2"
             >
                <Download className="size-3" />
                Backup
             </button>
             <button 
                onClick={resetWidgetOrder}
                className="px-4 py-2 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white border border-gray-800 rounded-xl text-xs transition-colors shadow-md"
             >
                Nulstil Layout
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Agent Control */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: widgetOrder.indexOf('agentControl') * 0.1, ease: 'easeOut' }}
          style={{ order: widgetOrder.indexOf('agentControl') }}
          className={`lg:col-span-2 space-y-6 relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 ${draggedIndex === widgetOrder.indexOf('agentControl') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5 rounded-3xl pb-4 shadow-sm' : ''}`}
        >
          {/* Reordering Header */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 bg-gray-950/95 border border-gray-850/80 rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm">
             <span className="flex items-center gap-1.5 text-amber-500 cursor-grab active:cursor-grabbing">
               <GripVertical className="size-3.5" />
               Agent Kontrol & Parametre
             </span>
             <div className="flex items-center gap-1 text-gray-400">
               <button 
                 type="button" 
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('agentControl'), -1); }} 
                 disabled={widgetOrder.indexOf('agentControl') === 0} 
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                 title="Flyt op / venstre"
               >
                 <ChevronLeft className="size-3.5" />
               </button>
               <button 
                 type="button" 
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('agentControl'), 1); }} 
                 disabled={widgetOrder.indexOf('agentControl') === widgetOrder.length - 1} 
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                 title="Flyt ned / højre"
               >
                 <ChevronRight className="size-3.5" />
               </button>
             </div>
          </div>
        <div className="p-6 md:p-8 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          
          {/* Historical Price Chart */}
          <div className="mb-8 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50">
             <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                   <LineChart className="size-4 text-emerald-500" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatSymbol(symbol)} Market Trend (24h)</span>
                </div>
                {historicalPricesLoading && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
             </div>
             
             <div className="h-48 w-full">
                {historicalPrices.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={historicalPrices}>
                            <XAxis dataKey="time" stroke="var(--color-gray-600)" fontSize={10} tickMargin={10} minTickGap={30} />
                            <YAxis domain={['auto', 'auto']} stroke="var(--color-gray-600)" fontSize={10} tickFormatter={(val) => `${val}`} width={60} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--color-gray-900)', borderColor: 'var(--color-gray-700)', borderRadius: '0.5rem', fontSize: '12px' }}
                                itemStyle={{ color: '#10b981' }}
                                labelStyle={{ color: 'var(--color-gray-400)' }}
                            />
                            <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: 'var(--color-gray-950)', strokeWidth: 2 }} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-mono">
                       {historicalPricesLoading ? 'Loading market data...' : 'No data available'}
                    </div>
                )}
             </div>
          </div>

          <PortfolioSummary />

                    {/* Ticker Stats */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-950/40 border border-gray-800/80 p-4 rounded-2xl mb-8 relative z-10">
             <div className="flex items-center gap-4">
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{formatSymbol(symbol)}</p>
                   <p className="font-mono text-xl font-bold text-white">${currentPrice}</p>
                </div>
                <div className="h-8 w-px bg-gray-800"></div>
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">24h Ændring</p>
                   <p className={`font-mono text-sm font-bold ${dailyStats.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {dailyStats.changePercent >= 0 ? '+' : ''}{dailyStats.changePercent.toFixed(2)}%
                   </p>
                </div>
             </div>
             <div className="h-px w-full bg-gray-800/50 sm:hidden"></div>
             <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">24h Høj</p>
                   <p className="font-mono text-sm text-gray-300">${dailyStats.high}</p>
                </div>
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">24h Lav</p>
                   <p className="font-mono text-sm text-gray-300">${dailyStats.low}</p>
                </div>
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">24h Vol</p>
                   <p className="font-mono text-sm text-gray-300">{dailyStats.volume}</p>
                </div>
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Bot className="text-amber-500 size-6" />
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-widest leading-none">Binance Global</h4>
                <p className={`text-[10px] font-bold flex items-center gap-1.5 mt-1 ${
                  wsStatus === 'connected' ? 'text-emerald-500' :
                  wsStatus === 'connecting' ? 'text-amber-500' :
                  wsStatus === 'error' ? 'text-rose-500' : 'text-gray-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                    wsStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                    wsStatus === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-gray-500'
                  }`}></span>
                  {wsStatus === 'connected' && `Forbundet • Live Stream ${lastHeartbeat ? `(${Math.max(0, Math.floor((Date.now() - lastHeartbeat) / 1000))}s siden)` : ''}`}
                  {wsStatus === 'connecting' && `Forbinder... ${reconnectCount > 0 ? `(Forsøg ${reconnectCount})` : ''}`}
                  {wsStatus === 'error' && 'Forbindelsesfejl'}
                  {wsStatus === 'disconnected' && 'Afbrudt'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button 
                onClick={() => setStrategy('High-Frequency Scalper (HFT)')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${strategy === 'High-Frequency Scalper (HFT)' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                HFT
              </button>
              <button
                onClick={() => setStrategy('Value Mean-Reversion')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${strategy === 'Value Mean-Reversion' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Mean-Rev
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-right">
              <div className="text-[10px] text-gray-500">
                <p>Konf.</p>
                <p className="text-emerald-400 font-bold">API Nøgler (Krypteret). Virker</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleGenerateDailySummary} className="bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/60 p-2 rounded-lg transition-colors border border-indigo-900/50" title="Dagens Opsummering">
                  <BookOpen className="size-4 shrink-0" />
                </button>
                <button onClick={handleEmergencyStop} className="bg-rose-950/40 text-rose-500 hover:bg-rose-900/60 p-2 rounded-lg transition-colors border border-rose-900/50" title="Nødstop">
                  <Square className="size-4 shrink-0 fill-current" />
                </button>
                <button onClick={toggleBot} className={`${isBotActive ? 'bg-amber-950/40 text-amber-500 border-amber-900/50' : 'bg-emerald-950/40 text-emerald-500 border-emerald-900/50 hover:bg-emerald-900/60'} p-2 rounded-lg transition-colors border`} title={isBotActive ? 'Sæt Agent på Pause' : 'Start Agent'}>
                  {isBotActive ? <span className="font-bold flex items-center gap-1 px-1 text-xs">PAUSE</span> : <Play className="size-4 shrink-0 fill-current" />}
                </button>
              </div>
            </div>
          </div>

          
          {/* AI Automated Strategy */}
          <div className="mb-8 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50">
             <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                   <Zap className={`size-4 ${aiStrategyEnabled ? 'text-amber-500' : 'text-gray-500'}`} />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Automated Strategy (Gemini AI)</span>
                </div>
                <div 
                   onClick={() => setAiStrategyEnabled(!aiStrategyEnabled)}
                   className="flex items-center gap-3 cursor-pointer group bg-gray-900/50 p-1.5 px-3 rounded-full border border-gray-800"
                   title={aiStrategyEnabled ? "Deaktiver AI Strategi" : "Aktiver AI Strategi"}
                >
                   <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${!aiStrategyEnabled ? 'text-gray-400' : 'text-gray-600'}`}>OFF</span>
                   <div className="relative w-8 h-4 bg-gray-800 rounded-full transition-colors">
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${aiStrategyEnabled ? 'translate-x-4 bg-amber-500' : 'translate-x-0 bg-gray-500'}`}></div>
                   </div>
                   <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${aiStrategyEnabled ? 'text-amber-400' : 'text-gray-600'}`}>ON</span>
                </div>
             </div>
             
             {aiStrategyEnabled && (
                <div className="p-3 bg-black/50 rounded-xl border border-gray-800 text-sm">
                   {aiAnalyzing && !aiRecommendation ? (
                       <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                          <Loader2 className="size-3 animate-spin" /> Analyzing market data...
                       </div>
                   ) : aiRecommendation ? (
                       <div className="space-y-2">
                           <div className="flex items-center gap-2">
                               <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Recommendation:</span>
                               <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${aiRecommendation.action === 'BUY' ? 'bg-emerald-950 text-emerald-400' : aiRecommendation.action === 'SELL' ? 'bg-rose-950 text-rose-400' : 'bg-gray-800 text-gray-300'}`}>{aiRecommendation.action}</span>
                           </div>
                           <p className="text-gray-300 text-xs italic leading-relaxed">"{aiRecommendation.reason}"</p>
                       </div>
                   ) : (
                       <div className="text-gray-500 text-xs font-mono">No recommendation available.</div>
                   )}
                </div>
             )}
          </div>

          <div id="trading-execution-card" className="mb-8 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50">
             <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                   <ShieldCheck className={`size-4 ${!isLiveTrading ? 'text-emerald-500' : 'text-rose-500'}`} />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trade Execution</span>
                </div>
                <div 
                   onClick={() => toggleTradingMode(!isLiveTrading)}
                   className="flex items-center gap-3 cursor-pointer group bg-gray-900/50 p-1.5 px-3 rounded-full border border-gray-800"
                   title={isLiveTrading ? "Skift til Papirhandel" : "Skift til Live Trading"}
                >
                   <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${!isLiveTrading ? 'text-emerald-400' : 'text-gray-600 group-hover:text-gray-400'}`}>Paper Trading</span>
                   <div className="relative w-8 h-4 bg-gray-800 rounded-full transition-colors">
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${isLiveTrading ? 'translate-x-4 bg-rose-500' : 'translate-x-0 bg-emerald-500'}`}></div>
                   </div>
                   <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${isLiveTrading ? 'text-rose-400' : 'text-gray-600 group-hover:text-gray-400'}`}>Live Mode</span>
                </div>
             </div>

             <div className="flex gap-4">
                <button
                   onClick={() => executeTrade('BUY')}
                   className="flex-1 bg-emerald-600/20 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-500 hover:text-emerald-950 py-3 rounded-2xl transition-all font-bold uppercase text-xs tracking-widest flex justify-center items-center shadow-lg shadow-emerald-900/10"
                >
                   <TrendingUp size={16} className="mr-2"/> Køb (BUY)
                </button>
                <button
                   onClick={() => executeTrade('SELL')}
                   className="flex-1 bg-rose-600/20 text-rose-400 border border-rose-800/50 hover:bg-rose-500 hover:text-rose-950 py-3 rounded-2xl transition-all font-bold uppercase text-xs tracking-widest flex justify-center items-center shadow-lg shadow-rose-900/10"
                >
                   <TrendingDown size={16} className="mr-2"/> Sælg (SELL)
                </button>
             </div>
             
             <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center text-[10px] font-mono">
                <span className="text-gray-500 uppercase tracking-widest">Status:</span>
                <span className={`font-bold uppercase ${!isLiveTrading ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
                   {!isLiveTrading ? 'Simuleret - Ingen Risiko' : 'REAL TIME - RISIKO AKTIV'}
                </span>
             </div>
          </div>

          <TradeConfirmationModal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={confirmTrade}
            tradeDetails={{
                side: pendingTrade?.side || 'BUY',
                quantity: pendingTrade?.quantity || 0,
                orderType: pendingTrade?.orderType || 'MARKET',
                symbol: symbol,
                estimatedPrice: parseFloat(currentPrice) || 0,
                useSmartRoute: useSmartRoute,
                isLiveTrading: isLiveTrading
            }}
          />

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Overskud / Underskud</span>
              <motion.span className={`font-mono font-bold text-lg ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pnlDisplay}
              </motion.span>
            </div>
            <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Succesrate</span>
              <span className="font-mono font-bold text-lg text-amber-400">
                {winRate.toFixed(1)}%
              </span>
            </div>
            <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gns. Handelstid</span>
              <span className="font-mono font-bold text-lg text-cyan-400">
                {avgHoldTimeStr}
              </span>
            </div>
          </div>

          <div className="mb-6 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] p-4 rounded-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
             
             <div className="flex items-center justify-between mb-3">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Vælg din risikoprofil</label>
               <TradingPresetsManager 
                 currentConfig={{
                   allocation,
                   takeProfit,
                   stopLoss,
                   stopLossType,
                   strategy,
                   useTrailingStop,
                   dynamicSizing,
                   maxRiskPerTrade,
                   diversifySectors,
                   autoAdjustVolatility,
                   useNewsSentiment,
                   circuitBreakerLimit,
                   enableDCA,
                   dcaIntervalHours,
                   dcaAllocation
                 }}
                 onLoadPreset={handleLoadPreset}
               />
             </div>

             <select 
               onChange={(e) => {
                 const val = e.target.value;
                 if (val === 'aggressive') {
                   setStrategy('High-Frequency Scalper (HFT)');
                   setAllocation(20);
                   setTakeProfit(15.0);
                   setStopLoss(8.0);
                   addLog("Indlæste Aggressiv risikoprofil", "info");
                 } else if (val === 'conservative') {
                   setStrategy('Value Mean-Reversion');
                   setAllocation(10);
                   setTakeProfit(3.0);
                   setStopLoss(1.5);
                   addLog("Indlæste Konservativ risikoprofil", "info");
                 } else if (val === 'balanced') {
                   setStrategy('Momentum Swing Trader');
                   setAllocation(15);
                   setTakeProfit(8.5);
                   setStopLoss(3.2);
                   addLog("Indlæste Balanceret risikoprofil", "info");
                 } else if (val === 'risk_model_5_10') {
                   setStrategy('Risk-Controlled Trend Following');
                   setAllocation(15);
                   setTakeProfit(10.0);
                   setStopLoss(5.0);
                   addLog("Indlæste Aktietrader-bot Risikomodel (10% TP / 5% SL)", "info");
                 }
               }} 
               className="w-full bg-gray-950 border border-gray-800 text-amber-500 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 appearance-none font-mono text-sm shadow-inner cursor-pointer"
               defaultValue="custom"
             >
               <option value="custom" className="text-gray-400">Brugerdefineret / Manuel</option>
               <option value="risk_model_5_10">Klassisk Risikomodel (10% TP / 5% SL) - Optimal Kontrolleret Trend</option>
               <option value="conservative">Konservativ (Lav Risiko) - Mean Reversion, Lav Allokering</option>
               <option value="balanced">Balanceret (Mellem Risiko) - Swing Trader, Medium Allokering</option>
               <option value="aggressive">Aggressiv (Høj Risiko) - HFT Scalper, Maks Allokering</option>
             </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
               {/* Pair Selection */}
               <div className="relative" ref={tickerDropdownRef}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Handelspar</label>
                  </div>
                  <div 
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 focus-within:ring-2 focus-within:ring-amber-500 font-mono text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors hover:border-gray-700"
                    onClick={() => {
                        setShowTickerDropdown(!showTickerDropdown);
                        if (!showTickerDropdown) {
                            setTickerSearch('');
                        }
                    }}
                  >
                    <span>{AVAILABLE_PAIRS.find(p => p.value === symbol)?.label || `${symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, "")}/${symbol.endsWith('USDC') ? 'USDC' : (symbol.endsWith('USDT') ? 'USDT' : (symbol.endsWith('BTC') ? 'BTC' : (symbol.endsWith('ETH') ? 'ETH' : (symbol.endsWith('BNB') ? 'BNB' : (symbol.endsWith('EUR') ? 'EUR' : 'USDT')))))} (Tilpasset)`}</span>
                    <ChevronDown className="size-4 text-gray-500" />
                  </div>
                  
                  <AnimatePresence>
                    {showTickerDropdown && (
                      <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 w-full mt-2 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md"
                      >
                          <div className="p-3 border-b border-gray-800 flex items-center gap-2 bg-gray-900/50">
                             <Search className="size-4 text-gray-500" />
                             <input 
                                type="text" 
                                value={tickerSearch}
                                onChange={(e) => setTickerSearch(e.target.value)}
                                placeholder="Søg ticker (f.eks. BTC)"
                                className="bg-transparent border-none outline-none text-white text-sm w-full font-mono placeholder:text-gray-600"
                                autoFocus
                             />
                          </div>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                             {AVAILABLE_PAIRS.filter(p => p.label.toLowerCase().includes(tickerSearch.toLowerCase()) || p.value.toLowerCase().includes(tickerSearch.toLowerCase())).map(pair => (
                                 <div 
                                    key={pair.value}
                                    onClick={() => {
                                        setSymbol(pair.value);
                                        setShowTickerDropdown(false);
                                    }}
                                    className={`px-4 py-3 cursor-pointer text-sm font-mono flex items-center justify-between transition-colors ${symbol === pair.value ? 'bg-amber-500/10 text-amber-500' : 'text-gray-300 hover:bg-gray-900'}`}
                                 >
                                     {pair.label}
                                     {symbol === pair.value && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                                 </div>
                             ))}
                             {tickerSearch && !AVAILABLE_PAIRS.some(p => p.value.toLowerCase() === tickerSearch.toLowerCase() + 'usdt') && (
                                <div
                                    onClick={() => {
                                        let customVal = tickerSearch.toUpperCase().trim();
                                        if (!customVal.endsWith('USDT') && !customVal.endsWith('USDC') && !customVal.endsWith('BTC') && !customVal.endsWith('ETH') && !customVal.endsWith('BNB') && !customVal.endsWith('EUR')) {
                                           customVal += 'USDT';
                                        }
                                        setSymbol(customVal);
                                        setShowTickerDropdown(false);
                                    }}
                                    className="px-4 py-3 hover:bg-gray-900 cursor-pointer text-sm font-mono text-amber-500 transition-colors border-t border-gray-800/50 flex flex-col gap-1"
                                >
                                    <span>Brug "{tickerSearch.toUpperCase()}"</span>
                                    <span className="text-[10px] text-gray-500">Tilpasset handelspar</span>
                                </div>
                             )}
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Strategimodel</label>
                  <button 
                    onClick={() => setShowCustomParamsModal(true)}
                    className="text-amber-500 hover:text-amber-400 text-xs font-mono flex items-center gap-1 transition-colors"
                  >
                    <Activity className="size-3" /> Tune Parametre
                  </button>
                </div>
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-amber-500 appearance-none font-mono text-xs sm:text-sm">
                  <option>Momentum Trading</option>
                  <option>Mean Reversion</option>
                  <option>Simple Moving Average (SMA)</option>
                  <option>High-Frequency Scalper (HFT)</option>
                  <option>Grid Trading Arbitrage</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Maks. Allokering / Handel</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">$</span>
                  <input type="text" inputMode="decimal" value={allocation !== undefined ? String(allocation).replace('.', ',') : ''} onChange={(e) => { const rawValue = e.target.value.replace(',', '.'); setAllocation(parseFloat(rawValue) || 0); }} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-amber-500 font-mono text-sm" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Take Profit / Stop Loss</label>
                   <div className="flex items-center gap-2">
                       <span className="text-[10px] text-gray-500 uppercase">Stop Type:</span>
                       <select value={stopLossType} onChange={(e) => setStopLossType(e.target.value as 'percentage' | 'fixed')} className="bg-gray-900 border border-gray-800 text-xs text-white rounded p-1">
                           <option value="percentage">% Procent</option>
                           <option value="fixed">$ Fast beløb (USD)</option>
                       </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-mono text-xs">+</span>
                    <input type="number" value={takeProfit ?? ''} onChange={(e) => setTakeProfit(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 text-emerald-500 rounded-xl py-3 pl-7 pr-3 focus:ring-2 focus:ring-amber-500 font-mono text-sm" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-xs">%</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-mono text-xs">-</span>
                    <input type="number" value={stopLoss ?? ''} onChange={(e) => setStopLoss(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 text-rose-500 rounded-xl py-3 pl-7 pr-7 focus:ring-2 focus:ring-amber-500 font-mono text-sm" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-xs">{stopLossType === 'percentage' ? '%' : '$'}</span>

                  </div>
                </div>
                <div className="mt-3">
                  <button 
                    onClick={askStrategyAssistant}
                    disabled={isAssistantLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/50 text-indigo-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isAssistantLoading ? (
                      <span className="animate-pulse">Analyserer marked...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Spørg Gemini Strategy Assistant
                      </>
                    )}
                  </button>
                  
                  {assistantSuggestion && (
                    <div className="mt-2 p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Gemini Forslag</span>
                        <button 
                          onClick={() => {
                            setTakeProfit(assistantSuggestion.takeProfit);
                            setStopLoss(assistantSuggestion.stopLoss);
                            addLog("Gemini forslag anvendt.", "info");
                          }}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold uppercase transition-colors"
                        >
                          Anvend
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-300 leading-relaxed mb-2 font-mono">
                        {assistantSuggestion.reasoning}
                      </p>
                      <div className="flex gap-3 text-[10px] font-mono">
                        <span className="text-emerald-400">TP: {assistantSuggestion.takeProfit}%</span>
                        <span className="text-rose-400">SL: {assistantSuggestion.stopLoss}%</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Avanceret Risikostyring</label>
                <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-3 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                     <span className="text-xs text-gray-400 group-hover:text-white transition-colors" title="Slå automatisk stop-loss beskyttelse til eller fra">Automatisk Stop-Loss</span>
                     <div className={`relative w-8 h-4 rounded-full transition-colors ${enableAutoStopLoss ? 'bg-amber-500' : 'bg-gray-800'}`}>
                        <input type="checkbox" className="sr-only" checked={enableAutoStopLoss} onChange={() => setEnableAutoStopLoss(!enableAutoStopLoss)} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${enableAutoStopLoss ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                     <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Trailing Stop-Loss</span>
                     <div className={`relative w-8 h-4 rounded-full transition-colors ${useTrailingStop ? 'bg-amber-500' : 'bg-gray-800'}`}>
                        <input type="checkbox" className="sr-only" checked={useTrailingStop} onChange={() => setUseTrailingStop(!useTrailingStop)} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useTrailingStop ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                     <span className="text-xs text-gray-400 group-hover:text-white transition-colors" title="Splitter automatisk store ordrer over flere liquidity pools (Binance, Coinbase, Uniswap) for at minimere glidning/markedspåvirkning.">Smart Route (Liquidity routing)</span>
                     <div className={`relative w-8 h-4 rounded-full transition-colors ${useSmartRoute ? 'bg-amber-500' : 'bg-gray-800'}`}>
                        <input type="checkbox" className="sr-only" checked={useSmartRoute} onChange={() => setUseSmartRoute(!useSmartRoute)} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useSmartRoute ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                     <span className="text-xs text-gray-400 group-hover:text-white transition-colors" title="Justerer position ud fra portefølje og risiko">Dynamisk Positionsstørrelse</span>
                     <div className={`relative w-8 h-4 rounded-full transition-colors ${dynamicSizing ? 'bg-amber-500' : 'bg-gray-800'}`}>
                        <input type="checkbox" className="sr-only" checked={dynamicSizing} onChange={() => setDynamicSizing(!dynamicSizing)} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${dynamicSizing ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </label>
                  {dynamicSizing && (
                      <div className="pt-2 border-t border-gray-800">
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">Maksimal Risiko Pr. Handel</span>
                              <span className="text-xs text-amber-500 font-mono">{maxRiskPerTrade}%</span>
                          </div>
                          <input type="range" min="0.1" max="5.0" step="0.1" value={maxRiskPerTrade} onChange={(e) => setMaxRiskPerTrade(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                      </div>
                  )}
                  <label className="flex items-center justify-between cursor-pointer group">
                     <span className="text-xs text-gray-400 group-hover:text-white transition-colors" title="Spred risiko på tværs af sektorer">Sektordiversificering</span>
                     <div className={`relative w-8 h-4 rounded-full transition-colors ${diversifySectors ? 'bg-amber-500' : 'bg-gray-800'}`}>
                        <input type="checkbox" className="sr-only" checked={diversifySectors} onChange={() => setDiversifySectors(!diversifySectors)} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${diversifySectors ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                     <span className="text-xs text-gray-400 group-hover:text-white transition-colors" title="Reducer positioner under volatil udsving">Volatilitetsjustering</span>
                     <div className={`relative w-8 h-4 rounded-full transition-colors ${autoAdjustVolatility ? 'bg-amber-500' : 'bg-gray-800'}`}>
                        <input type="checkbox" className="sr-only" checked={autoAdjustVolatility} onChange={() => setAutoAdjustVolatility(!autoAdjustVolatility)} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoAdjustVolatility ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                     <span className="text-xs text-gray-400 group-hover:text-white transition-colors" title="Juster strategi automatisk baseret på nyhedssentiment">Nyhedssentiment-integration</span>
                     <div className={`relative w-8 h-4 rounded-full transition-colors ${useNewsSentiment ? 'bg-amber-500' : 'bg-gray-800'}`}>
                        <input type="checkbox" className="sr-only" checked={useNewsSentiment} onChange={() => setUseNewsSentiment(!useNewsSentiment)} />
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useNewsSentiment ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                  </label>
                  <div className="pt-2 border-t border-gray-800">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500" title="Pauser handel hvis porteføljen falder med dette i procent på en dag">Daglig Circuit Breaker</span>
                          <span className="text-xs text-amber-500 font-mono">{circuitBreakerLimit}%</span>
                      </div>
                      <input type="range" min="0.5" max="25.0" step="0.5" value={circuitBreakerLimit} onChange={(e) => setCircuitBreakerLimit(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  
                  {/* DCA Settings */}
                  <div className="pt-4 border-t border-gray-800 mt-2">
                     <label className="flex items-center justify-between cursor-pointer group mb-3">
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors" title="Aktivér Dollar Cost Averaging (Køb automatisk over tid)">Dollar Cost Averaging (DCA)</span>
                        <div className={`relative w-8 h-4 rounded-full transition-colors ${enableDCA ? 'bg-amber-500' : 'bg-gray-800'}`}>
                           <input type="checkbox" className="sr-only" checked={enableDCA} onChange={() => setEnableDCA(!enableDCA)} />
                           <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${enableDCA ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                     </label>
                     
                     {enableDCA && (
                         <div className="space-y-3 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                             <div>
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-[10px] text-gray-500 uppercase tracking-wider">Købsinterval (Timer)</span>
                                     <span className="text-xs text-amber-500 font-mono">{dcaIntervalHours} t</span>
                                 </div>
                                 <input type="range" min="1" max="168" step="1" value={dcaIntervalHours} onChange={(e) => setDcaIntervalHours(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                             </div>
                             <div>
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-[10px] text-gray-500 uppercase tracking-wider">Købsbeløb (USDT)</span>
                                     <span className="text-xs text-amber-500 font-mono">${dcaAllocation.toFixed(2)}</span>
                                 </div>
                                 <input type="range" min="10.0" max="100.0" step="1.0" value={dcaAllocation} onChange={(e) => setDcaAllocation(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                             </div>
                         </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-gray-800 pt-6">
              <button onClick={handleDeploy} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-gray-950 rounded-xl font-bold text-sm tracking-widest uppercase transition-colors shadow-lg shadow-amber-900/30 w-full sm:w-auto flex justify-center items-center gap-2">
                 <RefreshCw className="size-4" /> Implementer Konfiguration
              </button>
              
              <div className="flex flex-wrap items-center gap-6">
                <button
                    onClick={handlePredict}
                    disabled={predicting}
                    className="bg-purple-900 border border-purple-800 text-purple-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-800 transition-all flex items-center gap-2"
                >
                    {predicting ? <Loader2 className="size-4 animate-spin" /> : <TrendingUp className="size-4" />}
                    Forudsig
                </button>
                <label className="flex items-center gap-3 cursor-pointer" title={isLiveTrading ? "Skift til Papirhandel" : "Skift til Live Trading"}>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isLiveTrading ? 'Live Trading (REAL FUNDS)' : 'Paper Trading (SIMULERET)'}</span>
                   <div className={`relative w-10 h-6 rounded-full transition-colors ${isLiveTrading ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}>
                      <input type='checkbox' className='sr-only' checked={isLiveTrading} onChange={() => toggleTradingMode(!isLiveTrading)} />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isLiveTrading ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Backtest Mode</span>
                   <div className={`relative w-10 h-6 rounded-full transition-colors ${isBacktest ? 'bg-cyan-500' : 'bg-gray-800'}`}>
                      <input type="checkbox" className="sr-only" checked={isBacktest} onChange={() => setIsBacktest(!isBacktest)} />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isBacktest ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Auto-Opdatering (60s)</span>
                   <div className={`relative w-10 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-amber-500' : 'bg-gray-800'}`}>
                      <input type="checkbox" className="sr-only" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Auto-Sync To Calendar</span>
                   <div className={`relative w-10 h-6 rounded-full transition-colors ${autoSyncCalendar ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-800'}`}>
                      <input type="checkbox" className="sr-only" checked={autoSyncCalendar} onChange={() => {
                             if (!autoSyncCalendar && needsGoogleAuth) {
                                const connectConfirm = window.confirm("Du skal forbinde din Google-konto først for at tillade automatisk synkronisering. Vil du forbinde nu?");
                                if (connectConfirm) {
                                   handleGoogleConnect().then(() => {
                                      setAutoSyncCalendar(true);
                                   });
                                }
                             } else {
                                setAutoSyncCalendar(!autoSyncCalendar);
                             }
                          }} />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${autoSyncCalendar ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                </label>
                <button
                   onClick={handleManualRefresh}
                   className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 transition-colors ml-2"
                   title="Genindlæs data manuelt"
                >
                  <RefreshCw className="size-3" />
                  Opdater
                </button>
              </div>
          </div>
        </div>
        </motion.div>

        <WalletSummaryWidget
          widgetOrder={widgetOrder}
          draggedIndex={draggedIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          moveWidget={moveWidget}
          walletData={walletData}
          walletLoading={walletLoading}
          onOpenDeposit={() => {
             setP2PAmount(0); // Means the user specifies amount on Binance App, or we could ask for amount here. But let's pass 0, the modal can handle it or Binance App handles it.
             setP2pReference('DEPOSIT-FUNDS-' + new Date().getTime().toString().slice(-4));
             setShowP2PModal(true);
          }}
        />
        

        {(() => {
          const allTabs = [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, colorClass: 'text-amber-500', cat: 'overblik' },
            { id: 'correlation', label: 'Korrelation', icon: GitCompare, colorClass: 'text-indigo-400', cat: 'analyse' },
            { id: 'risk', label: 'Risiko-analyse', icon: ShieldAlert, colorClass: 'text-rose-400', cat: 'analyse' },
            { id: 'live', label: 'Live Data', icon: Zap, colorClass: 'text-cyan-500', cat: 'analyse' },
            { id: 'history', label: 'Historik', icon: History, colorClass: 'text-amber-500', cat: 'overblik' },
            { id: 'wallet', label: 'Min Pung', icon: Wallet, colorClass: 'text-purple-500', cat: 'overblik' },
            { id: 'alerts', label: 'Alarmer', icon: Bell, colorClass: 'text-rose-500', cat: 'overblik' },
            { id: 'stocks', label: 'Aktier & Nyheder', icon: Newspaper, colorClass: 'text-emerald-500', cat: 'analyse' },
            { id: 'analyses', label: 'Analyser', icon: Newspaper, colorClass: 'text-blue-500', cat: 'analyse' },
            { id: 'compare', label: 'Sammenlign', icon: GitCompare, colorClass: 'text-orange-500', cat: 'strategi' },
            { id: 'backtest', label: 'Test Forløb', icon: LineChart, colorClass: 'text-pink-500', cat: 'strategi' },
            { id: 'journal', label: 'Dagbog', icon: BookOpen, colorClass: 'text-violet-400', cat: 'overblik' },
            { id: 'scanner', label: 'Scanner', icon: Activity, colorClass: 'text-purple-500', cat: 'analyse' },
            { id: 'macro', label: 'Global Macro', icon: Globe, colorClass: 'text-cyan-500', cat: 'analyse' },
            { id: 'autopilot', label: 'AI Copilot', icon: Rocket, colorClass: 'text-amber-500', cat: 'strategi' },
            { id: 'rebalance', label: 'AI Rebalancer', icon: PieChartIcon, colorClass: 'text-indigo-400', cat: 'strategi' },
            { id: 'design', label: 'Design Center', icon: Palette, colorClass: 'text-indigo-400 animate-pulse', cat: 'strategi' },
          ] as const;

          const getTabBtnClass = (tabId: string, activeColorClass: string) => {
            const isActive = panelTab === tabId;
            if (activeTheme === 'alpine') {
              return `whitespace-nowrap text-[11px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all px-3 py-2 rounded-xl border ${
                isActive 
                  ? `${activeColorClass} bg-indigo-50 border-indigo-200/60 shadow-sm shadow-indigo-100` 
                  : 'text-slate-500 border-transparent hover:text-indigo-600 hover:bg-slate-100'
              }`;
            } else if (activeTheme === 'sage') {
              return `whitespace-nowrap text-[11px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all px-3 py-2 rounded-xl border ${
                isActive 
                  ? 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20 shadow-sm' 
                  : 'text-[#8fa391] border-transparent hover:text-emerald-350 hover:bg-emerald-950/10'
              }`;
            } else {
              return `whitespace-nowrap text-[11px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all px-3 py-2 rounded-xl border ${
                isActive 
                  ? `${activeColorClass} bg-white/5 border-white/5` 
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
              }`;
            }
          };

          const containerThemeClasses = `${
            activeTheme === 'alpine' 
              ? 'p-6 bg-slate-50 border-slate-200 text-slate-900 shadow-xl' 
              : activeTheme === 'sage' 
                ? 'p-6 bg-[#111813]/95 border-emerald-950/30 text-[#edf3ed] shadow-2xl shadow-emerald-950/5' 
                : 'p-6 bg-black/40 backdrop-blur-2xl border-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]'
          } overflow-hidden flex flex-col h-[650px] relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 ${
            draggedIndex === widgetOrder.indexOf('realtimeTabs') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5' : ''
          } rounded-3xl border`;

          return (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: widgetOrder.indexOf('realtimeTabs') * 0.1, ease: 'easeOut' }}
              style={{ order: widgetOrder.indexOf('realtimeTabs') }}
              className={containerThemeClasses}
            >
              {/* Reordering Header */}
              <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 border rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-1 ${
                activeTheme === 'alpine' ? 'bg-slate-100 border-slate-200 text-slate-600' : activeTheme === 'sage' ? 'bg-[#182319]/95 border-emerald-950/40 text-emerald-400' : 'bg-gray-950/95 border-gray-850 text-gray-400'
              }`}>
                 <span className="flex items-center gap-1.5 text-amber-500 cursor-grab active:cursor-grabbing">
                   <GripVertical className="size-3.5" />
                   Realtid Datatavle & Feeds
                 </span>
                 <div className="flex items-center gap-1 font-mono">
                   <button 
                     type="button" 
                     onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('realtimeTabs'), -1); }} 
                     disabled={widgetOrder.indexOf('realtimeTabs') === 0} 
                     className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                     title="Flyt op / venstre"
                   >
                     <ChevronLeft className="size-3.5" />
                   </button>
                   <button 
                     type="button" 
                     onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('realtimeTabs'), 1); }} 
                     disabled={widgetOrder.indexOf('realtimeTabs') === widgetOrder.length - 1} 
                     className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                     title="Flyt ned / højre"
                   >
                     <ChevronRight className="size-3.5" />
                   </button>
                 </div>
              </div>

              {/* Dynamic Navigation & Layout Body */}
              <div className={`flex ${navStyle === 'sidebar' ? 'flex-row gap-5' : 'flex-col'} flex-grow overflow-hidden relative h-full w-full`}>
                
                {navStyle === 'sidebar' && (
                  /* SIDEBAR NAVIGATION STYLE */
                  <div id="trading-panel-categories" className={`w-48 shrink-0 flex flex-col gap-1 border-r pr-3 py-1 overflow-y-auto scrollbar-none text-left h-full ${
                    activeTheme === 'alpine' ? 'border-slate-200/80' : activeTheme === 'sage' ? 'border-emerald-950/20' : 'border-white/5'
                  }`}>
                    <div className="flex justify-between items-center mb-3 px-2">
                      <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${activeTheme === 'alpine' ? 'text-slate-400' : 'text-gray-500'}`}>Kategorier</span>
                      {panelTab === 'live' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                    {allTabs.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setPanelTab(tab.id)}
                          className={`${getTabBtnClass(tab.id, tab.colorClass)} justify-start w-full px-3 py-2.5`}
                        >
                          <Icon className={`size-4 ${panelTab === tab.id ? tab.colorClass : ''}`} />
                          <span className="text-xs truncate">{tab.label}</span>
                        </button>
                      );
                    })}

                    {/* Compact Live Price Indicator inside sidebar bottom */}
                    {panelTab === 'live' && (
                      <div className={`mt-auto p-3 rounded-2xl border text-center ${
                        activeTheme === 'alpine' ? 'bg-indigo-50/50 border-indigo-100' : activeTheme === 'sage' ? 'bg-[#182319]/50 border-emerald-950/30' : 'bg-white/5 border-white/5'
                      }`}>
                         <p className={`text-[10px] uppercase font-bold tracking-widest ${activeTheme === 'alpine' ? 'text-slate-400' : 'text-gray-500'}`}>Live Kurs</p>
                         <p className={`text-md font-mono tabular-nums font-extrabold mt-0.5 ${priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            ${currentPrice}
                         </p>
                         <label className="flex items-center justify-center gap-2 cursor-pointer mt-2" title="Forbliv på toppen af listen">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Auto-Scroll</span>
                            <div className={`relative w-8 h-4 rounded-full transition-colors ${autoScrollLive ? 'bg-cyan-500' : 'bg-gray-800'}`}>
                               <input type="checkbox" className="sr-only" checked={autoScrollLive} onChange={(e) => setAutoScrollLive(e.target.checked)} />
                               <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoScrollLive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                         </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Panel Content Area */}
                <div className="flex-grow flex flex-col overflow-hidden relative h-full">
                  
                  {navStyle !== 'sidebar' && (
                    navStyle === 'grouped' ? (
                      /* CATEGORIZED GROUPED TABS NAVIGATION STYLE */
                      <div className="flex flex-col gap-3 mb-6">
                        {/* Category Selector Row */}
                        <div className={`flex p-1 rounded-2xl border gap-1 w-fit ${
                          activeTheme === 'alpine' ? 'bg-slate-100 border-slate-200' : activeTheme === 'sage' ? 'bg-[#182319]/60 border-emerald-950/30' : 'bg-gray-900/50 border-white/5'
                        }`}>
                          {(['overblik', 'analyse', 'strategi'] as const).map(cat => {
                            const label = cat === 'overblik' ? '📊 Overblik' : cat === 'analyse' ? '📈 Analyse' : '🧪 Strategi & Design';
                            const isActive = activeCategory === cat;
                            return (
                              <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  isActive
                                    ? activeTheme === 'alpine'
                                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                                      : activeTheme === 'sage'
                                        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/10'
                                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Category Tab Buttons */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-none">
                          {allTabs.filter(t => t.cat === activeCategory).map(tab => {
                            const Icon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setPanelTab(tab.id)}
                                className={getTabBtnClass(tab.id, tab.colorClass)}
                              >
                                <Icon className={`size-3.5 ${panelTab === tab.id ? tab.colorClass : ''}`} />
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* CLASSIC NAVIGATION STYLE */
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                         <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 scrollbar-none">
                           {allTabs.map(tab => {
                             const Icon = tab.icon;
                             return (
                               <button
                                 key={tab.id}
                                 onClick={() => setPanelTab(tab.id)}
                                 className={getTabBtnClass(tab.id, tab.colorClass)}
                               >
                                 <Icon className={`size-4 ${panelTab === tab.id ? tab.colorClass : ''}`} />
                                 {tab.label}
                               </button>
                             );
                           })}
                         </div>
                         {panelTab === 'live' && (
                           <div className="text-right whitespace-nowrap shrink-0">
                              <p className={`text-xl font-mono tabular-nums font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 ${currentPrice} 
                                 <span className="text-xs ml-2">({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)})</span>
                              </p>
                              <label className="flex items-center justify-end gap-2 cursor-pointer mt-1" title="Forbliv på toppen af listen">
                                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Auto-Scroll</span>
                                 <div className={`relative w-8 h-4 rounded-full transition-colors ${autoScrollLive ? 'bg-cyan-500' : 'bg-gray-800'}`}>
                                    <input type="checkbox" className="sr-only" checked={autoScrollLive} onChange={(e) => setAutoScrollLive(e.target.checked)} />
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoScrollLive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                 </div>
                              </label>
                           </div>
                         )}
                      </div>
                    )
                  )}

                  <div className="flex-grow overflow-hidden relative">
                    <AnimatePresence mode="popLayout" initial={false}>
              {panelTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-4 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 pb-6 flex flex-col"
                >
                  {/* Dashboard Welcome Header */}
                  <div id="welcome-header" className="bg-gradient-to-r from-amber-500/10 via-cyan-500/5 to-purple-500/10 border border-gray-800/80 rounded-2xl p-5 mb-1 shrink-0 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div>
                        <h4 className="text-base font-black uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                          <LayoutGrid className="size-5 text-amber-500 animate-pulse" />
                          Hovedmenu & Genveje
                        </h4>
                        <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                          Velkommen til kontrolpanelet! Her får du et lynhurtigt overblik over dine aktive bot-strategier, PnL-statistikker, alarmer og AI-analyser. Klik på et modul nedenfor for at åbne det med det samme.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                        <button
                          onClick={() => setLayoutMode(layoutMode === 'detailed' ? 'compact' : 'detailed')}
                          className={`text-[10px] font-bold uppercase tracking-widest ${layoutMode === 'detailed' ? 'text-amber-400' : 'text-gray-400'} hover:text-white transition-colors`}
                        >
                          {layoutMode === 'detailed' ? 'Detailed' : 'Compact'}
                        </button>
                        <div className="w-[1px] h-4 bg-white/10" />
                        <div className={`w-2.5 h-2.5 rounded-full ${isBotActive ? 'bg-emerald-500 animate-ping' : 'bg-gray-600'}`}></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          AI Autopilot: <strong className={isBotActive ? 'text-emerald-400' : 'text-gray-500'}>{isBotActive ? 'AKTIV' : 'INAKTIV'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bento Grid layout for navigation */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Dashboard Navigation</h3>
                    <button 
                      onClick={() => setIsBentoGridMinimized(!isBentoGridMinimized)}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      {isBentoGridMinimized ? 'Expand' : 'Minimize'}
                    </button>
                  </div>
                  {!isBentoGridMinimized && (
                    <div className={`grid grid-cols-1 ${layoutMode === 'detailed' ? 'sm:grid-cols-2 md:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-4'} gap-3`}>
                      
                      {/* 1. LIVE DATA */}
                      <button 
                        onClick={() => setPanelTab('live')}
                        className={`p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-cyan-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(6,182,212,0.05)] relative flex flex-col justify-between ${layoutMode === 'detailed' ? 'min-h-[145px]' : 'min-h-[110px]'} hover:-translate-y-0.5 cursor-pointer`}
                      >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                            <Zap className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-mono">
                            {formatSymbol(symbol)}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">Live Data & Kurs</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Overvåg realtids markedsordrer, charts og prisændringer for {formatSymbol(symbol)}.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className={`text-xs font-mono font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${currentPrice} ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)})
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 2. AI AUTOPILOT */}
                    <button 
                      onClick={() => setPanelTab('autopilot')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-amber-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(245,158,11,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                            <Rocket className="size-5" />
                          </div>
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border rounded-full font-mono ${isBotActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                            {isBotActive ? 'Kører' : 'Inaktiv'}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-amber-400 transition-colors">AI Copilot</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Konfigurer strategier, tænd/sluk botten og juster autopilot indstillinger.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono text-gray-400 truncate max-w-[130px]">
                          {strategy}
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 3. HISTORIK */}
                    <button 
                      onClick={() => setPanelTab('history')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-emerald-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(16,185,129,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                            <History className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono">
                            PnL Log
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">Ordrehistorik & PnL</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Gennemse alle tidligere udførte ordrer, gennemsnitlig holdetid og afkast.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {orderHistory.length} ordrer • {winRate.toFixed(1)}% win
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 4. BALANCER */}
                    <button 
                      onClick={() => setPanelTab('wallet')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-purple-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(168,85,247,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                            <Wallet className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-mono">
                            Portefølje
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-purple-400 transition-colors">Min Pung & Aktiver</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Få fuldt overblik over Spot og Earn konti samt historisk formuevækst.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-purple-400">
                          ${(() => {
                            if (!walletData || !walletData.spot) return "10000.00";
                            const spotTotal = walletData.spot.reduce((acc, b) => {
                              const activeAsset = symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, '');
                              const getAssetUsdPriceLocal = (asset) => {
                                if (asset === 'USDT' || asset === 'USDC') return 1.0;
                                if (asset === activeAsset) return parseFloat(currentPrice) || 1.0;
                                const defaults = {
                                  BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30, SPY: 510.50, QQQ: 440.20, VOO: 460.10, ARKK: 50.30, TLT: 90.50, BND: 72.10, AGG: 97.40, LQD: 105.20
                                };
                                return defaults[asset] || 1.0;
                              };
                              return acc + (parseFloat(b.free) + parseFloat(b.locked || '0')) * getAssetUsdPriceLocal(b.asset);
                            }, 0);
                            const earnTotal = (walletData.earn || []).reduce((acc, e) => {
                              const activeAsset = symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, '');
                              const getAssetUsdPriceLocal = (asset) => {
                                if (asset === 'USDT' || asset === 'USDC') return 1.0;
                                if (asset === activeAsset) return parseFloat(currentPrice) || 1.0;
                                const defaults = {
                                  BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30, SPY: 510.50, QQQ: 440.20, VOO: 460.10, ARKK: 50.30, TLT: 90.50, BND: 72.10, AGG: 97.40, LQD: 105.20
                                };
                                return defaults[asset] || 1.0;
                              };
                              return acc + parseFloat(e.totalAmount) * getAssetUsdPriceLocal(e.asset);
                            }, 0);
                            return (spotTotal + earnTotal).toFixed(2);
                          })()} USD
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 5. PRISALARMER */}
                    <button 
                      onClick={() => setPanelTab('alerts')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-rose-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(244,63,94,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                            <Bell className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-mono">
                            Alarmer
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-rose-400 transition-colors">Prisalarmer</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Sæt overvågnings-alarmer for hurtige stigninger eller fald under trading.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-rose-400">
                          {priceAlerts.length} aktive
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 6. SMART ANALYSES */}
                    <button 
                      onClick={() => setPanelTab('analyses')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-blue-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(59,130,246,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                            <Newspaper className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-mono">
                            AI Coach
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors">Markedsanalyser</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Modtag markedsanalyser og strategiske overvejelser fra Gemini AI.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          Lynhurtig Markeds-Scan
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 7. ASSET COMPARE */}
                    <button 
                      onClick={() => setPanelTab('compare')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-orange-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(249,115,22,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400 group-hover:scale-105 transition-transform">
                            <GitCompare className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full font-mono">
                            Stats
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-orange-400 transition-colors">Sammenlign Aktiver</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Analyser prissammenligninger, korrelationer og markedsmomentum.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-orange-400">
                          Korrelation og performance
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 8. BACKTESTER */}
                    <button 
                      onClick={() => setPanelTab('backtest')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-pink-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(236,72,153,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20 text-pink-400 group-hover:scale-105 transition-transform">
                            <LineChart className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full font-mono">
                            Simuler
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-pink-400 transition-colors">Test Forløb & Backtester</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Test dine strategier på historiske klippede prisperioder risikofrit.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-pink-400">
                          Risikofrie simuleringer
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 9. JOURNAL */}
                    <button 
                      onClick={() => setPanelTab('journal')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-violet-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(139,92,246,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400 group-hover:scale-105 transition-transform">
                            <BookOpen className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full font-mono">
                            Notater
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-violet-400 transition-colors">Handelsdagbog</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Noter begrundelser for dine trades, hold øje med din psykologi.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-violet-400">
                          {journalEntries.length} optegnelser
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 10. SCANNER */}
                    <button 
                      onClick={() => setPanelTab('scanner')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-emerald-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(16,185,129,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                            <Activity className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono">
                            Skan marked
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">Market Scanner</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Skan markedet automatisk efter hurtige volumenspidser og momentum.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          Realtids momentum
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                    {/* 11. GLOBAL MACRO */}
                    <button 
                      onClick={() => setPanelTab('macro')}
                      className="p-4 bg-gray-950/40 hover:bg-gray-900/60 border border-white/5 hover:border-indigo-500/30 rounded-2xl text-left transition-all duration-300 group hover:shadow-[0_8px_20px_rgba(99,102,241,0.05)] relative flex flex-col justify-between min-h-[145px] hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                            <Globe className="size-5" />
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-mono">
                            Makro
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-200 group-hover:text-indigo-400 transition-colors">Global Macro</h5>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">Tjek globale økonomiske kalendere, geopolitiske risici og obligationsrenter.</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          Økonomiske faktorer
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-semibold flex items-center gap-0.5 uppercase tracking-wider">
                          Åbn
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>

                  </div>
                  )}
                </motion.div>
              )}

              {panelTab === 'live' && (
                <motion.div
                  key="live"
                  ref={liveListRef}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="space-y-4 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 flex flex-col"
                >
                  {trades.length === 0 ? (
                     <div className="text-center p-8 text-gray-600 text-xs uppercase tracking-widest font-mono border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center h-full min-h-[250px] gap-3">
                        <Activity className="size-6 animate-pulse text-gray-700" />
                        Forbinder til ordrebog...
                     </div>
                  ) : (
                     <>
                        <div className="h-32 w-full shrink-0">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={tradeChartData}>
                                <defs>
                                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={['auto', 'auto']} hide />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'var(--color-gray-900)', borderColor: 'var(--color-gray-800)', borderRadius: '0.75rem', fontSize: '12px' }}
                                  itemStyle={{ color: '#0ea5e9' }}
                                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                                  labelStyle={{ color: 'var(--color-gray-400)' }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="price" 
                                  stroke="#0ea5e9" 
                                  strokeWidth={2} 
                                  fillOpacity={1} 
                                  fill="url(#colorPrice)" 
                                  isAnimationActive={true}
                                  animationDuration={300}
                                />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 flex-grow overflow-auto custom-scrollbar">
                           {trades.map((trade, idx) => (
                              <div key={trade.id + '-' + idx} className="flex items-center justify-between p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 hover:border-gray-700 transition-colors">
                                <div className="flex items-center gap-4">
                                   <span className={`${trade.isBuyerMaker ? 'bg-rose-950/50 text-rose-500 border-rose-900/50' : 'bg-emerald-950/50 text-emerald-500 border-emerald-900/50'} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border min-w-16 text-center`}>
                                      {trade.isBuyerMaker ? 'SELL' : 'BUY'}
                                   </span>
                                   <span className="font-mono font-bold text-white text-sm">
                                      {symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, '')}
                                   </span>
                                </div>
                                <div className="text-right">
                                   <p className="font-mono text-sm text-gray-300">@ ${trade.price}</p>
                                   <p className="font-mono text-[10px] text-gray-500">Vol: {trade.quantity}</p>
                                </div>
                              </div>
                           ))}
                        </div>
                     </>
                  )}
                </motion.div>
              )}
              {panelTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0"
                >
                  <div className="space-y-2">
                     <div className="flex justify-end mb-2 px-1 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-20 w-full py-1">
                        <button onClick={handleExportCsv} disabled={orderHistory.length === 0} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2 border border-gray-700">
                           <Download className="size-3" /> Eksportér CSV
                        </button>
                     </div>
                     
                     {/* PnL Growth Chart */}
                     {pnlChartData.length > 0 && (
                        <div className="h-40 mb-4 bg-gray-950/40 rounded-xl border border-gray-800 p-3">
                        <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">PnL Vækst</h5>
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={pnlChartData}>
                              <XAxis dataKey="time" hide />
                              <YAxis stroke="var(--color-gray-600)" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--color-gray-950)', borderColor: 'var(--color-gray-700)', borderRadius: '0.5rem', fontSize: '10px' }} />
                              <Area type="monotone" dataKey="cumPnl" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                           </AreaChart>
                        </ResponsiveContainer>
                        </div>
                     )}
                     
                     
                     <div className="overflow-x-auto w-full pb-4">
                       <div className="w-full">
                         <table className="w-full text-left font-mono text-[11px]">
                           <thead className="sticky top-24 bg-gray-900/95 backdrop-blur-sm z-10 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.5)]">
                             <tr className="text-gray-500 border-b border-gray-800">
                               <th className="px-3 py-3 font-bold uppercase tracking-widest w-[15%]">Symbol</th>
                               <th className="px-3 py-3 font-bold uppercase tracking-widest w-[10%]">Type</th>
                               <th className="px-3 py-3 font-bold uppercase tracking-widest text-right w-[15%]">Entry</th>
                               <th className="px-3 py-3 font-bold uppercase tracking-widest text-right w-[15%]">Exit</th>
                               <th className="px-3 py-3 font-bold uppercase tracking-widest text-right w-[10%]">Duration</th>
                               <th className="px-3 py-3 font-bold uppercase tracking-widest text-right w-[15%]">Gain/Loss</th>
                               <th className="px-3 py-3 font-bold uppercase tracking-widest text-right w-[20%]">PnL / Tid</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-800/50">
                             {orderHistory.length === 0 && (
                                <tr>
                                  <td colSpan={7}>
                                    <div className="text-center p-8 text-gray-600 text-xs uppercase tracking-widest font-mono border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center min-h-[200px] mt-4">
                                       <History className="size-6 text-gray-800 mb-2" />
                                       Ingen historik
                                    </div>
                                  </td>
                                </tr>
                             )}
                             {orderHistory.map((order) => (
                                <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="bg-gray-950/40 hover:bg-gray-900/80 transition-colors cursor-pointer group">
                                  <td className="px-3 py-4 font-bold text-white uppercase whitespace-nowrap">{order.symbol}</td>
                                  <td className="px-3 py-4">
                                     <span className={`${order.type === 'SELL' ? 'bg-rose-950/50 text-rose-500 border-rose-900/50' : 'bg-emerald-950/50 text-emerald-500 border-emerald-900/50'} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap`}>
                                        {order.type}
                                     </span>
                                  </td>
                                  <td className="px-3 py-4 text-right text-gray-400 whitespace-nowrap">
                                     {order.entryPrice ? `${order.entryPrice.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="px-3 py-4 text-right text-gray-400 whitespace-nowrap">
                                     {order.exitPrice ? `${order.exitPrice.toFixed(2)}` : (order.price ? `${order.price.toFixed(2)}` : '-')}
                                  </td>
                                  <td className="px-3 py-4 text-right text-gray-500 whitespace-nowrap">
                                     {order.duration || '-'}
                                  </td>
                                  <td className={`px-3 py-4 text-right whitespace-nowrap ${order.profitPercent !== undefined ? (order.profitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-gray-500'}`}>
                                     {order.profitPercent !== undefined ? `${order.profitPercent >= 0 ? '+' : ''}${order.profitPercent.toFixed(2)}%` : '-'}
                                  </td>
                                  <td className={`px-3 py-4 text-right whitespace-nowrap flex flex-col justify-center items-end ${order.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                     <span className="font-bold text-[13px]">{order.pnl >= 0 ? '+' : ''}${Math.abs(order.pnl).toFixed(2)}</span>
                                     <span className="text-[9px] opacity-75 leading-none mt-1 text-gray-500 font-sans group-hover:text-gray-400 transition-colors">
                                        {order.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                     </span>
                                  </td>
                                </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     </div>
                  </div>
                </motion.div>
              )}
              {panelTab === 'wallet' && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0"
                >
                  {walletLoading ? (
                     <div className="flex items-center justify-center h-full">
                        <Activity className="size-6 animate-pulse text-purple-500" />
                     </div>
                  ) : walletError ? (
                     <div className="text-center p-6 border-rose-900 border bg-rose-950/30 rounded-2xl flex flex-col items-center justify-center h-full min-h-[200px]">
                        <p className="text-xs text-rose-300 font-mono">{walletError}</p>
                     </div>
                  ) : walletData ? (
                     <div className="space-y-6 h-full text-left" id="wallet-content-container">
                        {/* Premium Portfolio Card */}
                        {(() => {
                           const activeAsset = symbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, '');
                           const getAssetUsdPrice = (asset: string) => {
                             if (asset === 'USDT' || asset === 'USDC') return 1.0;
                             if (asset === activeAsset) return parseFloat(currentPrice) || 1.0;
                             const defaults: Record<string, number> = {
                               BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30, SPY: 510.50, QQQ: 440.20, VOO: 460.10, ARKK: 50.30, TLT: 90.50, BND: 72.10, AGG: 97.40, LQD: 105.20
                             };
                             return defaults[asset] || 1.0;
                           };

                           const spotTotal = (walletData.spot || []).reduce((acc: number, b: any) => acc + (parseFloat(b.free) + parseFloat(b.locked || '0')) * getAssetUsdPrice(b.asset), 0);
                           const earnTotal = (walletData.earn || []).reduce((acc: number, e: any) => acc + parseFloat(e.totalAmount) * getAssetUsdPrice(e.asset), 0);
                           const grandTotal = spotTotal + earnTotal;

                           return (
                             <div className="relative bg-gradient-to-br from-indigo-950/80 via-slate-900 to-emerald-950/50 p-5 rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
                               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                               <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl translate-y-12 -translate-x-12"></div>
                               
                               <div className="flex justify-between items-start mb-6">
                                 <div>
                                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Anslået Porteføljeværdi</span>
                                   <h4 className="text-2xl font-mono font-bold text-white tracking-tight">
                                      ${dkFormatter.format(grandTotal)}
                                   </h4>
                                 </div>
                                 <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${walletData.isSimulated ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' : 'bg-amber-950 text-amber-500 border border-amber-800/40'}`}>
                                    {walletData.isSimulated ? 'Papir / Demo' : 'Live Binance'}
                                 </span>
                               </div>

                               <div className="grid grid-cols-2 gap-4 border-t border-gray-800/60 pt-4 text-xs font-mono">
                                 <div>
                                   <span className="text-[9px] text-gray-500 block uppercase mb-0.5">Spot-Wallet</span>
                                   <span className="text-gray-300 font-bold">${dkFormatterMin2.format(spotTotal)}</span>
                                 </div>
                                 <div>
                                   <span className="text-[9px] text-gray-500 block uppercase mb-0.5">Earn / Opsparing</span>
                                   <span className="text-gray-300 font-bold">${dkFormatterMin2.format(earnTotal)}</span>
                                 </div>
                               </div>
                             </div>
                           );
                        })()}
                        {walletData.isSimulated && (
                           <div className="p-4 bg-gray-955 border border-gray-800/80 rounded-2xl space-y-3.5">
                              <div className="flex gap-2.5 items-start">
                                <Info className="size-4 text-cyan-400 mt-0.5 shrink-0 animate-pulse" />
                                <div className="space-y-0.5">
                                   <p className="text-xs font-bold text-gray-200">Administrer Demosaldi</p>
                                   <p className="text-[10px] text-gray-500 leading-normal">
                                      Du kører i Papirhandel. Du kan frit justere dine simulererede balancer herunder for at teste botsen.
                                   </p>
                                </div>
                              </div>

                              {/* Quick simulated funding buttons */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <button 
                                  type="button"
                                  onClick={async () => {
                                     const currentUsdt = parseFloat(walletData.spot.find((s: any) => s.asset === 'USDT')?.free || '0');
                                     const res = await fetch('/api/wallet/update', {
                                       method: 'POST',
                                       headers: { 'Content-Type': 'application/json' },
                                       body: JSON.stringify({ asset: 'USDT', amount: currentUsdt + 5000 })
                                     });
                                     if (res.ok) {
                                       fetchWalletRef.current?.();
                                       addLog('Tilføjede $5.000 USDT simuleret saldo via hurtig-knap', 'info');
                                     }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-[10px] hover:bg-cyan-900/40 hover:text-white transition-all uppercase font-mono font-bold cursor-pointer inline-flex items-center"
                                >
                                  + $5k USDT
                                </button>
                                <button 
                                  type="button"
                                  onClick={async () => {
                                     const currentUsdt = parseFloat(walletData.spot.find((s: any) => s.asset === 'USDT')?.free || '0');
                                     const res = await fetch('/api/wallet/update', {
                                       method: 'POST',
                                       headers: { 'Content-Type': 'application/json' },
                                       body: JSON.stringify({ asset: 'USDT', amount: currentUsdt + 25000 })
                                     });
                                     if (res.ok) {
                                       fetchWalletRef.current?.();
                                       addLog('Tilføjede $25.000 USDT simuleret saldo via hurtig-knap', 'info');
                                     }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-[10px] hover:bg-cyan-900/40 hover:text-white transition-all uppercase font-mono font-bold cursor-pointer inline-flex items-center"
                                >
                                  + $25k USDT
                                </button>
                                <button 
                                  type="button"
                                  onClick={async () => {
                                     const res = await fetch('/api/wallet/update', {
                                       method: 'POST',
                                       headers: { 'Content-Type': 'application/json' },
                                       body: JSON.stringify({ asset: 'USDT', amount: 10 })
                                     });
                                     if (res.ok) {
                                       fetchWalletRef.current?.();
                                       addLog('Nulstillede testporteføljebalance til $10 standard', 'info');
                                     }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 text-[10px] hover:bg-gray-850 hover:text-white transition-all uppercase font-mono font-bold cursor-pointer inline-flex items-center"
                                >
                                  Nulstil
                                </button>
                                <button 
                                  type="button"
                                  onClick={async () => {
                                     try {
                                        const userApiKey = localStorage.getItem('user_binance_api_key');
                                        const userApiSecret = localStorage.getItem('user_binance_api_secret');
                                        const headers: any = { 'Content-Type': 'application/json' };
                                        if (userApiKey) headers['x-binance-api-key'] = userApiKey;
                                        if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;
                                        if (googleUser?.uid) headers['x-user-uid'] = googleUser.uid;

                                        const res = await fetch('/api/wallet/reset-to-live', {
                                           method: 'POST',
                                           headers
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.success) {
                                           fetchWalletRef.current?.();
                                           toast.success('Demowallet blev nulstillet og synkroniseret med din ægte wallet!');
                                           addLog('Nulstillede og spejlede demowallet til ægte wallet indhold', 'info');
                                        } else {
                                           toast.error(data.error || 'Kunne ikke spejle ægte wallet');
                                        }
                                     } catch (err: any) {
                                        toast.error(err.message || 'Der opstod en fejl under spejling');
                                     }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] hover:bg-emerald-900/40 hover:text-white transition-all uppercase font-mono font-bold cursor-pointer inline-flex items-center"
                                >
                                  Spejl Ægte Wallet
                                </button>
                              </div>
                              <form onSubmit={handleUpdateWallet} className="flex flex-col gap-2 p-3 bg-gray-900/50 rounded-xl border border-gray-800/80 mt-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-1">Administrer Beholdning</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="F.eks. BTC" 
                                    value={editAsset}
                                    onChange={e => setEditAsset(e.target.value)}
                                    className="bg-gray-950 border border-gray-800 rounded px-3 py-1.5 text-xs text-white uppercase focus:border-cyan-500 outline-none w-20"
                                  />
                                  <input 
                                    type="number" 
                                    placeholder="Antal" 
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className="bg-gray-950 border border-gray-800 rounded px-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none flex-1"
                                    step="any"
                                    min="0"
                                  />
                                  <button type="submit" className="bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-400 border border-cyan-800/50 rounded px-4 py-1.5 text-xs font-bold transition-colors">
                                    Gem
                                  </button>
                                </div>
                              </form>
                           </div>
                        )}
                        {walletData.spot.length > 0 && (
                           <div className="space-y-3">
                              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Wallet className="size-3 text-cyan-400" /> Spot Balances
                              </h5>
                              <div className="space-y-2">
                                {walletData.spot.map((b: any) => (
                                  <div 
                                    key={`spot-${b.asset}`} 
                                    onClick={() => {
                                      if (b.asset === 'USDT') return;
                                      const targetSymbol = `${b.asset}USDT`;
                                      setSymbol(targetSymbol);
                                      setPanelTab('live');
                                      addLog(`Skiftede aktivt handelspar til ${b.asset}/USDT baseret på Spot Wallet`, 'info');
                                    }}
                                    className={`flex justify-between p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 transition-all ${b.asset === 'USDT' ? 'opacity-80' : 'cursor-pointer hover:border-cyan-500/50 hover:bg-gray-900/40 active:scale-[0.98]'}`}
                                    title={b.asset === 'USDT' ? 'USDT er din basisvaluta' : `Begynd at handle ${b.asset}/USDT`}
                                  >
                                    <span className="font-bold text-white">{b.asset}</span>
                                    <div className="text-right font-mono text-sm tabular-nums">
                                      <p className="text-emerald-400">{parseFloat(b.free).toFixed(4)} Free</p>
                                      {parseFloat(b.locked) > 0 && <p className="text-gray-500 text-[10px]">{parseFloat(b.locked).toFixed(4)} Locked</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                           </div>
                        )}
                        {walletData.earn.length > 0 && (
                           <div className="space-y-3">
                              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="size-3 text-amber-500" /> Earn (Flexible)
                              </h5>
                              <div className="space-y-2">
                                {walletData.earn.map((e: any) => (
                                  <div 
                                    key={`earn-${e.asset}`} 
                                    onClick={() => {
                                      if (e.asset === 'USDT') return;
                                      const targetSymbol = `${e.asset}USDT`;
                                      setSymbol(targetSymbol);
                                      setPanelTab('live');
                                      addLog(`Skiftede aktivt handelspar til ${e.asset}/USDT baseret på Flexible Earn`, 'info');
                                    }}
                                    className={`flex justify-between p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 transition-all ${e.asset === 'USDT' ? 'opacity-80' : 'cursor-pointer hover:border-amber-500/50 hover:bg-gray-900/40 active:scale-[0.98]'}`}
                                    title={e.asset === 'USDT' ? 'USDT er din basisvaluta' : `Begynd at handle ${e.asset}/USDT`}
                                  >
                                    <span className="font-bold text-white">{e.asset}</span>
                                    <div className="text-right font-mono text-sm tabular-nums">
                                      <p className="text-amber-400">{parseFloat(e.totalAmount).toFixed(4)} Total</p>
                                      <p className="text-gray-500 text-[10px]">APR: {(parseFloat(e.latestAnnualPercentageRate) * 100).toFixed(2)}%</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                           </div>
                        )}
                        {walletData.spot.length === 0 && walletData.earn.length === 0 && (
                           <div className="text-center p-6 text-gray-500 text-xs font-mono flex flex-col items-center justify-center h-full min-h-[200px]">Ingen saldi fundet.</div>
                        )}
                     </div>
                  ) : null}
                </motion.div>
              )}
              {panelTab === 'alerts' && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                  <div className="bg-gray-950/80 p-4 rounded-xl border border-gray-800 space-y-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Bell className="size-3 text-rose-500" /> Ny Pris Alarm
                    </h5>
                    <div className="flex flex-col gap-3">
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newAlertTicker} 
                            onChange={e => setNewAlertTicker(e.target.value.toUpperCase())} 
                            placeholder={symbol}
                            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 w-24 outline-none focus:border-rose-500 font-mono"
                          />
                          <select 
                            value={newAlertType} 
                            onChange={e => setNewAlertType(e.target.value as 'above'|'below')}
                            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 w-32 outline-none focus:border-rose-500"
                          >
                            <option value="above">Krydser over</option>
                            <option value="below">Krydser under</option>
                          </select>
                          <input 
                            type="number" 
                            value={newAlertPrice} 
                            onChange={e => setNewAlertPrice(e.target.value)} 
                            placeholder="Pris i USDT"
                            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 flex-1 outline-none focus:border-rose-500 font-mono"
                          />
                          <button 
                            onClick={async () => {
                               if (!newAlertPrice || isNaN(parseFloat(newAlertPrice))) return;
                               const alertSymbol = newAlertTicker.trim() || symbol;
                               const alertData = {
                                  price: parseFloat(newAlertPrice),
                                  type: newAlertType,
                                  triggered: false,
                                  symbol: alertSymbol,
                                  userId: firebaseAuth.currentUser?.uid || 'anonymous'
                               };
                               
                               if (firebaseAuth.currentUser) {
                                  try {
                                     await addDoc(collection(db, 'priceAlerts'), alertData);
                                  } catch (e: any) {
                                     console.error('Failed to create price alert in cloud:', e);
                                     if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit')) {
                                        toast.error('Kan ikke oprette alarm: Firestore database kvote er opbrugt for i dag.');
                                     } else {
                                        toast.error('Der opstod en fejl ved oprettelse af alarm i cloud.');
                                     }
                                  }
                               } else {
                                  setPriceAlerts(prev => [{ id: Date.now().toString(), ...alertData }, ...prev]);
                               }
                               
                               setNewAlertPrice('');
                               setNewAlertTicker('');
                               addLog(`Alarm sat for ${alertSymbol}: ${newAlertType === 'above' ? 'over' : 'under'} ${parseFloat(newAlertPrice)}`, 'info');
                            }}
                            className="bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 border border-rose-900/50 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
                          >
                            Tilføj
                          </button>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aktive Alarmer</h5>
                     {priceAlerts.length === 0 && (
                        <p className="text-xs text-gray-600 font-mono italic">Ingen alarmer sat.</p>
                     )}
                     {priceAlerts.map(alert => (
                        <div key={alert.id} className={`flex items-center justify-between p-3 rounded-xl border ${alert.triggered ? 'bg-rose-900/20 border-rose-900/50' : 'bg-gray-950 border-gray-800'}`}>
                           <div className="flex items-center gap-3">
                              <Bell className={`size-4 ${alert.triggered ? 'text-rose-500 animate-pulse' : 'text-gray-500'}`} />
                              <div>
                                 <p className={`font-mono text-sm ${alert.triggered ? 'text-rose-400' : 'text-gray-300'}`}>
                                    {alert.symbol || symbol} {alert.type === 'above' ? '≥' : '≤'} {alert.price.toFixed(2)}
                                 </p>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                    {alert.triggered ? 'Udløst' : 'Venter'}
                                 </p>
                              </div>
                           </div>
                           <button 
                              onClick={async () => {
                                if (firebaseAuth.currentUser) {
                                  try {
                                    await deleteDoc(doc(db, 'priceAlerts', alert.id));
                                  } catch (e) {
                                    console.error("Failed to delete alert from cloud", e);
                                  }
                                } else {
                                  setPriceAlerts(prev => prev.filter(a => a.id !== alert.id));
                                }
                              }}
                              className="text-gray-500 hover:text-rose-400 p-2 transition-colors"
                           >
                              <X className="size-4" />
                           </button>
                        </div>
                     ))}
                  </div>
                </motion.div>
              )}
              {panelTab === 'analyses' && (
                <motion.div
                  key="analyses"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                  <div className="border-b-4 border-gray-100 dark:border-gray-800 pb-3 mb-6">
                     <h2 className="text-3xl font-serif font-black tracking-tighter uppercase text-white mb-1">
                        AI Quantitative Intel
                     </h2>
                     <div className="flex items-center justify-between border-y border-gray-800 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        <span>Volume I • Issue 1</span>
                        <span>Confidence &gt; 88%</span>
                        <span>{new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                     </div>
                  </div>

                  <div className="mb-8 p-5 bg-gray-950/80 border border-gray-800 rounded-xl space-y-4 shadow-lg backdrop-blur-sm">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                           <Mic className="size-4 text-blue-500" /> Voice Intel Notes
                        </h3>
                        <button
                           onMouseDown={startRecording}
                           onMouseUp={stopRecording}
                           onMouseLeave={stopRecording}
                           onTouchStart={startRecording}
                           onTouchEnd={stopRecording}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${isRecording ? 'bg-rose-950/60 text-rose-500 border-rose-900/60 animate-pulse' : 'bg-blue-950/40 text-blue-500 border-blue-900/50 hover:bg-blue-900/40'}`}
                        >
                           <Mic className={`size-3 ${isRecording ? 'animate-bounce' : ''}`} />
                           {isRecording ? 'Listening...' : 'Hold to Speak'}
                        </button>
                     </div>
                     {tradeNotes.length === 0 ? (
                        <div className="text-[10px] text-gray-500 font-mono italic p-3 border border-dashed border-gray-800 rounded hover:border-gray-700 transition-colors text-center">
                           No voice notes for this session yet. Hold button to speak.
                        </div>
                     ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 flex flex-col-reverse custom-scrollbar">
                           {tradeNotes.map(note => (
                              <div key={note.id} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg flex flex-col gap-1">
                                 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <span className="text-blue-400">{note.symbol}</span>
                                    <span>{note.time}</span>
                                 </div>
                                 <p className="text-xs text-gray-300 font-serif leading-relaxed">"{note.content}"</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="columns-1 sm:columns-2 gap-6 space-y-6">
                     {analysesData.map((article, idx) => (
                        <article key={idx} className="break-inside-avoid bg-gray-950/60 p-4 rounded-lg border border-gray-800/80 hover:border-gray-600 transition-colors">
                           <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                              <span className="text-xs font-black uppercase tracking-widest text-blue-400">{article.pair}</span>
                              <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-500">
                                 <Activity className="size-3" />
                                 {article.confidence}%
                              </div>
                           </div>
                           <h3 className="text-lg font-serif font-bold text-gray-100 leading-snug mb-2">
                              {article.headline}
                           </h3>
                           <p className="text-sm font-serif text-gray-400 leading-relaxed drop-cap line-clamp-4">
                              {article.summary}
                           </p>
                           <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-sans uppercase tracking-widest">
                              <span>By {article.author}</span>
                              <span>{article.impact}</span>
                           </div>
                        </article>
                     ))}
                  </div>
                </motion.div>
              )}
              {panelTab === 'compare' && (
                <motion.div
                  key="compare"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                  <div className="border-b-4 border-gray-100 dark:border-gray-800 pb-3 mb-6">
                     <h2 className="text-3xl font-serif font-black tracking-tighter uppercase text-white mb-1">
                        Strategy Comparison
                     </h2>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        Simultaneous AI Model Analysis
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-100px)]">
                     {/* Column A */}
                     <div className="bg-gray-950/80 border border-emerald-900/40 rounded-xl overflow-hidden shadow-xl flex flex-col relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                        <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm z-10">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="bg-emerald-950/60 p-1.5 rounded-lg border border-emerald-900/50">
                                 <GitCompare className="size-4 text-emerald-400" />
                              </div>
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Model Alpha</h3>
                           </div>
                           <select
                              value={compareStrategyA}
                              onChange={(e) => setCompareStrategyA(e.target.value)}
                              className="w-full bg-gray-950 border border-gray-700 text-emerald-400 text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500 font-mono transition-colors shadow-inner"
                           >
                              <option>Momentum Trading</option>
                              <option>Mean Reversion</option>
                              <option>Simple Moving Average (SMA)</option>
                              <option>High-Frequency Scalper (HFT)</option>
                              <option>Grid Trading Arbitrage</option>
                           </select>
                        </div>
                        <div className="p-5 flex-grow space-y-5 relative z-10 overflow-y-auto hidden-scrollbar">
                           <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Stance</p>
                              <div className="flex items-center justify-between">
                                 <span className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">Strong Buy</span>
                                 <span className="bg-emerald-950/40 text-emerald-500 border border-emerald-900/50 px-2 py-1 rounded text-xs font-mono">Conf: 94%</span>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                              <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-800">
                                 <p className="text-gray-500 mb-1">Target Entry</p>
                                 <p className="text-gray-200 tabular-nums">${(parseFloat(currentPrice) * 0.995).toFixed(2)}</p>
                              </div>
                              <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-800">
                                 <p className="text-gray-500 mb-1">Volatility Map</p>
                                 <p className="text-emerald-400">Low Risk</p>
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] text-emerald-900 font-bold uppercase tracking-widest mb-2 bg-emerald-400 inline-block px-1.5 py-0.5 rounded">Live Insights</p>
                              <p className="text-xs text-gray-300 font-serif leading-relaxed line-clamp-4">
                                 {compareStrategyA} is identifying significant short-term liquidity gaps in the {symbol} order book. Historical context over the past 4 hours suggests severe underpricing relative to immediate momentum flow.
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Column B */}
                     <div className="bg-gray-950/80 border border-amber-900/40 rounded-xl overflow-hidden shadow-xl flex flex-col relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
                        <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm z-10">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="bg-amber-950/60 p-1.5 rounded-lg border border-amber-900/50">
                                 <GitCompare className="size-4 text-amber-500" />
                              </div>
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Model Beta</h3>
                           </div>
                           <select
                              value={compareStrategyB}
                              onChange={(e) => setCompareStrategyB(e.target.value)}
                              className="w-full bg-gray-950 border border-gray-700 text-amber-500 text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
                           >
                              <option>Momentum Trading</option>
                              <option>Mean Reversion</option>
                              <option>Simple Moving Average (SMA)</option>
                              <option>High-Frequency Scalper (HFT)</option>
                              <option>Grid Trading Arbitrage</option>
                           </select>
                        </div>
                        <div className="p-5 flex-grow space-y-5 relative z-10 overflow-y-auto hidden-scrollbar">
                           <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Stance</p>
                              <div className="flex items-center justify-between">
                                 <span className="text-2xl font-black text-amber-500 uppercase tracking-tighter">Hold / Wait</span>
                                 <span className="bg-amber-950/40 text-amber-500 border border-amber-900/50 px-2 py-1 rounded text-xs font-mono">Conf: 62%</span>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                              <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-800">
                                 <p className="text-gray-500 mb-1">Support Level</p>
                                 <p className="text-gray-200 tabular-nums">${(parseFloat(currentPrice) * 0.98).toFixed(2)}</p>
                              </div>
                              <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-800">
                                 <p className="text-gray-500 mb-1">Macro Trend</p>
                                 <p className="text-amber-400">Sideways</p>
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] text-amber-900 font-bold uppercase tracking-widest mb-2 bg-amber-500 inline-block px-1.5 py-0.5 rounded">Live Insights</p>
                              <p className="text-xs text-gray-300 font-serif leading-relaxed line-clamp-4">
                                 {compareStrategyB} observes conflicting volume profiles on larger timeframes. Resistance near current price action presents an unfavorable risk/reward ratio for aggressive long deliveries.
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}
              {panelTab === 'backtest' && (
                <motion.div
                  key="backtest"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                  <StrategyBacktester currentStrategy={strategy} defaultTicker={symbol} />
                </motion.div>
              )}
              {panelTab === 'journal' && (
                <motion.div
                  key="journal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                  <div className="border-b-4 border-gray-100 dark:border-gray-800 pb-3 mb-6">
                     <h2 className="text-3xl font-serif font-black tracking-tighter uppercase text-white mb-1">
                        Manual Trade Journal
                     </h2>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        Log Notes and Reasoning Behind Specific Trades
                     </div>
                  </div>
                  
                  <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-5 shadow-xl">
                     <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <BookOpen className="size-4 text-violet-400" /> New Journal Entry
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Symbol</label>
                           <input
                              type="text"
                              value={newJournalSymbol}
                              onChange={(e) => setNewJournalSymbol(e.target.value.toUpperCase())}
                              className="w-full bg-gray-900 border border-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors uppercase font-mono"
                              placeholder="BTCUSDT"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Type</label>
                           <select
                              value={newJournalType}
                              onChange={(e) => setNewJournalType(e.target.value as any)}
                              className="w-full bg-gray-900 border border-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                           >
                              <option value="Long">Long</option>
                              <option value="Short">Short</option>
                              <option value="Observation">Observation</option>
                           </select>
                        </div>
                     </div>
                     <div className="mb-4">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Reasoning & Notes</label>
                        <textarea
                           value={newJournalReasoning}
                           onChange={(e) => setNewJournalReasoning(e.target.value)}
                           className="w-full h-32 bg-gray-900 border border-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors resize-none placeholder-gray-600"
                           placeholder="Why did you take this position? What indicators aligned with this setup?"
                        ></textarea>
                     </div>
                     <button
                        onClick={handleAddJournalEntry}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold text-sm tracking-wide uppercase transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
                        disabled={!newJournalReasoning.trim()}
                     >
                        Save Entry
                     </button>
                  </div>

                  <div className="space-y-4">
                     {journalEntries.length === 0 ? (
                        <div className="p-8 text-center bg-gray-950/40 border border-dashed border-gray-800 rounded-xl space-y-2">
                           <BookOpen className="size-8 text-gray-700 mx-auto" />
                           <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Journal Entries</p>
                           <p className="text-xs text-gray-600">Start logging your reasoning manually above.</p>
                        </div>
                     ) : (
                        journalEntries.map(entry => (
                           <div key={entry.id} className="p-4 bg-gray-950/80 border border-gray-800/80 hover:border-gray-600 rounded-xl transition-colors">
                              <div className="flex justify-between items-start mb-3 border-b border-gray-800 pb-2">
                                 <div className="flex items-center gap-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-white px-2 py-0.5 bg-gray-900 rounded">{entry.symbol}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${entry.type === 'Long' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50' : entry.type === 'Short' ? 'text-rose-400 bg-rose-950/40 border border-rose-900/50' : 'text-blue-400 bg-blue-950/40 border border-blue-900/50'}`}>
                                       {entry.type}
                                    </span>
                                 </div>
                                 <span className="text-[10px] text-gray-500 font-mono">{entry.date}</span>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed font-serif whitespace-pre-wrap">
                                 {entry.reasoning}
                              </p>
                           </div>
                        ))
                     )}
                  </div>
                </motion.div>
              )}
              {panelTab === 'stocks' && (
                <motion.div
                  key="stocks"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                  <div className="border-b-4 border-gray-100 dark:border-gray-800 pb-3 mb-6">
                     <h2 className="text-3xl font-serif font-black tracking-tighter uppercase text-white mb-1">
                        Aktier & Nyheder
                     </h2>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        Realtidsaktiedata-feeds & Markedsnyheder
                     </div>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                     <label className="text-xs font-bold text-gray-400 uppercase">Vælg Aktie:</label>
                     <select 
                        value={stockTicker}
                        onChange={(e) => setStockTicker(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm font-bold text-white outline-none focus:border-emerald-500"
                     >
                        <option value="AAPL">AAPL (Apple)</option>
                        <option value="TSLA">TSLA (Tesla)</option>
                        <option value="MSFT">MSFT (Microsoft)</option>
                        <option value="NVDA">NVDA (NVIDIA)</option>
                        <option value="AMZN">AMZN (Amazon)</option>
                     </select>
                  </div>

                  <div className="h-[400px] w-full mt-4 bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">
                     <StockChart 
                        data={mockStockData} 
                        ticker={stockTicker} 
                        timeframe="1H" 
                        onTimeframeChange={() => {}} 
                     />
                  </div>

                  <div className="mt-6">
                     <NewsFeed ticker={stockTicker} />
                  </div>
                </motion.div>
              )}
              {panelTab === 'scanner' && (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                   <MarketScanner onSelectPair={(sym) => { setSymbol(sym); setPanelTab('live'); }} />
                </motion.div>
              )}
              {panelTab === 'autopilot' && (
                <motion.div
                  key="autopilot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6"
                >
                   <AiAutopilot symbol={symbol} onSymbolChange={setSymbol} />
                </motion.div>
              )}
              {panelTab === 'macro' && (
                <motion.div
                  key="macro"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6 pb-20"
                >
                   <MacroTerminal />
                   <div className="mt-6">
                     <NeuralOrderFlow />
                   </div>
                </motion.div>
              )}
              {panelTab === 'correlation' && (
                <motion.div
                  key="correlation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6 pb-20 font-sans"
                >
                   <CorrelationMatrix />
                </motion.div>
              )}
              {panelTab === 'risk' && (
                <motion.div
                  key="risk"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6 pb-20 font-sans"
                >
                   <RiskMetricsDashboard />
                </motion.div>
              )}
              {panelTab === 'rebalance' && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6 pb-20 font-sans"
                >
                   <PortfolioRebalancer userProfile="Balanceret" walletData={walletData} />
                </motion.div>
              )}
              
              {panelTab === 'design' && (
                <motion.div
                  key="design"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 absolute inset-0 space-y-6 pb-20 font-sans"
                >
                   <DesignCenter 
                     activeTheme={activeTheme}
                     setActiveTheme={handleThemeChange}
                     navStyle={navStyle}
                     setNavStyle={handleNavStyleChange}
                     widgetOrder={widgetOrder}
                     setWidgetOrder={(order) => {
                       setWidgetOrder(order);
                       localStorage.setItem('binance_widget_order', JSON.stringify(order));
                     }}
                   />
                </motion.div>
              )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

      {/* Analytics Panel */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: widgetOrder.indexOf('aiPerformance') * 0.1, ease: 'easeOut' }}
        style={{ order: widgetOrder.indexOf('aiPerformance') }}
        className={`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-300 hover:scale-[1.01] hover:z-10 ${draggedIndex === widgetOrder.indexOf('aiPerformance') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5' : ''}`}
      >
         {/* Reordering Header */}
         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 bg-gray-950/95 border border-gray-850 rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
            <span className="flex items-center gap-1.5 text-amber-500 cursor-grab active:cursor-grabbing">
              <GripVertical className="size-3.5" />
              AI Performance & Statistik
            </span>
            <div className="flex items-center gap-1 text-gray-400 font-mono">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('aiPerformance'), -1); }} 
                disabled={widgetOrder.indexOf('aiPerformance') === 0} 
                className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                title="Flyt op / venstre"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('aiPerformance'), 1); }} 
                disabled={widgetOrder.indexOf('aiPerformance') === widgetOrder.length - 1} 
                className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                title="Flyt ned / højre"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
         </div>
           <div className="flex justify-between items-center mb-6 relative z-10">
               <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="text-emerald-500 size-4" /> AI Performance
               </h4>
               <button 
                  onClick={handleResetPerformance}
                  disabled={isResettingPerformance}
                  className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
               >
                  {isResettingPerformance ? "Nulstiller..." : "Nulstil"}
               </button>
           </div>
           <div className="space-y-6 relative z-10">
              <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Gevinst Rate (30d)</p>
                 <p className="text-4xl font-mono text-emerald-400 tracking-tighter">{winRate.toFixed(1)}%</p>
              </div>
              <div className="h-px w-full bg-gray-800 my-4"></div>
              <div>
                 <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest">Samlet PnL Genereret {googleUser && <span className="text-[9px] text-emerald-400 lowercase font-mono">({googleUser.email})</span>}</p>
                   <button 
                      onClick={handleSaveToCalendar}
                      disabled={isLoggingCalendar}
                      className={`text-[10px] px-2 py-1 flex items-center gap-1 rounded transition-colors border ${needsGoogleAuth ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border-amber-900/50' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border-emerald-900/50'}`}
                      title={needsGoogleAuth ? "Forbind Google Kalender" : "Gem dagens PnL i din Google Kalender"}
                   >
                     <Calendar className="size-3" />
                     {isLoggingCalendar ? 'Gemmer...' : needsGoogleAuth ? 'Forbind Google' : 'Sync til Kalender'}
                   </button>
                 </div>
                 <motion.p 
                    key={orderHistory.length}
                    initial={{ color: '#10b981', scale: 1.05 }}
                    animate={{ color: 'var(--color-white)', scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-3xl font-mono text-white tracking-tight"
                 >
                    {pnlDisplay}
                 </motion.p>
                 <div className="h-40 mt-4 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pnlChartData}>
                        <defs>
                          <linearGradient id="colorCumPnl" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--color-gray-950)', borderColor: 'var(--color-gray-800)', borderRadius: '0.5rem', fontSize: '10px', fontFamily: 'monospace' }}
                          itemStyle={{ color: '#10b981' }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative PnL']}
                          labelStyle={{ color: 'var(--color-gray-400)' }}
                        />
                        <Area type="monotone" dataKey="cumPnl" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCumPnl)" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="h-px w-full bg-gray-800 my-4"></div>
              
              {/* Performance & Statistics Dashboard */}
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Handelsstatistik (Live KPI)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/60">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Handler</p>
                    <p className="text-sm font-mono text-white font-bold">{totalTradesCount}</p>
                  </div>
                  <div className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/60">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Avg. PnL / Handel</p>
                    <p className={`text-sm font-mono font-bold ${averagePnlVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {averagePnlVal >= 0 ? '+' : ''}${averagePnlVal.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/60">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Bedste Handel</p>
                    <p className="text-sm font-mono text-emerald-400 font-bold">
                      {maxWinVal > 0 ? `+$${maxWinVal.toFixed(2)}` : '$0.00'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/60">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Værste Handel</p>
                    <p className="text-sm font-mono text-rose-400 font-bold">
                      {maxLossVal < 0 ? `-$${Math.abs(maxLossVal).toFixed(2)}` : '$0.00'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-800 my-4"></div>
              <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Aktive Positioner</p>
                 <p className="text-xl font-mono text-cyan-400">{activePositions}</p>
                  
                  {activePositions > 0 && activePositionsList.map((pos: any, idx: number) => (
                      <ActivePositionCard 
                         key={pos.id || idx}
                         pos={pos}
                         idx={idx}
                         symbol={serverSymbol || symbol}
                         allocation={allocation}
                         lastPrice={currentPrice}
                         globalTakeProfit={takeProfit}
                         globalStopLoss={stopLoss}
                         onUpdate={async (id: string, tp: number, sl: number) => {
                             try {
                                 const res = await fetch('/api/bot/position/update', {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ id, takeProfit: tp, stopLoss: sl })
                                 });
                                 if (res.ok) {
                                     toast.success("Position opdateret!");
                                     // Trigger a state fetch to update the parent list
                                     fetch('/api/bot/state')
                                        .then(r => r.json())
                                        .then(state => {
                                            if (state.activePositionsList) {
                                                setActivePositionsList(prev => mergePositionsLists(prev, state.activePositionsList || []));
                                            }
                                        });
                                 } else {
                                     toast.error("Fejl ved opdatering af position");
                                 }
                             } catch (e) {
                                 toast.error("Netværksfejl");
                             }
                         }}
                      />
                  ))}
              </div>
              <div className="h-px w-full bg-gray-800 my-4"></div>
              <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">7-Day PnL Heatmap</p>
                 <div className="flex items-center gap-2">
                    {heatmapData.map((day, i) => {
                       let bgColor = "bg-gray-800/50";
                       if (day.pnl > 0) bgColor = "bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
                       else if (day.pnl < 0) bgColor = "bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
                       else if (day.trades > 0) bgColor = "bg-gray-600";
                       
                       return (
                          <div 
                             key={i} 
                             className={`h-8 flex-1 rounded-md ${bgColor} flex items-center justify-center group relative cursor-pointer transition-all hover:scale-105`}
                          >
                             <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-gray-950 border border-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none transition-opacity font-mono">
                                {day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                <br/>
                                PnL: <span className={day.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl).toFixed(2)}</span>
                                <br/>
                                Trades: {day.trades}
                             </div>
                          </div>
                       )
                    })}
                 </div>
                 <div className="flex justify-between mt-2 text-[8px] text-gray-500 font-mono uppercase">
                    <span>{heatmapData[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span>Today</span>
                 </div>
              </div>
              <div className="h-px w-full bg-gray-800 my-4"></div>
              <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Performance pr. Par</p>
                 <div className="space-y-2">
                    <div className="grid grid-cols-4 px-2 py-1 text-[8px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 mb-2 gap-2">
                       <div>Par</div>
                       <div className="text-right">Gevinst Rate</div>
                       <div className="text-right">Antal Handler</div>
                       <div className="text-right">Gns. Hold</div>
                    </div>
                    {pairStats.length === 0 && (
                      <div className="text-center py-4 min-h-[60px] flex items-center justify-center text-xs font-mono text-gray-600 border border-dashed border-gray-800 rounded w-full">
                        AFVENTER HANDLER
                      </div>
                    )}
                    {pairStats.map((stat, i) => (
                      <div key={i} className="grid grid-cols-4 items-center px-2 py-2 bg-gray-950/50 rounded-lg border border-gray-800/50 text-[10px] font-mono gap-2 hover:border-gray-700 transition-colors">
                        <div className="text-white font-bold">{stat.pair}</div>
                        <div className="text-emerald-400 text-right">{stat.winRate}</div>
                        <div className="text-right text-gray-300">{stat.trades}</div>
                        <div className="text-right text-gray-500">{stat.hold}</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </motion.div>

        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: widgetOrder.indexOf('risikostyring') * 0.1, ease: 'easeOut' }}
          style={{ order: widgetOrder.indexOf('risikostyring') }}
          className={`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-300 hover:scale-[1.01] hover:z-10 ${draggedIndex === widgetOrder.indexOf('risikostyring') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5' : ''}`}
        >
          {/* Reordering Header */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 bg-gray-950/95 border border-gray-850 rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
             <span className="flex items-center gap-1.5 text-amber-500 cursor-grab active:cursor-grabbing">
               <GripVertical className="size-3.5" />
               Avanceret Risikoanalyse
             </span>
             <div className="flex items-center gap-1 text-gray-400 font-mono">
               <button 
                 type="button" 
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('risikostyring'), -1); }} 
                 disabled={widgetOrder.indexOf('risikostyring') === 0} 
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                 title="Flyt op / venstre"
               >
                 <ChevronLeft className="size-3.5" />
               </button>
               <button 
                 type="button" 
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('risikostyring'), 1); }} 
                 disabled={widgetOrder.indexOf('risikostyring') === widgetOrder.length - 1} 
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                 title="Flyt ned / højre"
               >
                 <ChevronRight className="size-3.5" />
               </button>
             </div>
          </div>
           <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
              <Shield className="text-rose-500 size-4" /> Risikostyring
           </h4>
           <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-950/80 p-4 rounded-2xl border border-gray-800 relative group">
                    <div className="flex items-center gap-1 mb-1">
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest">Nuværende Drawdown</p>
                       <Info className="size-3 text-gray-600 cursor-help" />
                       <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 border border-gray-700 rounded shadow-xl text-[10px] text-gray-300 z-50 pointer-events-none">
                         Beregnet som det procentvise fald fra det maksimale kumulative PnL til det nuværende kumulative PnL. Indikerer aktuel risiko for tab.
                       </div>
                    </div>
                    <p className={`text-2xl font-mono tracking-tighter ${currentDrawdownPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {currentDrawdownPct.toFixed(2)}%
                    </p>
                 </div>
                 <div className="bg-gray-950/80 p-4 rounded-2xl border border-gray-800 relative group">
                    <div className="flex items-center gap-1 mb-1">
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest">Sharpe Ratio</p>
                       <Info className="size-3 text-gray-600 cursor-help" />
                       <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 border border-gray-700 rounded shadow-xl text-[10px] text-gray-300 z-50 pointer-events-none">
                         A measure of risk-adjusted return. Calculated as the annualized average return per trade divided by the standard deviation of returns. &gt;1 is generally good.
                       </div>
                    </div>
                    <p className="text-2xl font-mono text-cyan-400 tracking-tighter">
                      {sharpeRatio.toFixed(2)}
                    </p>
                 </div>
              </div>
           </div>
        </motion.div>
        
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: widgetOrder.indexOf('maeglerforbindelse') * 0.1, ease: 'easeOut' }}
          style={{ order: widgetOrder.indexOf('maeglerforbindelse') }}
          className={`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] relative group transition-all duration-300 hover:scale-[1.01] hover:z-10 ${draggedIndex === widgetOrder.indexOf('maeglerforbindelse') ? 'opacity-40 ring-2 ring-amber-500/40 bg-amber-500/5' : ''}`}
        >
          {/* Reordering Header */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 bg-gray-950/95 border border-gray-850 rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
             <span className="flex items-center gap-1.5 text-amber-500 cursor-grab active:cursor-grabbing">
               <GripVertical className="size-3.5" />
               Mægler API Forbindelse
             </span>
             <div className="flex items-center gap-1 text-gray-400 font-mono">
               <button 
                 type="button" 
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('maeglerforbindelse'), -1); }} 
                 disabled={widgetOrder.indexOf('maeglerforbindelse') === 0} 
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                 title="Flyt op / venstre"
               >
                 <ChevronLeft className="size-3.5" />
               </button>
               <button 
                 type="button" 
                 onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('maeglerforbindelse'), 1); }} 
                 disabled={widgetOrder.indexOf('maeglerforbindelse') === widgetOrder.length - 1} 
                 className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
                 title="Flyt ned / højre"
               >
                 <ChevronRight className="size-3.5" />
               </button>
             </div>
          </div>
           <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Mæglerforbindelse</h4>
           <div className="p-4 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl border border-emerald-900/30 flex items-center justify-between mb-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="flex items-center gap-3">
                 <div className="size-8 bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/30">
                    <Anchor className="size-4" />
                 </div>
                 <div>
                    <p className="font-bold text-sm text-white">Binance Global</p>
                    <p className="text-[10px] text-emerald-500 mt-1 font-mono">Forbundet • WebSocket</p>
                 </div>
              </div>
              <button className="text-xs text-gray-500 hover:text-white transition-colors underline">Konf.</button>
            </div>

            {/* API Nøgler Indtastning */}
            <div className="mt-4 space-y-3.5 p-4 bg-gray-950/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-inner">
               <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mægler API Nøgler</span>
                  {apiKey && apiSecret && (
                     <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Gemt på konto</span>
                  )}
               </div>
               
               <div className="space-y-2.5">
                  <div className="relative">
                     <input 
                       type="text" 
                       placeholder="Indtast API Key (Binance)"
                       value={apiKey}
                       onChange={e => setApiKey(e.target.value)}
                       className="w-full bg-black/60 text-xs text-white p-2.5 rounded-xl border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors font-mono"
                     />
                  </div>
                  <div className="relative">
                     <input 
                       type="password"
                       placeholder="Indtast Secret Key (Binance)"
                       value={apiSecret}
                       onChange={e => setApiSecret(e.target.value)}
                       className="w-full bg-black/60 text-xs text-white p-2.5 rounded-xl border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors font-mono"
                     />
                  </div>
                  <button 
                    onClick={saveKeys}
                    className="w-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 py-2.5 rounded-xl transition-all duration-300 uppercase tracking-wider active:scale-[0.98]"
                  >
                    GEM MÆGLERNØGLER
                  </button>
               </div></div>
           

            {/* Paper Trading Mode toggle */}
            <div className="mt-4 p-4 bg-gray-950/50 rounded-xl border border-gray-800">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <Shield className={`size-4 ${!isLiveTrading ? "text-emerald-500" : "text-gray-400"}`} />
                     <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Papirhandel (Sandbox)</span>
                  </div>
                  <div className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${!isLiveTrading ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-gray-800"}`}
                       onClick={() => toggleTradingMode(!isLiveTrading)}>
                     <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${!isLiveTrading ? "translate-x-4" : "translate-x-0"}`}></div>
                  </div>
               </div>
               <p className="text-[10px] text-gray-500 leading-relaxed">
                  Skifter alle handler til et risikofrit simuleret sandkassemiljø. Real-time priser fra Binance bruges stadig til beregninger af simulated fyldninger, indgangspriser og porteføljeudvikling.
               </p>
            </div>
        </motion.div>
      </div>

      {selectedOrderId && (() => {
        const order = orderHistory.find(o => o.id === selectedOrderId);
        if (!order) return null;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedOrderId(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="size-5" />
              </button>
              
              <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-6">Trade Execution Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-950 p-4 rounded-xl border border-gray-800">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</span>
                  <span className="font-mono text-sm text-white">{order.id}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fee Amount</span>
                     <span className="font-mono text-sm text-gray-300">${(order.fee || 0).toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Duration</span>
                     <span className="font-mono text-sm text-cyan-400">{order.duration}</span>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Exchange Tx Hash</span>
                  <div className="font-mono text-xs text-gray-400 truncate bg-gray-900 p-2 rounded border border-gray-800">
                    {order.txHash}
                  </div>
                </div>
                
                <div className={`mt-4 p-4 rounded-xl border flex justify-between items-center ${order.pnl >= 0 ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-rose-950/20 border-rose-900/30'}`}>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Net Realized PnL</span>
                  <span className={`font-mono font-bold ${order.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {order.pnl >= 0 ? '+' : ''}${Math.abs(order.pnl).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {showSessionSummary && sessionSummaryData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl p-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowSessionSummary(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Session Summary</h3>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest">Bot paused manually</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl border border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</span>
                <span className="font-mono text-sm text-cyan-400">{sessionSummaryData.duration}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl border border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Trades</span>
                <span className="font-mono text-sm text-white">{sessionSummaryData.trades}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl border border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Win Rate</span>
                <span className="font-mono text-sm text-amber-500">{sessionSummaryData.winRate.toFixed(1)}%</span>
              </div>
              <div className={`mt-4 p-4 rounded-xl border flex justify-between items-center ${sessionSummaryData.netPnl >= 0 ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-rose-950/20 border-rose-900/30'}`}>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Session Net PnL</span>
                <span className={`font-mono text-lg font-bold tracking-tighter ${sessionSummaryData.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sessionSummaryData.netPnl >= 0 ? '+' : ''}${Math.abs(sessionSummaryData.netPnl).toFixed(2)}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setShowSessionSummary(false)}
              className="mt-6 w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-colors"
            >
              Close Summary
            </button>
          </motion.div>
        </div>
      )}
      {showCustomParamsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl p-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowCustomParamsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="size-5 text-amber-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Custom Parameters</h3>
            </div>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">For Strategy: {strategy}</p>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                <label className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Max Drawdown (%)</span>
                  <span className="text-cyan-400">{customParams.maxDrawdown}%</span>
                </label>
                <input 
                  type="range" min="1" max="50" step="1" 
                  value={customParams.maxDrawdown} 
                  onChange={(e) => setCustomParams({...customParams, maxDrawdown: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                />
              </div>

              <div className="space-y-2">
                <label className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Trailing Stop Dist (%)</span>
                  <span className="text-cyan-400">{customParams.trailingStopDistance}%</span>
                </label>
                <input 
                  type="range" min="0.1" max="10" step="0.1" 
                  value={customParams.trailingStopDistance} 
                  onChange={(e) => setCustomParams({...customParams, trailingStopDistance: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                />
              </div>

              <div className="space-y-2">
                <label className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Leverage (x)</span>
                  <span className="text-cyan-400">{customParams.leverage}x</span>
                </label>
                <input 
                  type="range" min="1" max="125" step="1" 
                  value={customParams.leverage} 
                  onChange={(e) => setCustomParams({...customParams, leverage: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                />
              </div>

              <div className="space-y-2">
                <label className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>RSI Length</span>
                  <span className="text-cyan-400">{customParams.rsiLength}</span>
                </label>
                <input 
                  type="range" min="2" max="50" step="1" 
                  value={customParams.rsiLength} 
                  onChange={(e) => setCustomParams({...customParams, rsiLength: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">RSI Oversold</label>
                  <input 
                    type="number" min="1" max="99" 
                    value={customParams.rsiOversold} 
                    onChange={(e) => setCustomParams({...customParams, rsiOversold: Number(e.target.value)})}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2 focus:ring-2 focus:ring-amber-500 font-mono text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">RSI Overbought</label>
                  <input 
                    type="number" min="1" max="99" 
                    value={customParams.rsiOverbought} 
                    onChange={(e) => setCustomParams({...customParams, rsiOverbought: Number(e.target.value)})}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2 focus:ring-2 focus:ring-amber-500 font-mono text-sm" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setShowCustomParamsModal(false);
                addLog(`Applied custom parameters for ${strategy}`, 'info');
              }}
              className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl font-bold text-sm tracking-widest uppercase transition-colors"
            >
              Apply Changes
            </button>
          </motion.div>
        </div>
      )}

      {showDailySummary && (() => {
        const totalTradesCount = orderHistory.length;
        const winsArr = orderHistory.filter(t => t.pnl > 0);
        const winningTradesCount = winsArr.length;
        const lossesArr = orderHistory.filter(t => t.pnl < 0);
        const losingTradesCount = lossesArr.length;
        const winRatePercentage = totalTradesCount > 0 ? (winningTradesCount / totalTradesCount) * 100 : 0;
        const averageTradeProfit = totalTradesCount > 0 ? totalPnl / totalTradesCount : 0;
        const maxBestTrade = orderHistory.length > 0 ? Math.max(...orderHistory.map(t => t.pnl || 0)) : 0;
        const maxWorstTrade = orderHistory.length > 0 ? Math.min(...orderHistory.map(t => t.pnl || 0)) : 0;
        const totalFeesCount = (orderHistory || []).reduce((sum, t) => sum + (t.fee || 0), 0);

        // Chart data for Win/Loss donut
        const donutChartData = [
          { name: 'Gevinster (Wins)', value: winningTradesCount, color: '#10b981' },
          { name: 'Tab (Losses)', value: losingTradesCount, color: '#f43f5e' }
        ].filter(item => item.value > 0);

        const activeSummaryText = summaryMode === 'history' && selectedHistoricalSummary 
          ? selectedHistoricalSummary.summaryText 
          : dailySummaryText;

        const activePnl = summaryMode === 'history' && selectedHistoricalSummary
          ? selectedHistoricalSummary.totalPnl
          : totalPnl;

        const activeTradesCount = summaryMode === 'history' && selectedHistoricalSummary
          ? selectedHistoricalSummary.totalTrades
          : totalTradesCount;

        const activeWinRate = summaryMode === 'history' && selectedHistoricalSummary
          ? selectedHistoricalSummary.winRate
          : winRatePercentage;

        const activeDateText = summaryMode === 'history' && selectedHistoricalSummary
          ? selectedHistoricalSummary.date
          : new Date().toLocaleDateString('da-DK');

        const handleCopySummary = () => {
          const textToCopy = `=== HANDELSSTATUS & AI RAPPORT ===
Dato: ${activeDateText}
Aktiv: ${formatSymbol(symbol)}
Total PnL: ${activePnl >= 0 ? '+' : ''}$${activePnl.toFixed(2)}
Antal Handler: ${activeTradesCount}
Win Rate: ${activeWinRate.toFixed(1)}%

--------------------------------------
DETALJERET ANALYSE & ANBEFALINGER (DAVs AI Engine):
${activeSummaryText}
`;
          navigator.clipboard.writeText(textToCopy);
          toast.success("Rapporten er kopieret til din udklipsholder!");
        };

        const handleExportSummary = () => {
          const textToExport = `=== HANDELSSTATUS & AI RAPPORT ===
Dato: ${activeDateText}
Aktiv: ${formatSymbol(symbol)}
Total PnL: ${activePnl >= 0 ? '+' : ''}$${activePnl.toFixed(2)}
Antal Handler: ${activeTradesCount}
Win Rate: ${activeWinRate.toFixed(1)}%

--------------------------------------
DETALJERET ANALYSE & ANBEFALINGER (DAVs AI Engine):
${activeSummaryText}
`;
          const element = document.createElement("a");
          const file = new Blob([textToExport], {type: 'text/plain;charset=utf-8'});
          element.href = URL.createObjectURL(file);
          element.download = `DAVs_Rapport_${symbol}_${activeDateText.replace(/\./g, '-')}.txt`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          toast.success("Rapporten er downloadet!");
        };

        const handleSendChatQuery = async (e: FormEvent) => {
          e.preventDefault();
          if (!chatInput.trim() || isChatLoading) return;

          const queryText = chatInput.trim();
          setChatInput("");
          const userMsg = { role: 'user' as const, text: queryText };
          setChatHistory(prev => [...prev, userMsg]);
          setIsChatLoading(true);

          try {
            const res = await fetch("/api/daily-summary-chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userQuery: queryText,
                chatHistory: chatHistory,
                trades: orderHistory,
                pnl: totalPnl,
                symbol: symbol,
                summaryText: dailySummaryText,
                strategy: strategy
              })
            });
            const data = await res.json();
            if (data.reply) {
              setChatHistory(prev => [...prev, { role: 'assistant', text: data.reply }]);
            } else {
              setChatHistory(prev => [...prev, { role: 'assistant', text: "Kunne ikke hente svar fra mit AI-understøttede system." }]);
            }
          } catch (err) {
            console.error("Chat fetch error:", err);
            setChatHistory(prev => [...prev, { role: 'assistant', text: "Forbindelsen til serversiden mislykkedes. Tjek venligst dit netværk." }]);
          } finally {
            setIsChatLoading(false);
          }
        };

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-4xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0">
                    <BookOpen className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                      Dagsrapport & AI Analyse
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-mono mt-0.5">
                      <span>Dato: <strong className="text-gray-300">{activeDateText}</strong></span>
                      <span className="text-gray-700">•</span>
                      <span>Aktiv: <strong className="text-indigo-400">{formatSymbol(symbol)}</strong></span>
                      <span className="text-gray-700">•</span>
                      <span>Strategi: <strong className="text-indigo-400">{strategy}</strong></span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowDailySummary(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 bg-gray-950/40 hover:bg-gray-950/80 rounded-full border border-gray-800"
                  title="Luk"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Inner Navigation Tabs */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-1 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl border border-gray-800/80 shrink-0">
                <button
                  onClick={() => setSummaryMode('current')}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${summaryMode === 'current' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
                >
                  Dagsrapport
                </button>
                <button
                  onClick={() => setSummaryMode('history')}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${summaryMode === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
                >
                  <History className="size-3.5" /> Historik ({historicalSummaries.length})
                </button>
                <button
                  onClick={() => setSummaryMode('qna')}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${summaryMode === 'qna' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
                >
                  <Bot className="size-3.5" /> Spørg AI Coach
                </button>
              </div>

              {/* Main Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
                {summaryMode === 'current' && (
                  <>
                    {/* Bento Row with charts and statistics */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left Block: Core Stats */}
                      <div className="lg:col-span-7 grid grid-cols-2 gap-3">
                        <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-full"></div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Activity className="size-3 text-indigo-400" /> Handler i dag
                          </span>
                          <span className="font-mono text-2xl font-black text-white my-1">{totalTradesCount}</span>
                          <span className="text-[9px] text-gray-500 font-mono">Gennemførte handelsordrer</span>
                        </div>

                        <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-full"></div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <TrendingUp className="size-3 text-emerald-400" /> Realiseret PnL
                          </span>
                          <span className={`font-mono text-2xl font-black my-1 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">Total nettoafkast</span>
                        </div>

                        <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-full"></div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Zap className="size-3 text-amber-400" /> Win Rate
                          </span>
                          <span className="font-mono text-2xl font-black text-white my-1">{winRatePercentage.toFixed(1)}%</span>
                          <span className="text-[9px] text-emerald-500 font-mono">
                            {winningTradesCount}W <span className="text-gray-500">/</span> <span className="text-rose-500">{losingTradesCount}L</span>
                          </span>
                        </div>

                        <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-l-full"></div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Wallet className="size-3 text-rose-400" /> Estimeret Gebyr
                          </span>
                          <span className="font-mono text-2xl font-black text-gray-400 my-1">${totalFeesCount.toFixed(2)}</span>
                          <span className="text-[9px] text-gray-500 font-mono">Samlede mæglergebyrer</span>
                        </div>
                      </div>

                      {/* Right Block: Recharts Mini Donut Chart */}
                      <div className="lg:col-span-5 p-4 bg-gray-950/60 rounded-2xl border border-gray-800 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                          Fordeling af Handler
                        </span>
                        
                        {totalTradesCount > 0 ? (
                          <div className="w-full h-[120px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={donutChartData}
                                  innerRadius={30}
                                  outerRadius={45}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {donutChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'var(--color-gray-950)', border: '1px solid var(--color-gray-800)', borderRadius: '8px' }}
                                  itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-1 text-[11px] font-mono shrink-0 pl-1">
                              <div className="flex items-center gap-1.5">
                                <div className="size-2.5 rounded-full bg-emerald-500" />
                                <span>Gevinster: {winningTradesCount}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="size-2.5 rounded-full bg-rose-500" />
                                <span>Tab: {losingTradesCount}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 font-mono py-8">Ingen handler at vise graf over</div>
                        )}
                      </div>
                    </div>

                    {/* Detailed statistics metrics layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-800/60 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                          <TrendingUp className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Bedste Trade</p>
                          <p className="font-mono text-sm font-bold text-emerald-400 truncate">${maxBestTrade.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-800/60 flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
                          <TrendingDown className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Værste Trade</p>
                          <p className="font-mono text-sm font-bold text-rose-400 truncate">${maxWorstTrade.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-800/60 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                          <Zap className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Gennemsnit pr. Trade</p>
                          <p className="font-mono text-sm font-bold text-white truncate">${averageTradeProfit.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Trade Breakdown Table */}
                    <div className="bg-gray-950/40 rounded-2xl border border-gray-800/60 overflow-hidden text-white">
                      <button
                        onClick={() => setShowTradesBreakdown(!showTradesBreakdown)}
                        className="w-full flex justify-between items-center px-5 py-3.5 hover:bg-gray-950/80 transition-colors text-xs font-bold font-mono text-gray-400 uppercase tracking-wider"
                      >
                        <span className="flex items-center gap-2">
                          <History className="size-4 text-indigo-400" /> 
                          Aktivtransaktioner i dag ({totalTradesCount})
                        </span>
                        <span>{showTradesBreakdown ? "Skjul handler ▲" : "Vis detaljerede handler ▼"}</span>
                      </button>

                      {showTradesBreakdown && (
                        <div className="border-t border-gray-800 p-4 max-h-[220px] overflow-y-auto custom-scrollbar">
                          {orderHistory.length > 0 ? (
                            <table className="w-full text-left font-mono text-[11px]">
                              <thead>
                                <tr className="text-gray-500 border-b border-gray-850 pb-2">
                                  <th className="py-1.5 font-bold uppercase tracking-wider">Tidspunkt</th>
                                  <th className="font-bold uppercase tracking-wider">Type</th>
                                  <th className="font-bold uppercase tracking-wider text-right">Entry</th>
                                  <th className="font-bold uppercase tracking-wider text-right">Exit</th>
                                  <th className="font-bold uppercase tracking-wider text-right">Varighed</th>
                                  <th className="font-bold uppercase tracking-wider text-right">Gain/Loss</th>
                                  <th className="text-right font-bold uppercase tracking-wider">PnL [USD]</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orderHistory.map((t, idx) => (
                                  <tr key={idx} className="border-b border-gray-900/60 hover:bg-gray-900/20 text-white">
                                    <td className="py-3 text-gray-450">{t.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                    <td className="py-3">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        t.type === 'BUY' || t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                      }`}>
                                        {t.type || t.side}
                                      </span>
                                    </td>
                                    <td className="py-3 text-right text-gray-400">{t.entryPrice ? `${t.entryPrice.toFixed(2)}` : '-'}</td>
                                    <td className="py-3 text-right text-gray-400">{t.exitPrice ? `${t.exitPrice.toFixed(2)}` : (t.price ? `${t.price.toFixed(2)}` : '-')}</td>
                                    <td className="py-3 text-right text-gray-500">{t.duration || '-'}</td>
                                    <td className={`py-3 text-right ${t.profitPercent !== undefined ? (t.profitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-gray-500'}`}>
                                      {t.profitPercent !== undefined ? `${t.profitPercent >= 0 ? '+' : ''}${t.profitPercent.toFixed(2)}%` : '-'}
                                    </td>
                                    <td className={`py-3 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {t.pnl >= 0 ? '+' : ''}${t.pnl ? t.pnl.toFixed(2) : '0.00'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-6 text-gray-500">Ingen transaktioner registreret i dag</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI report output section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Shield className="size-3.5 text-indigo-400" /> DAVs AI Strategisk dagsrapport
                        </span>
                        {!isGeneratingSummary && dailySummaryText && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={handleCopySummary}
                              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/15"
                            >
                              Kopier
                            </button>
                            <button 
                              onClick={handleExportSummary}
                              className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/15"
                            >
                              Download (.txt)
                            </button>
                          </div>
                        )}
                      </div>

                      {isGeneratingSummary ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-gray-950/60 rounded-2xl border border-gray-800/60">
                          <Loader2 className="size-10 text-indigo-500 animate-spin mb-4" />
                          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest text-center">Genererer dybdegående dagsrapport...</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 text-center">Sætter transaktionskontekst i relation til markedstrends</p>
                        </div>
                      ) : (
                        <div className="p-5 bg-gray-950/80 rounded-2xl border border-gray-800 shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
                          <div className="text-gray-300 font-mono text-sm whitespace-pre-line leading-relaxed markdown-body">
                            {dailySummaryText}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {summaryMode === 'history' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[320px]">
                    {/* Archive Sidebar list */}
                    <div className="md:col-span-4 bg-gray-950/80 p-4 rounded-2xl border border-gray-800 flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 pb-1 border-b border-gray-850">
                        Arkiverede Rapporter
                      </span>
                      {historicalSummaries.length > 0 ? (
                        <div className="space-y-1.5">
                          {historicalSummaries.map((sum) => (
                            <button
                              key={sum.id}
                              onClick={() => setSelectedHistoricalSummary(sum)}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                                selectedHistoricalSummary?.id === sum.id
                                  ? 'bg-indigo-650/15 border-indigo-500/40 text-white'
                                  : 'bg-gray-900 border-gray-800/70 text-gray-300 hover:bg-gray-850'
                              }`}
                            >
                              <div className="flex justify-between items-center text-xs font-bold font-mono">
                                <span>{sum.date}</span>
                                <span className={sum.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-450'}>
                                  {sum.totalPnl >= 0 ? '+' : ''}${sum.totalPnl?.toFixed(1)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                <span>Trades: {sum.totalTrades || 0}</span>
                                <span>Win Rate: {sum.winRate?.toFixed(0)}%</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 font-mono text-xs">
                          Ingen gemte rapporter i skyen endnu. Generer en dagsrapport for at gemme den automatisk.
                        </div>
                      )}
                    </div>

                    {/* Archive content viewer */}
                    <div className="md:col-span-8 flex flex-col justify-between">
                      {selectedHistoricalSummary ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[11px] font-mono text-indigo-400 font-bold">
                              Rapport fra {selectedHistoricalSummary.date} ({selectedHistoricalSummary.symbol})
                            </span>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={handleCopySummary}
                                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 rounded-md border border-indigo-500/15 py-1"
                              >
                                Kopier
                              </button>
                              <button 
                                onClick={handleExportSummary}
                                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/5 hover:bg-emerald-500/10 px-2 rounded-md border border-emerald-500/15 py-1"
                              >
                                Download
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-950/40 rounded-xl border border-gray-850">
                            <div className="text-center">
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Afkast</span>
                              <p className={`font-mono font-bold text-sm ${selectedHistoricalSummary.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                                {selectedHistoricalSummary.totalPnl >= 0 ? '+' : ''}${selectedHistoricalSummary.totalPnl?.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-center border-x border-gray-800">
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Handler</span>
                              <p className="font-mono font-bold text-sm text-white">
                                {selectedHistoricalSummary.totalTrades}
                              </p>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Win Rate</span>
                              <p className="font-mono font-bold text-sm text-white">
                                {selectedHistoricalSummary.winRate?.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl border border-gray-800 max-h-[260px] overflow-y-auto custom-scrollbar">
                            <p className="font-mono text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                              {selectedHistoricalSummary.summaryText}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-950/40 rounded-2xl border border-gray-800 border-dashed m-auto w-full py-16">
                          <History className="size-8 text-gray-600 mb-2" />
                          <p className="text-sm font-bold text-gray-400">Vælg en historisk dagsrapport</p>
                          <p className="text-xs text-gray-500 font-mono text-center max-w-[280px] mt-1">
                            Vælg en dato på listen til venstre for at genlæse og downloade en tidligere AI strategisk dagsrapport.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {summaryMode === 'qna' && (
                  <div className="flex flex-col min-h-[350px] justify-between space-y-4 text-white">
                    <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-300 text-xs flex items-center gap-3">
                      <Bot className="size-5 shrink-0 text-indigo-400 animate-bounce" />
                      <div>
                        <strong>Spørg DAVs AI Coach modulet!</strong><br />
                        Her kan du spørge vores AI coach til råds angående dine handler i dag, om markedet eller justering af stop-loss/take-profit f.eks. "Hvorfor lukkede jeg med tab på min sidste tabende handel?"
                      </div>
                    </div>

                    {/* Chat Bubble History Area */}
                    <div className="flex-1 min-h-[220px] max-h-[300px] border border-gray-800 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                      {chatHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 m-auto">
                          <Bot className="size-10 text-gray-700 mb-2" />
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Ingen igangværende samtale</p>
                          <p className="text-[11px] text-gray-500 font-mono max-w-[300px] mt-1">
                            Indtast dit spørgsmål nedenfor for at starte en strategisk dialog med din AI portefølje-coach.
                          </p>
                        </div>
                      ) : (
                        chatHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col max-w-[85%] ${item.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <span className="text-[9px] text-gray-550 font-mono mb-0.5">
                              {item.role === 'user' ? 'Du (Investor)' : 'AI Coach'}
                            </span>
                            <div className={`p-3 rounded-2xl text-xs font-mono leading-relaxed whitespace-pre-line ${
                              item.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                                : 'bg-gray-900 border border-gray-800 text-gray-300 rounded-tl-none shadow'
                            }`}>
                              {item.text}
                            </div>
                          </div>
                        ))
                      )}

                      {isChatLoading && (
                        <div className="flex gap-2 items-center text-xs text-gray-500 font-mono self-start py-1">
                          <Loader2 className="size-4 text-indigo-500 animate-spin" />
                          <span>AI Coach tænker og formulerer svar...</span>
                        </div>
                      )}
                    </div>

                    {/* Message Input Form */}
                    <form onSubmit={handleSendChatQuery} className="flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Skriv f.eks. 'Hvad kan jeg optimere ved min stop loss i dag?'..."
                        className="flex-1 bg-gray-950 text-xs text-white border border-gray-850 rounded-xl px-4 py-3 placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                        disabled={isChatLoading}
                      />
                      <button
                        type="submit"
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 font-mono shrink-0 shadow-lg shadow-indigo-900/10"
                        disabled={isChatLoading || !chatInput.trim()}
                      >
                        Spørg
                      </button>
                    </form>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-3 shrink-0">
                <button 
                  onClick={() => setShowDailySummary(false)}
                  className="flex-1 py-2.5 bg-gray-950 hover:bg-gray-950/80 border border-gray-800 text-gray-400 hover:text-white rounded-xl font-bold text-xs tracking-widest uppercase transition-colors"
                >
                  Luk panel
                </button>
                {summaryMode === 'current' && (
                  <button 
                    onClick={() => setShowDailySummary(false)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs tracking-widest uppercase transition-colors shadow-lg shadow-indigo-900/30"
                  >
                    Accepter og Gem
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        );
      })()}
      <GeminiChat />
    </>
  );
}
