import React, { useState } from 'react';
import { ShieldAlert, Info, AlertTriangle, CheckCircle2, ListFilter, Activity } from 'lucide-react';

interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'warn' | 'error';
}

export function TradeDiagnostics({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<'all' | 'error' | 'success'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'error') return log.type === 'error' || log.type === 'warn';
    if (filter === 'success') return log.type === 'info' && (log.msg.includes('successfully') || log.msg.includes('succesfuldt'));
    return true;
  });

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border-white/10 p-6 flex flex-col h-[400px] overflow-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/50 rounded-xl border border-cyan-800/50">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Trade Diagnostics</h2>
            <p className="text-xs text-gray-400">Live API Execution Logs</p>
          </div>
        </div>

        <div className="flex items-center bg-gray-900/20 backdrop-blur-md border-white/5 rounded-lg p-1 border border-gray-800">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('success')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'success' ? 'bg-emerald-900/50 text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Success
          </button>
          <button 
            onClick={() => setFilter('error')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filter === 'error' ? 'bg-rose-900/50 text-rose-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Errors
            {logs.some(l => l.type === 'error') && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 z-10 pr-2 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
            <ListFilter className="w-8 h-8 opacity-50" />
            <p className="text-sm font-medium">No logs match your filter</p>
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className={`p-3 rounded-xl border text-sm relative overflow-hidden transition-all hover:bg-gray-800/80 ${
              log.type === 'error' ? 'bg-rose-950/20 border-rose-900/30' : 
              log.type === 'warn' ? 'bg-amber-950/20 border-amber-900/30' : 
              log.msg.includes('successfully') || log.msg.includes('succesfuldt') ? 'bg-emerald-950/20 border-emerald-900/30' :
              'bg-gray-800/40 border-gray-700/50'
            }`}>
              {/* Subtle side accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                log.type === 'error' ? 'bg-rose-500' : 
                log.type === 'warn' ? 'bg-amber-500' : 
                log.msg.includes('successfully') || log.msg.includes('succesfuldt') ? 'bg-emerald-500' :
                'bg-cyan-500'
              }`} />
              
              <div className="flex items-start gap-3 pl-2">
                <div className="mt-0.5 shrink-0">
                  {log.type === 'error' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> :
                   log.type === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                   log.msg.includes('successfully') || log.msg.includes('succesfuldt') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   <Info className="w-4 h-4 text-cyan-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      log.type === 'error' ? 'text-rose-400' : 
                      log.type === 'warn' ? 'text-amber-400' : 
                      log.msg.includes('successfully') || log.msg.includes('succesfuldt') ? 'text-emerald-400' :
                      'text-cyan-400'
                    }`}>
                      {log.type === 'error' ? 'ERROR' : log.type === 'warn' ? 'WARNING' : log.msg.includes('successfully') ? 'SUCCESS' : 'INFO'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                      {new Date(log.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed font-mono text-xs break-words whitespace-pre-wrap">
                    {log.msg}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
