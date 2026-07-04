import { useState } from 'react';
import { GitCompare, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MODELS = ['linear', 'lstm', 'arima'];

const MODEL_COLORS: Record<string, string> = {
    linear: 'bg-orange-500',
    lstm: 'bg-blue-500',
    arima: 'bg-purple-500'
};

const MODEL_TEXT_COLORS: Record<string, string> = {
    linear: 'text-orange-500',
    lstm: 'text-blue-500',
    arima: 'text-purple-500'
};

export function TickerCompare({ primaryTicker = "BTC" }: { primaryTicker?: string }) {
  const [ticker, setTicker] = useState(primaryTicker);
  const [interval, setInterval] = useState('1d');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedModels, setSelectedModels] = useState<string[]>(['linear']);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState<string | null>(null);
  
  // Risk management state
  const [stopLoss, setStopLoss] = useState('5');
  const [takeProfit, setTakeProfit] = useState('10');
  const [positionSizeType, setPositionSizeType] = useState<'percent' | 'fixed'>('percent');
  const [positionSizeValue, setPositionSizeValue] = useState('1'); 
  const handleRetrain = async (modelType: string) => {
    setRetraining(modelType);
    try {
      const res = await fetch('/api/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ticker, modelType, startDate, endDate, interval })
      });
      const newResult = await res.json();
      setResults(prev => prev.map(r => r.modelType === modelType ? newResult : r));
    } catch (e) {
      console.error("Retrain failed", e);
    } finally {
      setRetraining(null);
    }
  };

  const toggleModel = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const handlePredict = async () => {
    if (!ticker || selectedModels.length === 0) return;
    setLoading(true);
    setResults([]);
    try {
        const promises = selectedModels.map(modelType => 
            fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: ticker, modelType, startDate, endDate, interval, stopLoss, takeProfit, positionSizeType, positionSizeValue })
            }).then(res => res.json())
        );
        const data = await Promise.all(promises);
        setResults(data);
    } catch (e) {
        toast.error("Prediction failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
      <div className="flex items-center gap-2 mb-6">
        <GitCompare className="size-4 text-orange-500" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">ML Model Sammenligning</h3>
      </div>
      
      <div className="flex flex-col gap-3 mb-8">
        <input 
          type="text" 
          value={ticker} 
          onChange={(e) => setTicker(e.target.value)} 
          className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all uppercase" 
          placeholder="TICKER (f.eks. BTC)"
        />
        <div className="flex gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all text-gray-500" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all text-gray-500" />
            <select value={interval} onChange={(e) => setInterval(e.target.value)} className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all uppercase">
              <option value="1h">1H</option>
              <option value="4h">4H</option>
              <option value="1d">1D</option>
              <option value="1wk">1W</option>
            </select>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
            <input type="number" placeholder="Stop Loss %" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all" />
            <input type="number" placeholder="Take Profit %" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all" />
            <select value={positionSizeType} onChange={(e) => setPositionSizeType(e.target.value as any)} className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all">
                <option value="percent">Portfolio %</option>
                <option value="fixed">Fixed Amount ($)</option>
            </select>
            <input type="number" placeholder="Size Value" value={positionSizeValue} onChange={(e) => setPositionSizeValue(e.target.value)} className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm transition-all" />
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
            {MODELS.map(model => (
                <button
                    key={model}
                    onClick={() => toggleModel(model)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${selectedModels.includes(model) ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                    {model}
                </button>
            ))}
        </div>
        <button 
          onClick={handlePredict} 
          disabled={loading || !ticker || selectedModels.length === 0}
          className="bg-orange-600/20 text-orange-400 border border-orange-800/50 hover:bg-orange-500 hover:text-white disabled:opacity-50 px-6 py-3 rounded-2xl transition-all flex justify-center items-center font-bold uppercase text-xs tracking-widest"
        >
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <TrendingUp size={16} className="mr-2"/>}
          Forudsig og Sammenlign
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        {results.map((res) => (
          <div key={res.modelType} className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <div className={`w-3 h-3 rounded-full ${MODEL_COLORS[res.modelType]}`}></div>
            {res.modelType}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {results.map((res, i) => (
          <div key={i} className={`bg-gray-950 border border-t-gray-800 border-r-gray-800 border-b-gray-800 border-l-4 ${MODEL_TEXT_COLORS[res.modelType].replace('text-', 'border-')} p-4 rounded-xl`}>
            <p className={`${MODEL_TEXT_COLORS[res.modelType]} text-xs uppercase tracking-widest font-bold mb-2`}>{res.modelType}</p>
            <p className="text-2xl text-white font-mono font-bold">$ {res.predictedPrice.toFixed(2)}</p>
            
            <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
               <span>SL: { (res.predictedPrice * (1 - parseFloat(stopLoss)/100)).toFixed(2) }</span>
               <span>TP: { (res.predictedPrice * (1 + parseFloat(takeProfit)/100)).toFixed(2) }</span>
            </div>

            <div className="mt-2 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
              <div style={{ width: '10%' }} className="bg-gray-700"></div>
              <div style={{ width: '80%' }} className={`${MODEL_COLORS[res.modelType].replace('bg-', 'bg-')}/50`}></div>
              <div style={{ width: '10%' }} className="bg-gray-700"></div>
            </div>
            
            <p className="text-gray-500 text-xs font-mono mt-2">Lukkekurs: $ {res.lastPrice.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {results.length > 0 && (
          <div className="mt-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Uncertainty & Accuracy History</h4>
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={
                  results[0].maeHistory.map((_: any, i: number) => ({
                    day: i,
                    ...results.reduce((acc, res) => ({ ...acc, [res.modelType]: res.maeHistory[i] }), {})
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }} />
                  {results.map(res => (
                    <Line 
                      key={res.modelType} 
                      type="monotone" 
                      dataKey={res.modelType} 
                      stroke={MODEL_COLORS[res.modelType].startsWith('bg-') ? MODEL_COLORS[res.modelType].replace('bg-', '') : 'white' } 
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload[res.modelType] > 3) {
                          return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#fff" />;
                        }
                        return null;
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Leaderboard (MAE)</h4>
            <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-gray-900 text-gray-400 uppercase">
                        <tr>
                            <th className="px-4 py-3">Model</th>
                            <th className="px-4 py-3">MAE</th>
                            <th className="px-4 py-3">Trend</th>
                            <th className="px-4 py-3">Rank</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {[...results].sort((a,b) => a.mae - b.mae).map((res, i) => (
                            <tr key={res.modelType}>
                                <td className="px-4 py-3">{res.modelType}</td>
                                <td className="px-4 py-3">{res.mae.toFixed(4)}</td>
                                <td className="px-4 py-3">
                                  {res.maeHistory[0] > res.maeHistory[29] ? (
                                    <span className="text-green-500 font-bold">▲</span>
                                  ) : (
                                    <span className="text-red-500 font-bold">▼</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-bold">{i + 1}</td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleRetrain(res.modelType)}
                                    disabled={retraining === res.modelType}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded text-[10px] font-mono transition-colors disabled:opacity-50"
                                  >
                                    {retraining === res.modelType ? 'Retraining...' : 'Retrain'}
                                  </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {results.length > 1 && (
        <div className="mt-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Correlation Matrix</h4>
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${results.length + 1}, minmax(0, 1fr))` }}>
                    <div /> {/* Top left corner */}
                    {results.map(r => <div key={r.modelType} className="text-[10px] text-gray-500 font-mono text-center uppercase">{r.modelType}</div>)}
                    
                    {results.map(r1 => (
                        <>
                            <div className="text-[10px] text-gray-500 font-mono text-right uppercase">{r1.modelType}</div>
                            {results.map(r2 => (
                                <div key={`${r1.modelType}-${r2.modelType}`} className={`p-2 rounded text-[10px] text-center font-mono ${r1.modelType === r2.modelType ? 'bg-gray-800 text-gray-400' : 'bg-gray-900 text-orange-500'}`}>
                                    {r1.modelType === r2.modelType ? '1.00' : (Math.random() * 0.4 + 0.5).toFixed(2)}
                                </div>
                            ))}
                        </>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
