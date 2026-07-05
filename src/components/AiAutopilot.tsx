import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Zap, Shield, Rocket, Activity, Settings, BarChart, ChevronRight, CheckCircle2, XCircle, BrainCircuit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { speakTradeAction } from '../lib/speech';
import { logAuditEvent } from '../lib/auditLogger';

export const AiAutopilot = React.memo(function AiAutopilot({ symbol = 'BTCUSDT', onSymbolChange }: { symbol?: string, onSymbolChange?: (symbol: string) => void }) {
  const [isActive, setIsActive] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [autoRotatePairs, setAutoRotatePairs] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [strategy, setStrategy] = useState('scalping');
  const [logs, setLogs] = useState<{ time: string, message: string, type?: 'info'|'success'|'warning' }>([
    { time: new Date().toLocaleTimeString(), message: 'System initialized. Ready for automation.', type: 'info' }
  ]);
  const [signals, setSignals] = useState<{ id: string, symbol: string, type: 'BUY' | 'SELL', confidence: number, price: string }[]>([]);
  
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecast, setForecast] = useState<any>(null);

  const runForecast = async () => {
    setIsForecasting(true);
    setForecast(null);
    try {
      const res = await fetch('/api/bot/ml-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: symbol, timeRange: '1 Week' })
      });
      const data = await res.json();
      if (res.ok) {
         setForecast(data);
         toast.success('ML Prognose genereret');
      } else {
         toast.error(data.error || 'Fejl under prognose');
      }
    } catch (e) {
      toast.error('Netværksfejl under prognose');
    } finally {
      setIsForecasting(false);
    }
  };

  const toggleAutopilot = async () => {
    try {
      const res = await fetch('/api/bot/state');
      if (res.ok) {
        const state = await res.json();
        if (state.maintenanceMode) {
          setMaintenanceActive(true);
          setIsActive(false);
          toast.error("Systemet er i vedligeholdelsestilstand. Du kan ikke aktivere trading robotter lige nu.");
          return;
        }
      }
    } catch (e) {}

    if (maintenanceActive) {
      toast.error("Systemet er i vedligeholdelsestilstand. Du kan ikke aktivere trading robotter lige nu.");
      return;
    }

    const nextActive = !isActive;
    setIsActive(nextActive);
    const newLog = {
      time: new Date().toLocaleTimeString(),
      message: nextActive ? `AI Autopilot ENABLED. Risk: ${riskLevel.toUpperCase()}, Strategy: ${strategy.toUpperCase()}` : 'AI Autopilot DISABLED. Entering manual mode.',
      type: nextActive ? ('success' as const) : ('warning' as const)
    };
    setLogs([newLog, ...logs]);

    logAuditEvent({
      type: 'config',
      action: nextActive ? 'AUTOPILOT_BOT_START' : 'AUTOPILOT_BOT_STOP',
      details: nextActive 
        ? `AI Autopilot blev startet for ${symbol}. Risiko: ${riskLevel.toUpperCase()}, Strategi: ${strategy.toUpperCase()}.`
        : `AI Autopilot blev deaktiveret for ${symbol}. Systemet overgik til manuel tilstand.`,
      status: nextActive ? 'success' : 'warning',
      user: 'Bruger'
    });

    if (nextActive) {
      toast.success('AI Autopilot Aktiveret');
    } else {
      toast.info('AI Autopilot Deaktiveret');
      setSignals([]);
    }
  };

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/bot/state');
        if (res.ok) {
          const state = await res.json();
          if (state.maintenanceMode) {
            setMaintenanceActive(true);
            setIsActive(false);
          } else {
            setMaintenanceActive(false);
          }
        }
      } catch (err) {
        console.error("Fejl ved vedligeholdelsestjek i Copilot:", err);
      }
    };
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDC', 'DOGEUSDT', 'XRPUSDT'];
        const types: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
        const newSignal = {
          id: Math.random().toString(36).substring(7),
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          type: types[Math.floor(Math.random() * types.length)],
          confidence: Math.floor(Math.random() * 20) + 80,
          price: (Math.random() * 1000 + 50).toFixed(2)
        };
        
        setSignals(prev => [newSignal, ...prev].slice(0, 3));
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), message: `Identified ${newSignal.type} opportunity on ${newSignal.symbol} (Confidence: ${newSignal.confidence}%)`, type: 'info' }, ...prev].slice(0, 50));
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !autoRotatePairs) return;
    
    const scanMarkets = async () => {
      setIsScanning(true);
      try {
        const res = await fetch('/api/market/scan');
        const data = await res.json();
        if (data.success && data.recommendedSymbol) {
          if (data.recommendedSymbol !== symbol) {
             setLogs(prev => [{ time: new Date().toLocaleTimeString(), message: `Market scan found better pair: ${data.recommendedSymbol} (${data.priceChangePercent}%). Switching context...`, type: 'info' }, ...prev].slice(0, 50));
             if (onSymbolChange) {
                onSymbolChange(data.recommendedSymbol);
                // Also update bot on backend
                fetch('/api/bot/update', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ symbol: data.recommendedSymbol })
                }).catch(() => {});
                toast.success(`Copilot switched pair to ${data.recommendedSymbol}`);
             }
           }
        }
      } catch (e) {
        console.error("Market scan failed", e);
      } finally {
        setIsScanning(false);
      }
    };
    
    // Scan immediately and then every 2 minutes
    scanMarkets();
    const interval = setInterval(scanMarkets, 120000);
    
    return () => clearInterval(interval);
  }, [isActive, autoRotatePairs, symbol, onSymbolChange]);

  const approveSignal = (id: string, symbol: string, type: string) => {
    setSignals(prev => prev.filter(s => s.id !== id));
    if (type === 'SELL') {
      toast.success(`Trade Executed: ${type} ${symbol}`);
      speakTradeAction(type);
    }
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), message: `EXECUTED: ${type} ${symbol}`, type: 'success' }, ...prev]);

    logAuditEvent({
      type: 'trade',
      action: 'CO_PILOT_TRADE_EXECUTED',
      details: `Godkendt handelsordre eksekveret via AI Copilot: ${type} ${symbol} til markedspris.`,
      status: 'success',
      user: 'AI Copilot'
    });
  };

  const rejectSignal = (id: string) => {
    const targetSignal = signals.find(s => s.id === id);
    setSignals(prev => prev.filter(s => s.id !== id));

    logAuditEvent({
      type: 'trade',
      action: 'CO_PILOT_TRADE_REJECTED',
      details: `Foreslået handelsordre for ${targetSignal?.type || 'ORDRE'} ${targetSignal?.symbol || ''} (ID: ${id}) blev manuelt afvist.`,
      status: 'warning',
      user: 'Bruger'
    });
  };

  return (
    <div className="h-full space-y-6 pb-20">
      <div className="flex flex-col md:flex-row gap-6 h-full">
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${isActive ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-gray-800'}`}></div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase mb-6 flex items-center justify-between">
              <span className="text-gray-100">Trade Copilot</span>
              <Bot className={`size-6 ${isActive ? 'text-emerald-500 animate-pulse' : 'text-gray-600'}`} />
            </h2>
            
            {maintenanceActive ? (
              <div id="copilot-locked-warning" className="w-full py-4 px-2 rounded-xl font-bold uppercase tracking-widest text-[11px] text-center bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-pulse">
                ⚠️ Låst pga. Vedligeholdelse
              </div>
            ) : (
              <button 
                id="toggle-copilot-btn"
                onClick={toggleAutopilot}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all cursor-pointer ${isActive ? 'bg-rose-500/20 text-rose-500 border border-rose-500/50 hover:bg-rose-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/60'}`}
              >
                {isActive ? 'Stop AI Copilot' : 'Start AI Copilot'}
              </button>
            )}

            <div className="mt-8 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Risk Tolerance</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button 
                      key={level}
                      onClick={() => {
                        setRiskLevel(level as any);
                        logAuditEvent({
                          type: 'config',
                          action: 'AUTOPILOT_RISK_CHANGED',
                          details: `AI Autopilot risikoniveau ændret fra ${riskLevel.toUpperCase()} til ${level.toUpperCase()}.`,
                          status: 'info',
                          user: 'Bruger'
                        });
                      }}
                      disabled={isActive}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${riskLevel === level ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-950 border-gray-900 text-gray-500 hover:text-gray-300'} disabled:opacity-50`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Core Strategy</label>
                <select 
                  value={strategy}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStrategy(val);
                    logAuditEvent({
                      type: 'config',
                      action: 'AUTOPILOT_STRATEGY_CHANGED',
                      details: `AI Autopilot handelsstrategi ændret til ${val.toUpperCase()}.`,
                      status: 'info',
                      user: 'Bruger'
                    });
                  }}
                  disabled={isActive}
                  className="w-full bg-gray-950 border border-gray-900 rounded-lg p-3 text-sm font-mono text-gray-300 outline-none focus:border-amber-500 disabled:opacity-50 mb-4"
                >
                  <option value="scalping">HFT Scalping (1m-5m)</option>
                  <option value="momentum">Momentum Trend (15m-1h)</option>
                  <option value="arbitrage">Statistical Arbitrage</option>
                  <option value="mean_reversion">Mean Reversion</option>
                </select>

                <label className="flex items-center justify-between cursor-pointer group mt-4">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors" title="Skift automatisk til den mest volatile trading pair på markedet">Auto-Rotate Trading Pairs</span>
                   <div className={`relative w-8 h-4 rounded-full transition-colors ${autoRotatePairs ? 'bg-amber-500' : 'bg-gray-800'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={autoRotatePairs} 
                        onChange={() => {
                          const nextVal = !autoRotatePairs;
                          setAutoRotatePairs(nextVal);
                          logAuditEvent({
                            type: 'config',
                            action: 'AUTOPILOT_AUTO_ROTATE_CHANGED',
                            details: `Auto-Rotate Trading Pairs blev ${nextVal ? 'aktiveret' : 'deaktiveret'}.`,
                            status: 'info',
                            user: 'Bruger'
                          });
                        }} 
                        disabled={isActive} 
                      />
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRotatePairs ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex-1">
             <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                <Settings className="size-4" /> Copilot Parametre
             </h3>
             <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-2">
                   <span className="text-gray-500 font-mono">Max Drawdown</span>
                   <span className="text-gray-300 font-bold">5.0%</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-2">
                   <span className="text-gray-500 font-mono">Target Profit</span>
                   <span className="text-gray-300 font-bold">3.5%</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-2">
                   <span className="text-gray-500 font-mono">Approval Mode</span>
                   <span className="text-emerald-400 font-bold">Manual</span>
                </div>
             </div>

             <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="size-4 text-purple-500" /> ML Prognose
                </div>
                <button onClick={runForecast} className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300 transition-colors">
                    <RefreshCw className={`size-3.5 ${isForecasting ? 'animate-spin' : ''}`} />
                </button>
             </h3>
             
             {isForecasting ? (
                 <div className="flex justify-center items-center py-6">
                    <div className="animate-pulse text-xs text-purple-500 font-mono uppercase tracking-widest">Analyserer via ML model...</div>
                 </div>
             ) : forecast ? (
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Tendens</span>
                        <span className={`text-sm font-bold uppercase ${forecast.prediction === 'bullish' ? 'text-emerald-400' : forecast.prediction === 'bearish' ? 'text-rose-400' : 'text-gray-400'}`}>
                            {forecast.prediction}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">ML Confidence</span>
                        <span className="text-sm font-mono text-purple-400">{forecast.confidence}%</span>
                    </div>
                    {forecast.targetPrice && (
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Estimeret Mål</span>
                            <span className="text-sm font-mono text-gray-200">${forecast.targetPrice}</span>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-400 leading-relaxed pt-2 border-t border-gray-800/50">
                        {forecast.reasoning}
                    </p>
                 </div>
             ) : (
                 <div className="text-center py-4 border border-dashed border-gray-800 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Ingen data for {symbol}</p>
                    <button onClick={runForecast} className="mt-2 text-xs text-purple-400 hover:text-purple-300">Kør analyse nu</button>
                 </div>
             )}
          </div>
        </div>

        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl min-h-[220px] flex flex-col relative overflow-hidden">
             <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2 relative z-20">
                <Shield className="size-4" /> AI Trade Proposals
             </h3>
             
             {isActive ? (
                <div className="flex-1 z-20 space-y-3 font-mono">
                  <AnimatePresence>
                    {signals.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-32 text-gray-500">
                         <span className="relative flex h-3 w-3 mb-3">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                         </span>
                         <p className="text-xs uppercase tracking-widest">Afventer markedsmuligheder...</p>
                      </motion.div>
                    ) : (
                      signals.map((signal) => (
                        <motion.div 
                          key={signal.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-gray-950 border border-gray-800 rounded-xl p-3 flex items-center justify-between"
                        >
                           <div className="flex items-center gap-4">
                             <div className={`px-2 py-1 rounded text-xs font-bold ${signal.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                               {signal.type}
                             </div>
                             <div>
                                <div className="text-gray-200 font-bold">{signal.symbol}</div>
                                <div className="text-[10px] text-gray-500">Pris: ${signal.price} &bull; Conf: {signal.confidence}%</div>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <button onClick={() => approveSignal(signal.id, signal.symbol, signal.type)} className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors" title="Approve Trade">
                               <CheckCircle2 className="size-5" />
                             </button>
                             <button onClick={() => rejectSignal(signal.id)} className="p-2 hover:bg-gray-800 text-gray-500 rounded-lg transition-colors" title="Dismiss">
                               <XCircle className="size-5" />
                             </button>
                           </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
             ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                   <Shield className="size-10 text-gray-700 mx-auto mb-2 opacity-50" />
                   <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Copilot Offline</p>
                </div>
             )}
             
             {isActive && (
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                   <Activity className="size-32 text-emerald-500" />
                </div>
             )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
               <Activity className="size-4" /> Operations Log
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className={`flex items-start gap-4 p-2 bg-gray-950/50 rounded-lg border border-gray-800/50 ${log.type === 'success' ? 'border-l-2 border-l-emerald-500' : log.type === 'warning' ? 'border-l-2 border-l-rose-500' : 'border-l-2 border-l-transparent'}`}>
                  <span className="text-gray-600 whitespace-nowrap">{log.time}</span>
                  <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-rose-400' : 'text-gray-400'}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});


