import { motion } from 'motion/react';
import { Info } from 'lucide-react';

interface SentimentGaugeProps {
  score: number; // -100 to 100
}

export function SentimentGauge({ score }: SentimentGaugeProps) {
  // Normalize score to 0-100 for gauge positioning (0 is -100, 50 is 0, 100 is 100)
  const normalizedScore = (score + 100) / 2;
  
  let label = "Neutral";
  let colorClass = "bg-gray-400";
  let textColorClass = "text-gray-400";
  
  if (score <= -60) {
    label = "Strong Bearish";
    colorClass = "bg-rose-500";
    textColorClass = "text-rose-500";
  } else if (score < -20) {
    label = "Bearish";
    colorClass = "bg-rose-400";
    textColorClass = "text-rose-400";
  } else if (score > 60) {
    label = "Strong Bullish";
    colorClass = "bg-emerald-500";
    textColorClass = "text-emerald-500";
  } else if (score > 20) {
    label = "Bullish";
    colorClass = "bg-emerald-400";
    textColorClass = "text-emerald-400";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              AI Sentiment
           </span>
           <div className="group relative inline-block">
              <Info className="size-3 text-gray-500 hover:text-white cursor-help transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden w-48 p-2 text-[10px] text-gray-300 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 group-hover:block normal-case tracking-normal font-normal">
                En samlet score baseret på nyheder, sociale medier og tekniske momentum-indikatorer.
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 rotate-45"></div>
              </div>
           </div>
         </div>
         <span className={`text-xs font-mono font-bold ${textColorClass}`}>{label} ({score > 0 ? '+' : ''}{score})</span>
      </div>
      
      <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden relative flex">
         {/* Background gradient from red to green */}
         <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-gray-500 to-emerald-500 opacity-30"></div>
         
         {/* Center tick */}
         <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-700 -translate-x-1/2 z-10"></div>
         
         {/* Indicator pointer */}
         <motion.div 
            initial={{ left: '50%' }}
            animate={{ left: `${normalizedScore}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_8px_rgba(255,255,255,0.8)] -translate-x-1/2 rounded-full"
         ></motion.div>
      </div>
      <div className="flex justify-between text-[8px] text-gray-500 font-mono uppercase tracking-widest mt-1">
         <span>Bearish</span>
         <span>Neutral</span>
         <span>Bullish</span>
      </div>
    </div>
  );
}
