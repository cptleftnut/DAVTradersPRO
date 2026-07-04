import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// Mock data representing the performance of the active strategy vs a benchmark

const CustomCursor = (props: any) => {
  const { points, width, height, stroke } = props;
  if (!points || !points.length) return null;
  const { x, y } = points[0];
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={height} stroke={stroke} strokeWidth={1} strokeDasharray="4 4" />
      <line x1={0} y1={y} x2={width} y2={y} stroke={stroke} strokeWidth={1} strokeDasharray="4 4" />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[180px]">
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-3 pb-2 border-b border-gray-800">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-6">
              <span className="text-gray-400 text-xs">{entry.name}</span>
              <span className="font-mono font-bold text-sm" style={{ color: entry.color }}>
                {entry.value > 0 ? '+' : ''}{entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function BenchmarkChart({ activeStrategy, data = [] }: { activeStrategy: string, data?: any[] }) {
  if (!data || data.length === 0) return null;
  // Select the appropriate benchmark based on the strategy
  const benchmarkKey = activeStrategy === 'Utilitets-mining' ? 'bitcoin' : 'sAndP500';
  const benchmarkColor = activeStrategy === 'Utilitets-mining' ? '#f59e0b' : '#3b82f6';
  const benchmarkName = activeStrategy === 'Utilitets-mining' ? 'Bitcoin (BTC)' : 'S&P 500';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800 mb-8"
    >
      <div className="flex justify-between items-end mb-6">
        <div>
           <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Relativ Performance (24T)</p>
           <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Strategi vs Benchmark</h3>
        </div>
        <div className="text-right">
            <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/50">
               Alpha Målt
            </span>
        </div>
      </div>
      
      <div className="h-64 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis 
                dataKey="time" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
            />
            <YAxis 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                dx={-10}
            />
            <Tooltip 
                content={<CustomTooltip />}
                cursor={<CustomCursor stroke="#374151" />}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            <Line 
                type="monotone" 
                name="Aktiv Strategi"
                dataKey="strategy" 
                stroke="#34d399" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#030712', strokeWidth: 2 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
                type="monotone" 
                name={benchmarkName}
                dataKey={benchmarkKey} 
                stroke={benchmarkColor} 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
