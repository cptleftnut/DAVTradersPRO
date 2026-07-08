import React, { useState, useEffect, useCallback } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { SalesPage } from "./components/SalesPage";
import { BinanceTradingPanel } from "./components/BinanceTradingPanel";
import { TradeDiagnostics } from "./components/TradeDiagnostics";
import { BacktestWidget } from "./components/BacktestWidget";
import { SessionSummaryWidget } from "./components/SessionSummaryWidget";
import { OnboardingTour } from "./components/OnboardingTour";
import { OrderBook } from "./components/OrderBook";
import { PortfolioDistribution } from "./components/PortfolioDistribution";
import { PerformanceTrend } from "./components/PerformanceTrend";
import { MarketOverview } from "./components/MarketOverview";
import { MarketSummary } from "./components/MarketSummary";
import { DailyPerformanceMetric } from "./components/DailyPerformanceMetric";
import { CumulativeProfitChart } from "./components/CumulativeProfitChart";
import { TradeHistoryTable } from "./components/TradeHistoryTable";
import { FeeAnalysisChart } from "./components/FeeAnalysisChart";
import { RebalanceSuggestion } from "./components/RebalanceSuggestion";
import { PriceAlerts } from "./components/PriceAlerts";
import { TradeVelocityGauge } from "./components/TradeVelocityGauge";
import { FearAndGreedIndex } from "./components/FearAndGreedIndex";
import { SystemHealthMonitor } from "./components/SystemHealthMonitor";
import { GeminiChat } from "./components/GeminiChat";
import { AuditTrail } from "./components/AuditTrail";
import { QuickActionsMenu } from "./components/QuickActionsMenu";
import { initAuth } from "./lib/auth";
import { User } from "firebase/auth";
import { useTheme } from "./lib/ThemeContext";
import { Toaster, toast } from "sonner";
import { 
  Loader2, Palette, GripVertical, RotateCcw, Menu, X, Sun, Moon, Monitor, ChevronDown,
  LayoutGrid, LayoutList, Activity, TrendingUp, Percent, Zap, Gauge, Bell, RefreshCw, ArrowUpRight, PieChart, Layers, FileText, DollarSign,
  ShieldCheck, Sparkles
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from "motion/react";

function SortableItem({ id, children, ...props }: { id: string, children: React.ReactNode, [key: string]: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div id={`widget-container-${id}`} ref={setNodeRef} style={style} className="relative transition-all duration-300" layout>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 cursor-grab p-1 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
      >
        <GripVertical className="size-4 text-gray-400" />
      </div>
      {children}
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const { themeMode, theme, setThemeMode, toggleTheme } = useTheme();
  const DEFAULT_ITEMS = ['SessionSummaryWidget', 'BacktestWidget', 'TradeDiagnostics', 'SystemHealthMonitor', 'AuditTrail', 'DailyPerformanceMetric', 'CumulativeProfitChart', 'MarketSentiment', 'TradeVelocityGauge', 'PriceAlerts', 'RebalanceSuggestion', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable', 'FeeAnalysisChart'];
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const [isCompactView, setIsCompactView] = useState<boolean>(() => {
    return localStorage.getItem('dashboard_compact_view') !== 'false';
  });
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  const [tradeLogs, setTradeLogs] = useState<{time: string, msg: string, type: 'info'|'warn'|'error'}[]>([]);

  const compactWidgetsData: Record<string, { title: string; icon: string; val: string; sub: string; color: string; badge?: string }> = {
    SystemHealthMonitor: {
      title: "System Health",
      icon: "Activity",
      val: "76 ms",
      sub: "Alle tjenester online",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
      badge: "LIVE"
    },
    AuditTrail: {
      title: "Revisionsspor",
      icon: "ShieldCheck",
      val: "Sikker",
      sub: "Revisionslogge intakt",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
      badge: "SECURE"
    },
    DailyPerformanceMetric: {
      title: "Dags PnL",
      icon: "TrendingUp",
      val: "+$184.20",
      sub: "+2.48% i dag",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
      badge: "+2.4%"
    },
    CumulativeProfitChart: {
      title: "Akkumuleret ROI",
      icon: "Percent",
      val: "+18.42%",
      sub: "30 dages profit",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
    },
    MarketSentiment: {
      title: "Sentiment",
      icon: "Zap",
      val: "72 / Grådig",
      sub: "Fear & Greed Index",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/25"
    },
    TradeVelocityGauge: {
      title: "Handels-hastighed",
      icon: "Gauge",
      val: "1.2 ordrer/m",
      sub: "Normal hastighed",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/25"
    },
    PriceAlerts: {
      title: "Prisalarmer",
      icon: "Bell",
      val: "3 Alarmer",
      sub: "Aktiv overvågning",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
      badge: "AKTIV"
    },
    RebalanceSuggestion: {
      title: "Afbalancering",
      icon: "RefreshCw",
      val: "78% Match",
      sub: "1 nyt forslag",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/25"
    },
    PerformanceTrend: {
      title: "Historisk Trend",
      icon: "ArrowUpRight",
      val: "Bullish",
      sub: "Opadgående trend",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
    },
    PortfolioDistribution: {
      title: "Allokering",
      icon: "PieChart",
      val: "BTC (55%)",
      sub: "Diversificeret",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25"
    },
    OrderBook: {
      title: "Ordrebog",
      icon: "Layers",
      val: "0.01% Spread",
      sub: "Høj likviditet",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
    },
    TradeHistoryTable: {
      title: "Ordrehistorik",
      icon: "FileText",
      val: "300+ ordrer",
      sub: "Sidste: KØB SOL",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/25"
    },
    FeeAnalysisChart: {
      title: "Gebyr-analyse",
      icon: "DollarSign",
      val: "$142.50",
      sub: "Sparret på gebyrer",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
      badge: "SPARRET"
    }
  };

  const getCompactIcon = (iconName: string) => {
    switch(iconName) {
      case 'Activity': return <Activity className="size-4" />;
      case 'ShieldCheck': return <ShieldCheck className="size-4" />;
      case 'TrendingUp': return <TrendingUp className="size-4" />;
      case 'Percent': return <Percent className="size-4" />;
      case 'Zap': return <Zap className="size-4" />;
      case 'Gauge': return <Gauge className="size-4" />;
      case 'Bell': return <Bell className="size-4" />;
      case 'RefreshCw': return <RefreshCw className="size-4" />;
      case 'ArrowUpRight': return <ArrowUpRight className="size-4" />;
      case 'PieChart': return <PieChart className="size-4" />;
      case 'Layers': return <Layers className="size-4" />;
      case 'FileText': return <FileText className="size-4" />;
      case 'DollarSign': return <DollarSign className="size-4" />;
      default: return <Activity className="size-4" />;
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setAuthLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    if (String(msg).includes('Failed to fetch')) return;
    setTradeLogs(prev => [{ time: new Date().toISOString(), msg, type }, ...prev].slice(0, 100));
    if (type === 'error') toast.error(msg);
    else if (type === 'warn') toast.warning(msg);
    else toast.info(msg);
  }, []);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="size-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthScreen onLogin={setUser} />;
    }
    return <SalesPage onGoToPlatform={() => setShowAuth(true)} />;
  }

  const componentsMap: Record<string, React.ReactNode> = {
    DailyPerformanceMetric: <DailyPerformanceMetric />,
    SystemHealthMonitor: <SystemHealthMonitor />,
    AuditTrail: <AuditTrail />,
    CumulativeProfitChart: <CumulativeProfitChart />,
    MarketOverview: <MarketOverview />,
    BinanceTradingPanel: <BinanceTradingPanel addLog={addLog} />,
    PerformanceTrend: <PerformanceTrend />,
    PortfolioDistribution: <PortfolioDistribution />,
    OrderBook: <OrderBook />,
    TradeHistoryTable: <TradeHistoryTable />,
    FeeAnalysisChart: <FeeAnalysisChart />,
    RebalanceSuggestion: <RebalanceSuggestion />,
    PriceAlerts: <PriceAlerts />,
    TradeVelocityGauge: <TradeVelocityGauge />,
    MarketSentiment: <FearAndGreedIndex />,
    TradeDiagnostics: <TradeDiagnostics logs={[]} />,
    BacktestWidget: <BacktestWidget />,
    SessionSummaryWidget: <SessionSummaryWidget />
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100">
      <button 
        onClick={() => {
          window.dispatchEvent(new CustomEvent('start-onboarding-tour'));
        }}
        className="fixed top-4 right-40 z-[100] p-2 bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg text-gray-400 hover:text-white flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 cursor-pointer shadow-md hover:border-gray-700 hover:bg-gray-800 animate-fade-in"
        title="Start Rundvisning"
      >
        <Sparkles className="size-4 text-amber-400" />
        <span>Rundvisning</span>
      </button>
      <button 
        onClick={() => setItems(DEFAULT_ITEMS)}
        className="fixed top-4 right-28 z-[100] p-2 bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg text-gray-400 hover:text-white"
        title="Reset Layout"
      >
        <RotateCcw className="size-5" />
      </button>
      {/* Theme Selection Dropdown Menu */}
      <div className="fixed top-4 right-4 z-[100]">
        <button 
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="p-2 bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg text-gray-400 hover:text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:border-gray-700"
          title={`Tema: ${themeMode === 'system' ? 'System Standard' : themeMode === 'light' ? 'Lyst' : 'Mørkt'}`}
        >
          {themeMode === 'system' && <Monitor className="size-5 text-amber-500" />}
          {themeMode === 'light' && <Sun className="size-5 text-amber-500" />}
          {themeMode === 'dark' && <Moon className="size-5 text-amber-500" />}
          <ChevronDown className="size-3 text-gray-500" />
        </button>

        {showThemeMenu && (
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setShowThemeMenu(false)} />
            <div className="absolute right-0 mt-2 w-44 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-xl shadow-2xl p-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-155">
              <button
                onClick={() => {
                  setThemeMode('system');
                  setShowThemeMenu(false);
                  toast.success('System Standard aktiveret', {
                    description: 'Temaet synkroniseres nu automatisk med dit styresystem.'
                  });
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                  themeMode === 'system' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50 border border-transparent'
                }`}
              >
                <Monitor className="size-4" />
                <span>System Standard</span>
              </button>
              <button
                onClick={() => {
                  setThemeMode('light');
                  setShowThemeMenu(false);
                  toast.success('Lyst tema aktiveret');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                  themeMode === 'light' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50 border border-transparent'
                }`}
              >
                <Sun className="size-4" />
                <span>Lyst tema</span>
              </button>
              <button
                onClick={() => {
                  setThemeMode('dark');
                  setShowThemeMenu(false);
                  toast.success('Mørkt tema aktiveret');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                  themeMode === 'dark' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50 border border-transparent'
                }`}
              >
                <Moon className="size-4" />
                <span>Mørkt tema</span>
              </button>
            </div>
          </>
        )}
      </div>
      <Toaster 
        position="top-right" 
        theme={theme === "light" ? "light" : "dark"} 
        visibleToasts={1} 
        duration={1000}
        toastOptions={{
          style: {
            background: 'rgba(5, 5, 5, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#e5e7eb',
            fontSize: '10px',
            fontFamily: 'monospace',
            borderRadius: '9999px',
            padding: '5px 12px',
            minHeight: '24px',
            height: 'auto',
            maxWidth: '240px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }
        }}
      />
      <MarketSummary />
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Mobile Sidebar Toggle & Compact Grid Controls */}
        <div className="lg:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-gray-900/40 border border-white/5 p-4 rounded-2xl">
          <div className="text-left">
            <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <LayoutGrid className="size-3.5 text-amber-500" />
              Kontrolpanel & Widgets
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Styr dine analyser, statistikker og robotovervågning.</p>
          </div>
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {isSidebarOpen && (
              <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    setIsCompactView(true);
                    localStorage.setItem('dashboard_compact_view', 'true');
                    toast.success('Kompakt Grid aktiveret', { description: 'Widgets vises nu som en række af korthoveder.' });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    isCompactView 
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 font-black shadow-md' 
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  <LayoutGrid className="size-3" />
                  Grid
                </button>
                <button
                  onClick={() => {
                    setIsCompactView(false);
                    localStorage.setItem('dashboard_compact_view', 'false');
                    toast.success('Fuld listevisning aktiveret');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    !isCompactView 
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 font-black shadow-md' 
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  <LayoutList className="size-3" />
                  Liste
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {isSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              {isSidebarOpen ? 'Skjul Widgets' : 'Vis Widgets'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {componentsMap['BinanceTradingPanel']}
          </div>

          {/* Sidebar */}
          <div className={`lg:w-[350px] xl:w-[400px] flex-shrink-0 space-y-6 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
            {isSidebarOpen && isCompactView ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 lg:hidden">
                {items.map(id => {
                  const data = compactWidgetsData[id] || { title: id, icon: 'Activity', val: 'Aktiv', sub: 'Kører i baggrunden', color: 'text-gray-400 bg-gray-500/10', badge: undefined };
                  return (
                    <motion.div
                      key={id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setExpandedWidgetId(id);
                      }}
                      className="group cursor-pointer bg-black/40 border border-white/10 hover:border-amber-500/30 p-3.5 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden transition-all duration-300 shadow-md min-h-[110px]"
                    >
                      {/* Ambient micro-glow */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] group-hover:bg-amber-500/5 rounded-full blur-xl pointer-events-none transition-all duration-300"></div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-1.5 rounded-lg border shrink-0 ${data.color}`}>
                          {getCompactIcon(data.icon)}
                        </div>
                        {data.badge && (
                          <span className="text-[7px] font-mono font-bold bg-white/5 text-gray-300 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            {data.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate mb-0.5">
                          {data.title}
                        </h4>
                        <div className="flex items-baseline gap-1">
                          <p className="text-sm font-black font-mono text-white truncate">
                            {data.val}
                          </p>
                        </div>
                        <p className="text-[8px] text-gray-500 truncate mt-0.5 leading-tight">
                          {data.sub}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={items}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6">
                    {items.map(id => (
                      <SortableItem key={id} id={id}>
                        {componentsMap[id]}
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
      <GeminiChat />
      <QuickActionsMenu />

      {/* Fullscreen Overlay Modal for Compact View Widget Details */}
      <AnimatePresence>
        {expandedWidgetId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedWidgetId(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-xl"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg max-h-[85vh] bg-gray-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-[160]"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border ${compactWidgetsData[expandedWidgetId]?.color || 'text-cyan-400 bg-cyan-500/10'}`}>
                    {getCompactIcon(compactWidgetsData[expandedWidgetId]?.icon || 'Activity')}
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                      {compactWidgetsData[expandedWidgetId]?.title || expandedWidgetId}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-0.5">Detaljeret widget-data og realtids grafer.</p>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedWidgetId(null)}
                  className="p-1.5 hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left custom-scrollbar">
                {componentsMap[expandedWidgetId]}
              </div>

              {/* Footer info */}
              <div className="p-3 border-t border-white/5 bg-black/40 text-center text-[8px] font-mono text-gray-500">
                Luk dette panel ved at klikke udenfor eller trykke på krydset.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <OnboardingTour onSidebarToggle={setIsSidebarOpen} />
    </div>
  );
}
