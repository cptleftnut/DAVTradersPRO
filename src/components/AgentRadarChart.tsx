import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Swords } from 'lucide-react';

export interface AgentPerformanceData {
  name: string;
  pnl: string;
  strategy: string;
  ticker: string;
  risk: number;
  return: number;
  latency: number;
}

export function AgentRadarChart({ data, selectedTicker }: { data: AgentPerformanceData[], selectedTicker?: string }) {
  const [battleMode, setBattleMode] = useState(false);
  const [agent1, setAgent1] = useState(data[0]?.name || '');
  const [agent2, setAgent2] = useState(data[1]?.name || '');

  const activeData = battleMode ? data.filter(a => a.name === agent1 || a.name === agent2) : data;

  // Format data for radar chart. Recharts RadarChart expects data structured with subject (axes) and one or more values for different lines.
  const chartData = [
    { subject: 'Risk', ...activeData.reduce((acc, agent) => ({ ...acc, [agent.name]: agent.risk }), {}) },
    { subject: 'Return', ...activeData.reduce((acc, agent) => ({ ...acc, [agent.name]: agent.return }), {}) },
    { subject: 'Latency', ...activeData.reduce((acc, agent) => ({ ...acc, [agent.name]: agent.latency }), {}) },
  ];

  const colors = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#d946ef'];

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 text-xs pt-4">
        {payload.map((entry: any, index: number) => {
          // Find the agent in data corresponding to this name
          const agent = data.find(a => a.name === entry.value);
          const isHandlingSelectedTicker = agent && selectedTicker && agent.ticker === selectedTicker;

          return (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <div className="relative flex items-center justify-center size-3">
                {isHandlingSelectedTicker && (
                  <span 
                    className="absolute inset-0 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                )}
                <span 
                  className="relative size-3 rounded-full shadow-md"
                  style={{ backgroundColor: entry.color }}
                ></span>
              </div>
              <span 
                className="font-mono font-medium" 
                style={{ color: isHandlingSelectedTicker ? 'var(--color-gray-100)' : 'var(--color-gray-400)' }}
              >
                {entry.value}
                {isHandlingSelectedTicker && <span className="ml-1 text-[10px] text-emerald-400 font-bold">(Live)</span>}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block flex-1">
          Performance Matrix
        </h4>
        {selectedTicker && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/20 border border-emerald-500/20 rounded-full mr-3 shrink-0">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Live Tracker: <strong className="text-emerald-300">{selectedTicker}</strong></span>
          </div>
        )}
        <button 
          onClick={() => setBattleMode(!battleMode)} 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors shrink-0 ${battleMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700'}`}
        >
          <Swords className="size-3" /> Battle Mode
        </button>
      </div>

      {battleMode && (
        <div className="flex items-center gap-3 mb-2 bg-gray-900/50 p-2 rounded-xl border border-gray-800">
          <select 
            value={agent1} 
            onChange={e => setAgent1(e.target.value)} 
            className="flex-1 bg-gray-950 border border-gray-800 text-cyan-400 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-cyan-500 font-mono"
          >
            {data.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
          <span className="text-[10px] font-bold text-gray-500">VS</span>
          <select 
            value={agent2} 
            onChange={e => setAgent2(e.target.value)} 
            className="flex-1 bg-gray-950 border border-gray-800 text-emerald-400 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 font-mono"
          >
            {data.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      )}

      <div className="w-full h-80 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="var(--color-gray-700)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-gray-400)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'var(--color-gray-950)', borderColor: 'var(--color-gray-700)', color: 'var(--color-gray-100)', borderRadius: '12px', fontSize: '14px' }} 
               itemStyle={{ color: '#22d3ee' }}
               formatter={(value: number, name: string) => [value, name]}
            />
            <Legend content={renderCustomLegend} />
            {activeData.map((agent, i) => (
              <Radar
                key={agent.name}
                name={agent.name}
                dataKey={agent.name}
                stroke={battleMode ? (i === 0 ? '#22d3ee' : '#10b981') : colors[i % colors.length]}
                fill={battleMode ? (i === 0 ? '#22d3ee' : '#10b981') : colors[i % colors.length]}
                fillOpacity={0.2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
