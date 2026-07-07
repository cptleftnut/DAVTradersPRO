import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, Activity, TrendingUp, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';

export const MacroTerminal = React.memo(function MacroTerminal() {
  const [data, setData] = useState({
    globalLiquidity: 'Expanding',
    centralBankBias: 'Dovish',
    riskAppetite: 'High',
    volatilityIndex: 14.2,
    aiSentimentScore: 82,
  });

  return (
    <div className="h-full space-y-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Macro State Card */}
        <div className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Globe className="size-4 text-indigo-400" /> Global Macro State
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
              <span className="text-gray-400 font-mono text-sm">Liquidity Regime</span>
              <span className="text-emerald-400 font-bold tracking-wide">{data.globalLiquidity}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
              <span className="text-gray-400 font-mono text-sm">Central Bank Bias</span>
              <span className="text-emerald-400 font-bold tracking-wide">{data.centralBankBias}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
              <span className="text-gray-400 font-mono text-sm">Risk Appetite</span>
              <span className="text-emerald-400 font-bold tracking-wide">{data.riskAppetite}</span>
            </div>
          </div>
        </div>

        {/* AI Correlation Matrix Card */}
        <div className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Cpu className="size-4 text-amber-400" /> AI Correlation Engine
          </h3>
          <div className="relative h-32 flex items-center justify-center">
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-24 h-24 rounded-full border border-dashed border-gray-700 animate-[spin_10s_linear_infinite]"></div>
                 <div className="absolute w-16 h-16 rounded-full border border-dashed border-gray-600 animate-[spin_7s_linear_infinite_reverse]"></div>
                 <Activity className="absolute size-8 text-amber-500 animate-pulse" />
             </div>
             <p className="text-xs text-gray-500 font-mono mt-24">Computing Cross-Asset Regressions...</p>
          </div>
        </div>

        {/* Institutional Flow Card */}
        <div className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-400" /> Institutional Setup
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            AI detects heavy options positioning. Smart money is building long exposure in tech, while distributing energy sectors.
          </p>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 w-[65%]"></div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-widest text-right">Bullish Divergence</p>
        </div>

      </div>

      <div className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[300px]">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <ShieldAlert className="size-4 text-cyan-400" /> Market Anomalies Detected (Real-Time)
        </h3>
        
        <div className="space-y-3 font-mono text-xs">
          {[
            { time: '10:42:05', asset: 'BTC', event: 'Large Dark Pool Block Buy', volume: '$145M', impact: 'High' },
            { time: '10:38:12', asset: 'ETH', event: 'Vol Spikes > 2x ATR', volume: '-', impact: 'Medium' },
            { time: '10:15:00', asset: 'SOL', event: 'Sentiment Shift (Twitter/X to Bullish)', volume: '-', impact: 'Low' },
          ].map((log, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.2 }}
               className="flex items-center justify-between p-3 bg-gray-950/50 border border-gray-800/50 rounded-xl"
             >
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">{log.time}</span>
                  <span className="font-bold text-gray-200">{log.asset}</span>
                  <span className="text-emerald-400">{log.event}</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                   {log.volume !== '-' && <span>Vol: {log.volume}</span>}
                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${log.impact === 'High' ? 'bg-rose-500/20 text-rose-400' : log.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
                     {log.impact}
                   </span>
                </div>
             </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

