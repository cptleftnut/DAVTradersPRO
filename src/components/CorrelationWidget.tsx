import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CorrelationWidgetProps {
  ticker: string;
  data: { name: string; value: number }[];
}

export function CorrelationWidget({ ticker, data }: CorrelationWidgetProps) {
  // Generate deterministic mock benchmark data based on the dates and a seed
  const benchmarkData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const seedStr = data.map(d => d.name).join('');
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seed << 5) - seed + seedStr.charCodeAt(i);
        seed |= 0;
    }

    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    // Calculate daily returns for the ticker
    const tickerReturns: number[] = [];
    for (let i = 1; i < data.length; i++) {
        tickerReturns.push((data[i].value - data[i - 1].value) / data[i - 1].value);
    }
    
    // We only need the last 14 days of returns
    const windowSize = 14;
    const recentTickerReturns = tickerReturns.slice(-windowSize);
    
    if (recentTickerReturns.length < 2) return null; // Not enough data

    // Generate benchmark returns and calculate correlation
    const benchmarks = ['BTC', 'ETH', 'SPX'];
    
    const calculatePearson = (x: number[], y: number[]) => {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        if (denominator === 0) return 0;
        return numerator / denominator;
    };

    const results = benchmarks.map(bm => {
        // Generate pseudo-correlated returns
        // We'll base it somewhat on the ticker, but mostly noise, with fixed intrinsic correlations
        let intrinsicCorr = 0;
        if (bm === 'BTC') intrinsicCorr = 0.6;
        if (bm === 'ETH') intrinsicCorr = 0.5;
        if (bm === 'SPX') intrinsicCorr = 0.2;

        if (ticker === 'BTC' && bm === 'BTC') intrinsicCorr = 1.0;
        if (ticker === 'ETH' && bm === 'ETH') intrinsicCorr = 1.0;

        const bmReturns = recentTickerReturns.map(tr => {
            const noise = (random() - 0.5) * 0.05; // 5% noise
            return tr * intrinsicCorr + noise * (1 - Math.abs(intrinsicCorr));
        });

        const correlation = calculatePearson(recentTickerReturns, bmReturns);
        return {
            name: bm,
            correlation: isNaN(correlation) ? 0 : correlation
        };
    });

    return results;

  }, [data, ticker]);

  if (!benchmarkData || benchmarkData.length === 0) return null;

  return (
    <div className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl overflow-hidden mt-4">
        <div className="p-3 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-300 font-mono tracking-widest uppercase">
                14-Day Benchmark Correlation
            </h4>
        </div>
        <div className="p-3">
            <div className="flex items-center justify-between gap-4">
                {benchmarkData.map((bm, index) => {
                    const isPositive = bm.correlation > 0.3;
                    const isNegative = bm.correlation < -0.3;
                    const isNeutral = !isPositive && !isNegative;
                    
                    return (
                        <div key={bm.name} className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-gray-950/50 border border-gray-800/50">
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">{bm.name}</span>
                            <div className="flex items-center gap-1.5">
                                {isPositive && <TrendingUp className="size-3 text-emerald-400" />}
                                {isNegative && <TrendingDown className="size-3 text-rose-400" />}
                                {isNeutral && <Minus className="size-3 text-gray-400" />}
                                <span className={`text-xs font-mono font-bold ${
                                    isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-gray-400'
                                }`}>
                                    {bm.correlation.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-2 text-[9px] text-gray-600 text-center font-mono uppercase">
                Rolling 14-day Pearson coefficient comparison
            </div>
        </div>
    </div>
  );
}
