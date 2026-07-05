import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Receipt } from 'lucide-react';

interface Trade {
  id: string;
  type: string;
  pnl: number;
  time: any;
  profitPercent?: number;
}

export const FeeAnalysisChart: React.FC = () => {
  const [data, setData] = useState<{ date: string; fee: number; cumulativeFee: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFees, setTotalFees] = useState(0);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'orderHistory'), orderBy('time', 'asc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let cumulativeFee = 0;
      let sumFees = 0;
      
      const processed = snapshot.docs.map(doc => {
        const trade = doc.data() as Trade;
        
        let estimatedFee = 0;
        
        // Try to derive original trade allocation from PNL and profit percentage
        // netPnl = (allocation * (profitPercent / 100)) - (allocation * 0.002)
        // allocation = netPnl / ((profitPercent / 100) - 0.002)
        
        if (trade.pnl !== undefined && trade.profitPercent !== undefined) {
           const profitRatio = (trade.profitPercent / 100);
           const ratioDiff = profitRatio - 0.002;
           if (Math.abs(ratioDiff) > 0.0001) {
              const alloc = trade.pnl / ratioDiff;
              estimatedFee = Math.abs(alloc * 0.002);
           } else {
              estimatedFee = Math.abs(trade.pnl) || 2; // fallback
           }
        } else {
           estimatedFee = 2.0; // fallback standard $1000 alloc = $2 fee
        }
        
        // Filter out absurd calculations
        if (estimatedFee < 0 || estimatedFee > 1000) {
            estimatedFee = 2.0;
        }

        cumulativeFee += estimatedFee;
        sumFees += estimatedFee;
        
        const dateStr = trade.time?.toDate ? new Date(trade.time.toDate()).toLocaleDateString() : '';
        
        return {
          date: dateStr,
          fee: estimatedFee,
          cumulativeFee: cumulativeFee
        };
      });

      // Group by date to make chart smoother if there are multiple trades a day
      const grouped: Record<string, { date: string; fee: number; cumulativeFee: number }> = {};
      let runningCumulative = 0;
      
      processed.forEach(item => {
          if (!grouped[item.date]) {
              grouped[item.date] = { date: item.date, fee: 0, cumulativeFee: 0 };
          }
          grouped[item.date].fee += item.fee;
      });
      
      const chartData = Object.values(grouped).map(item => {
          runningCumulative += item.fee;
          return {
             ...item,
             cumulativeFee: runningCumulative
          };
      });

      setData(chartData);
      setTotalFees(sumFees);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] hover:z-10 relative mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Receipt className="size-4 text-rose-400" /> 
          Trading Fee Analysis
        </h3>
        <div className="text-right">
           <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Estimated Fees</p>
           <p className="text-lg font-mono font-bold text-rose-400">${totalFees.toFixed(2)}</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-gray-500 text-xs py-10 text-center">Indlæser gebyr-data...</div>
      ) : data.length === 0 ? (
        <div className="text-gray-500 text-xs py-10 text-center">Ingen handelshistorik at analysere endnu.</div>
      ) : (
        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-700)" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: 'var(--color-gray-500)'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: 'var(--color-gray-500)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-gray-900)', borderColor: 'var(--color-gray-700)', fontSize: '12px', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--color-gray-200)' }}
                formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'fee' ? 'Daily Fees' : 'Cumulative Fees']}
              />
              <Area type="monotone" dataKey="cumulativeFee" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFee)" strokeWidth={2} />
              <Line type="monotone" dataKey="fee" stroke="#fca5a5" strokeWidth={1} dot={{ r: 2, fill: '#fca5a5' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
         <p className="text-xs text-rose-300 font-serif leading-relaxed">
            <strong className="font-bold">Optimization Insight:</strong> High-frequency trading (HFT) strategies can incur significant costs due to Maker/Taker fees (estimated ~0.1% per trade side). If cumulative fees drag your net PnL negatively, consider widening your Take Profit / Stop Loss thresholds or reducing allocation per trade.
         </p>
      </div>
    </div>
  );
};
