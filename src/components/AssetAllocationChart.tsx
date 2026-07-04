import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { PieChart as PieChartIcon, LayoutList, LayoutTemplate, Settings, AlertTriangle, X } from 'lucide-react';

interface Holding {
  asset: string;
  weight: number;
  value: number;
}

export function AssetAllocationChart({ walletData, onAssetClick }: { walletData?: any, onAssetClick?: (asset: string) => void }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [hiddenAssets, setHiddenAssets] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [legendLayout, setLegendLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [hoveredData, setHoveredData] = useState<{name: string, value: number} | null>(null);

  const toggleAsset = (asset: string) => {
    setHiddenAssets(prev => {
      const next = new Set(prev);
      if (next.has(asset)) {
        next.delete(asset);
      } else {
        next.add(asset);
      }
      return next;
    });
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
    const h = visibleHoldings[index];
    if (h) setHoveredData({ name: h.asset, value: h.value });
  };

  const onPieLeave = () => {
    setActiveIndex(null);
    setHoveredData(null);
  };

  useEffect(() => {
    if (!walletData || !walletData.spot) return;
    
    let isMounted = true;
    const calculateHoldings = async () => {
       let newHoldings: Holding[] = [];
       let totalUsdtValue = 0;
       
       const relevantAssets = walletData.spot.filter((s: any) => parseFloat(s.free) > 0 || parseFloat(s.locked) > 0);
       
       for (const s of relevantAssets) {
          const qty = parseFloat(s.free) + parseFloat(s.locked);
          let price = 1;
          
          if (s.asset !== 'USDT' && s.asset !== 'USDC') {
             try {
                const res = await fetch(`/api/binance-proxy/ticker/price?symbol=${s.asset}USDT`);
                if (res.ok) {
                   const json = await res.json();
                   price = parseFloat(json.price);
                }
             } catch(e) { } // Fallback to 1 if not paired with USDT
          }
          
          const val = qty * price;
          totalUsdtValue += val;
          newHoldings.push({ asset: s.asset, weight: 0, value: val });
       }
       
       if (totalUsdtValue > 0) {
          newHoldings = newHoldings.map(h => ({
             ...h,
             weight: parseFloat(((h.value / totalUsdtValue) * 100).toFixed(2))
          })).sort((a,b) => b.weight - a.weight);
       }
       
       if (isMounted) {
          setHoldings(newHoldings);
       }
    };
    
    calculateHoldings();
    return () => { isMounted = false; };
  }, [walletData]);

  const targetColors: Record<string, string> = {
    'BTC': '#f59e0b',
    'ETH': '#6366f1',
    'SOL': '#14b8a6',
    'USDT': '#22c55e',
    'USDC': '#0284c7'
  };

  const getColor = (asset: string, index: number) => {
     if (targetColors[asset]) return targetColors[asset];
     const colors = ['#8b5cf6', '#ec4899', '#f43f5e', '#a855f7', '#eab308', '#3b82f6'];
     return colors[index % colors.length];
  }

  const visibleHoldings = holdings.filter(h => !hiddenAssets.has(h.asset));
  const totalValue = visibleHoldings.reduce((sum, h) => sum + h.value, 0);

  const displayLabel = hoveredData ? hoveredData.name : 'Total Value';
  const displayValue = hoveredData ? hoveredData.value : totalValue;

  if (holdings.length === 0) return null;

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <PieChartIcon className="size-5 text-indigo-400" />
             <h2 className="text-sm font-bold text-white uppercase tracking-widest">Asset Allocation</h2>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setIsConfigOpen(true)}
                className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-lg"
                title="Configure Targets"
             >
                <Settings className="size-4" />
             </button>
             <button 
                onClick={() => setLegendLayout(p => p === 'horizontal' ? 'vertical' : 'horizontal')}
                className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-lg"
                title={legendLayout === 'horizontal' ? "Switch to Vertical Layout" : "Switch to Horizontal Layout"}
             >
                {legendLayout === 'horizontal' ? <LayoutList className="size-4" /> : <LayoutTemplate className="size-4" />}
             </button>
          </div>
       </div>

       <div className={`flex ${legendLayout === 'vertical' ? 'flex-col sm:flex-row items-center justify-center gap-8' : 'flex-col items-center justify-center'}`}>
           <div className="h-64 sm:h-80 w-full relative flex-1">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       activeIndex={activeIndex !== null ? activeIndex : undefined}
                       activeShape={(props: any) => (
                          <g>
                             <Sector
                                cx={props.cx}
                                cy={props.cy}
                                innerRadius={props.innerRadius}
                                outerRadius={props.outerRadius + 8}
                                startAngle={props.startAngle}
                                endAngle={props.endAngle}
                                fill={props.fill}
                             />
                          </g>
                       )}
                       data={visibleHoldings}
                       cx="50%"
                       cy="50%"
                       innerRadius="60%"
                       outerRadius="80%"
                       paddingAngle={3}
                       dataKey="weight"
                       nameKey="asset"
                       stroke="none"
                       onMouseEnter={onPieEnter}
                       onMouseLeave={onPieLeave}
                       onClick={(_, index) => {
                          const h = visibleHoldings[index];
                          if (h && onAssetClick) onAssetClick(h.asset);
                       }}
                    >
                       {visibleHoldings.map((entry) => {
                          const index = holdings.findIndex(h => h.asset === entry.asset);
                          return <Cell key={`cell-${index}`} fill={getColor(entry.asset, index)} stroke="rgba(0,0,0,0)" style={{ cursor: onAssetClick ? 'pointer' : 'default' }} />;
                       })}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', color: '#f3f4f6', borderRadius: '12px', fontSize: '14px' }}
                       formatter={(value: number, name: string, props: any) => [`${value}% ($${props.payload.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`, name]}
                    />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4 text-center px-4">
                 <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">{displayLabel}</span>
                 <div className="flex flex-col items-center">
                   <span className="text-2xl font-bold text-white tracking-tight">${displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                   {hoveredData && totalValue > 0 && (
                     <span className="text-[10px] text-emerald-400 font-mono">
                       {((hoveredData.value / totalValue) * 100).toFixed(1)}% AF PORTFOLIO
                     </span>
                   )}
                 </div>
              </div>
           </div>
    
           <div className={`flex ${legendLayout === 'vertical' ? 'flex-col gap-3 justify-center items-start sm:border-l sm:border-gray-800 sm:pl-8' : 'flex-wrap items-center justify-center gap-4 mt-6'} `}>
              {holdings.map((entry, index) => {
                 const isHidden = hiddenAssets.has(entry.asset);
                 return (
                    <button
                       key={entry.asset}
                       onClick={() => toggleAsset(entry.asset)}
                       className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                    >
                       <div className="size-2.5 rounded-full transition-colors" style={{ backgroundColor: isHidden ? '#374151' : getColor(entry.asset, index) }} />
                       <span className={`text-xs font-mono transition-colors ${isHidden ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                          {entry.asset}
                       </span>
                       {targets[entry.asset] !== undefined && Math.abs(entry.weight - targets[entry.asset]) > 5 && (
                          <AlertTriangle className="size-3.5 text-red-500" title={`Off target: ${entry.weight}% vs ${targets[entry.asset]}%`} />
                       )}
                    </button>
                 );
              })}
           </div>
       </div>

       {isConfigOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                   <h3 className="text-white font-bold tracking-tight">Target Allocations</h3>
                   <button onClick={() => setIsConfigOpen(false)} className="text-gray-400 hover:text-white">
                      <X className="size-5" />
                   </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                   {holdings.map(h => (
                      <div key={h.asset} className="flex items-center justify-between bg-gray-950/50 p-3 rounded-xl border border-gray-800/50">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-200">{h.asset}</span>
                            <span className="text-xs font-mono text-gray-500">Current: {h.weight}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <input 
                               type="number" 
                               value={targets[h.asset] !== undefined ? targets[h.asset] : ''} 
                               onChange={(e) => {
                                  const val = e.target.value;
                                  setTargets(p => {
                                     const newTargets = { ...p };
                                     if (val === '') {
                                        delete newTargets[h.asset];
                                     } else {
                                        newTargets[h.asset] = parseFloat(val);
                                     }
                                     return newTargets;
                                  });
                               }}
                               placeholder="Target"
                               className="w-20 bg-gray-950 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white font-mono text-right focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-gray-500 text-xs">%</span>
                         </div>
                      </div>
                   ))}
                </div>
                <div className="p-4 border-t border-gray-800">
                   <button 
                      onClick={() => setIsConfigOpen(false)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl transition-colors"
                   >
                      Save Configuration
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
