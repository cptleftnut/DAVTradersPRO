import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gauge, Loader2 } from 'lucide-react';

export function FearAndGreedIndex() {
  const [data, setData] = useState<{ value: number, classification: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fear-and-greed')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.data && resData.data.length > 0) {
          setData({
            value: parseInt(resData.data[0].value, 10),
            classification: resData.data[0].value_classification
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch fear and greed index', err);
        setLoading(false);
      });
  }, []);

  const getColor = (value: number) => {
    if (value <= 25) return '#f43f5e'; // rose-500
    if (value <= 45) return '#f97316'; // orange-500
    if (value <= 55) return '#eab308'; // yellow-500
    if (value <= 74) return '#22c55e'; // green-500
    return '#10b981'; // emerald-500
  };

  const getTextColor = (value: number) => {
    if (value <= 25) return 'text-rose-500';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 74) return 'text-green-500';
    return 'text-emerald-500';
  };

  // SVG parameters
  const radius = 80;
  const circumference = Math.PI * radius; // length of the half-circle path
  
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
      <div className="flex items-center gap-2 mb-6">
        <Gauge className="size-5 text-gray-500" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Crypto Fear & Greed</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
           <Loader2 className="size-8 text-gray-600 animate-spin" />
        </div>
      ) : data ? (
        <div className="flex flex-col items-center justify-center relative pt-4">
           <div className="relative w-48 h-24 overflow-visible flex justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                {/* Background arc */}
                <path 
                  d="M 20 100 A 80 80 0 0 1 180 100" 
                  fill="none" 
                  stroke="var(--color-gray-800)" 
                  strokeWidth="20" 
                  strokeLinecap="round"
                />
                
                {/* Foreground arc (animated) */}
                <motion.path 
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${(data.value / 100) * circumference} ${circumference}` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  d="M 20 100 A 80 80 0 0 1 180 100" 
                  fill="none" 
                  stroke={getColor(data.value)} 
                  strokeWidth="20" 
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 flex flex-col items-center">
                 <span className={`text-4xl font-black font-mono tracking-tighter ${getTextColor(data.value)}`}>
                    {data.value}
                 </span>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1 whitespace-nowrap">
                    {data.classification}
                 </span>
              </div>
           </div>
           
           <div className="w-full flex justify-between mt-10 text-[9px] font-mono text-gray-600 uppercase tracking-widest px-2">
              <span>Extreme Fear</span>
              <span>Extreme Greed</span>
           </div>
        </div>
      ) : (
        <div className="text-gray-500 flex justify-center items-center h-48 text-sm">Data unavailable</div>
      )}
    </div>
  );
}
