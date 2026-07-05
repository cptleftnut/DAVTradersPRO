import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AnalysisHistoryItem } from './RecentAnalyses';
import { Activity, LayoutGrid, TrendingUp } from 'lucide-react';

interface SentimentHistoryChartProps {
  history: AnalysisHistoryItem[];
}

export function SentimentHistoryChart({ history }: SentimentHistoryChartProps) {
  const [view, setView] = useState<'line' | 'heatmap'>('line');
  
  if (history.length === 0) return null;

  // Recharts renders data from left to right, so we reverse the history to show chronological order
  const data = [...history].reverse().map(item => ({
    name: item.ticker,
    time: item.time,
    sentiment: item.sentimentScore || 0,
    confidence: item.confidence || 0,
    label: `${item.ticker} (${item.time})`
  }));

  const heatmapData = useMemo(() => {
    return [...history].reverse().map((item, idx, arr) => ({
      date: `${item.ticker} (${item.time})`,
      score: item.sentimentScore || 50,
      isToday: idx === arr.length - 1
    }));
  }, [history]);

  const getHeatmapColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-emerald-500/60';
    if (score >= 40) return 'bg-amber-500/60';
    if (score >= 20) return 'bg-rose-500/60';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-amber-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            AI Sentiment Tracker
          </h2>
        </div>
        <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
          <button 
            onClick={() => setView('line')}
            className={`p-1.5 rounded-md transition-colors ${view === 'line' ? 'bg-gray-800 text-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
            title="Line Chart"
          >
            <TrendingUp className="size-4" />
          </button>
          <button 
            onClick={() => setView('heatmap')}
            className={`p-1.5 rounded-md transition-colors ${view === 'heatmap' ? 'bg-gray-800 text-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
            title="Heatmap Calendar"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        {view === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
              className="text-xs font-mono"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-700)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-gray-500)" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="var(--color-gray-500)" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
                domain={[0, 100]}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="var(--color-gray-500)" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-gray-900)', 
                  border: '1px solid var(--color-gray-700)',
                  borderRadius: '0.5rem',
                  color: 'var(--color-gray-100)',
                  fontFamily: 'inherit'
                }}
                labelStyle={{ color: 'var(--color-gray-400)', marginBottom: '0.25rem' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                name="Sentiment Score"
                dataKey="sentiment" 
                stroke="#F59E0B" 
                strokeWidth={2} 
                dot={{ r: 4, fill: 'var(--color-gray-900)', stroke: '#F59E0B', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#F59E0B', stroke: '#000', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                name="AI Confidence"
                dataKey="confidence" 
                stroke="#10B981" 
                strokeWidth={2} 
                dot={{ r: 4, fill: 'var(--color-gray-900)', stroke: '#10B981', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#10B981', stroke: '#000', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col">
             <div className="flex-1 grid grid-cols-7 gap-2 sm:gap-3 items-center justify-items-center mb-2 overflow-y-auto pr-2">
                {heatmapData.map((day, i) => (
                  <div key={i} className="flex flex-col items-center justify-center group relative">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md transition-all duration-300 ${getHeatmapColor(day.score)} ${day.isToday ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'hover:scale-110'}`}></div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden w-max p-2 text-[10px] text-gray-300 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 group-hover:block normal-case tracking-normal font-normal">
                      <div className="font-bold text-white">{day.date}</div>
                      <div>Sentiment: {day.score}</div>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 rotate-45"></div>
                    </div>
                  </div>
                ))}
             </div>
             <div className="flex items-center justify-end gap-2 text-[10px] text-gray-500 font-mono mt-2">
                <span>Bearish</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-sm bg-rose-500/60"></div>
                  <div className="w-3 h-3 rounded-sm bg-amber-500/60"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/60"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                </div>
                <span>Bullish</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
