import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { AnalysisHistoryItem } from './RecentAnalyses';

interface MarketPulseProps {
  history: AnalysisHistoryItem[];
  useUTC?: boolean;
}

export function MarketPulse({ history, useUTC = false }: MarketPulseProps) {
  if (history.length === 0) return null;
  const items = history;

  // We need enough copies to fill the screen and animate smoothly.
  // By creating an inner container that repeats exactly twice, and moving it by -50%, we get a seamless loop.
  
  const getSentimentText = (score: number) => {
    if (score >= 70) return 'Ekstrem Grådighed';
    if (score >= 55) return 'Grådighed';
    if (score >= 45) return 'Neutral';
    if (score >= 30) return 'Frygt';
    return 'Ekstrem Frygt';
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 55) return 'text-emerald-500';
    if (score >= 45) return 'text-amber-500';
    if (score >= 30) return 'text-rose-400';
    return 'text-rose-500';
  };

  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    if (useUTC) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItems = () => items.map((item, idx) => {
    const score = item.sentimentScore || 50;
    return (
      <div key={`${item.id}-${idx}`} className="flex items-center gap-3 px-6">
        <span className="text-[10px] text-gray-500 font-mono">{formatTime(item.time)}</span>
        <span className="font-mono font-bold text-gray-300">{item.ticker.toUpperCase()}</span>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${getSentimentColor(score)}`}>
          <span>{getSentimentText(score)}</span>
          <span>({score})</span>
        </div>
      </div>
    );
  });

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm px-6 py-4 rounded-3xl shadow-xl border border-gray-800 mb-8 overflow-hidden flex items-center relative">
      {/* Label Box that sits on top */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center gap-2 z-10 bg-gray-900/90 border-r border-gray-800 backdrop-blur-md px-6 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
        <Activity className="size-4 text-cyan-500" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Market Pulse</h3>
      </div>
      
      {/* Fading edges mask */}
      <div className="flex-1 overflow-hidden ml-40 relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
        <motion.div
          className="flex whitespace-nowrap w-max"
          animate={{ x: [0, '-50%'] }}
          transition={{ repeat: Infinity, ease: "linear", duration: Math.max(15, items.length * 4) }}
        >
          {/* We render 4 sets to ensure it can loop cleanly without tearing on wide viewports */}
          <div className="flex">{renderItems()}</div>
          <div className="flex">{renderItems()}</div>
          <div className="flex">{renderItems()}</div>
          <div className="flex">{renderItems()}</div>
        </motion.div>
      </div>
    </div>
  );
}
