import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Terminal, AlertTriangle, RefreshCw } from 'lucide-react';

interface DiagnosticData {
  lastError?: string;
  lastErrorTime?: number;
  recentErrors: any[];
}

export function TradeErrorLog() {
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
    <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
           <ShieldAlert className="size-4 text-rose-500" />
           <h3 className="font-bold text-sm text-gray-200">Handelsfejl & Log</h3>
        </div>
        <button onClick={fetchDiagnostics} className="text-gray-500 hover:text-white transition-colors">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
         {/* Latest Error */}
         {data?.lastError && (
           <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
              <div className="flex items-start gap-2">
                 <AlertTriangle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                 <div>
                    <h4 className="text-rose-400 font-bold text-xs mb-1">Seneste System Fejl</h4>
                    <p className="text-rose-200/70 text-[10px] font-mono leading-relaxed">{data.lastError}</p>
                    {data.lastErrorTime && (
                       <p className="text-rose-500/60 text-[9px] mt-1.5 font-mono">{new Date(data.lastErrorTime).toLocaleString('da-DK')}</p>
                    )}
                 </div>
              </div>
           </div>
         )}

         {/* Recent Failed Trades */}
         <div>
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
               <Terminal className="size-3" />
               Afviste Ordrer
            </h4>
            
            {(!data?.recentErrors || data.recentErrors.length === 0) ? (
               <div className="text-center py-4">
                  <p className="text-gray-600 text-xs font-mono">Ingen handelsfejl registreret.</p>
               </div>
            ) : (
               <div className="space-y-2">
                  {data.recentErrors.map((err, i) => (
                     <div key={i} className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg p-2.5 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                              <p className="text-xs font-bold text-gray-300">
                                 <span className="text-rose-400">{err.type}</span> • {err.symbol}
                              </p>
                           </div>
                           <p className="text-[9px] text-gray-500 font-mono">{new Date(err.time).toLocaleString('da-DK')}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono bg-black/30 px-2 py-1 rounded w-full overflow-hidden text-ellipsis whitespace-nowrap" title={err.duration}>
                           {err.duration}
                        </p>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
