import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Activity, AlertTriangle, CheckCircle2, ShieldAlert, Terminal, RefreshCw } from 'lucide-react';

interface DiagnosticData {
  isActive: boolean;
  wsStatus: string;
  lastError?: string;
  lastErrorTime?: number;
  isLiveTrading: boolean;
  allocation: number;
  recentErrors: any[];
  symbol: string;
  reconnectCount: number;
  lastHeartbeat: number;
}

export function TradeDiagnosticModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bot/diagnostics');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const int = setInterval(fetchDiagnostics, 5000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2 text-rose-400">
             <ShieldAlert className="size-5" />
             <h2 className="font-bold tracking-wider uppercase text-sm">System Diagnostics & Fejllogs</h2>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={fetchDiagnostics} className="text-gray-400 hover:text-white transition-colors" title="Opdater">
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
               <X className="size-5" />
             </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
           {/* System Health */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex flex-col gap-1">
                 <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">WebSocket</span>
                 <div className="flex items-center gap-1.5">
                    {data?.wsStatus === 'connected' ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Activity className="size-4 text-amber-500 animate-pulse" />}
                    <span className={`text-xs font-mono ${data?.wsStatus === 'connected' ? 'text-emerald-400' : 'text-amber-500'}`}>{data?.wsStatus || 'Unknown'}</span>
                 </div>
              </div>
              <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex flex-col gap-1">
                 <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Bot Status</span>
                 <div className="flex items-center gap-1.5">
                    {data?.isActive ? <CheckCircle2 className="size-4 text-emerald-400" /> : <AlertTriangle className="size-4 text-rose-400" />}
                    <span className={`text-xs font-mono ${data?.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>{data?.isActive ? 'Aktiv' : 'Stoppet'}</span>
                 </div>
              </div>
              <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex flex-col gap-1">
                 <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Miljø</span>
                 <span className={`text-xs font-mono ${data?.isLiveTrading ? 'text-rose-400' : 'text-indigo-400'}`}>{data?.isLiveTrading ? 'Live Trading' : 'Paper Trading'}</span>
              </div>
              <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex flex-col gap-1">
                 <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Symbol</span>
                 <span className="text-xs font-mono text-gray-300">{data?.symbol || '-'}</span>
              </div>
           </div>

           {/* Latest Error */}
           {data?.lastError && (
             <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                   <AlertTriangle className="size-5 text-rose-400 shrink-0 mt-0.5" />
                   <div>
                      <h4 className="text-rose-400 font-bold text-sm mb-1">Seneste System Fejl</h4>
                      <p className="text-rose-200 text-xs font-mono leading-relaxed">{data.lastError}</p>
                      {data.lastErrorTime && (
                         <p className="text-rose-500 text-[10px] mt-2 font-mono">{new Date(data.lastErrorTime).toLocaleString('da-DK')}</p>
                      )}
                      
                      {/* Guidance based on error */}
                      {data.lastError.includes('Minimum order size') && (
                         <div className="mt-3 bg-black/40 p-3 rounded-lg border border-rose-500/10">
                            <p className="text-xs text-gray-300"><strong className="text-white">Løsning:</strong> Binance kræver at en ordre (køb eller salg) er på minimum $10 (10 USDT). Du skal øge "Maks. Allokering / Handel" til mindst $10 i kontrolpanelet.</p>
                         </div>
                      )}
                      {data.lastError.includes('API-key format invalid') && (
                         <div className="mt-3 bg-black/40 p-3 rounded-lg border border-rose-500/10">
                            <p className="text-xs text-gray-300"><strong className="text-white">Løsning:</strong> Dine API nøgler er ugyldige eller skrevet forkert ind. Åbn indstillingerne og tast dem ind igen.</p>
                         </div>
                      )}
                      {(data.lastError.includes('Signature for this request is not valid') || data.lastError.includes('API-key format invalid') || data.lastError.includes('Invalid API-key, IP, or permissions')) && (
                         <div className="mt-3 bg-black/40 p-3 rounded-lg border border-rose-500/10">
                            <p className="text-xs text-gray-300"><strong className="text-white">Løsning:</strong> API nøgler mangler rettigheder. Gå til Binance -&gt; API Management -&gt; Edit restrictions -&gt; Sæt kryds i "Enable Spot & Margin Trading". Det kræver ofte at du binder en IP adresse (hvilket er besværligt i skyen) eller deaktiverer IP begrænsning.</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {/* Recent Failed Trades */}
           <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Terminal className="size-3.5" />
                 Afviste Ordrer Historik
              </h3>
              
              {(!data?.recentErrors || data.recentErrors.length === 0) ? (
                 <div className="text-center p-6 border border-dashed border-gray-800 rounded-xl">
                    <p className="text-gray-500 text-xs font-mono">Ingen nylige handelsfejl registreret.</p>
                 </div>
              ) : (
                 <div className="space-y-2">
                    {data.recentErrors.map((err, i) => (
                       <div key={i} className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg p-3 flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                             <div>
                                <p className="text-[10px] text-gray-500 font-mono mb-0.5">{new Date(err.time).toLocaleString('da-DK')}</p>
                                <p className="text-xs font-bold text-gray-300">
                                   <span className="text-rose-400">{err.type}</span> • {err.symbol}
                                </p>
                             </div>
                          </div>
                          <p className="text-xs text-gray-400 font-mono bg-black/40 px-2 py-1 rounded max-w-xs truncate" title={err.duration}>
                             {err.duration}
                          </p>
                       </div>
                    ))}
                 </div>
              )}
           </div>

        </div>
      </motion.div>
    </div>
  );
}
