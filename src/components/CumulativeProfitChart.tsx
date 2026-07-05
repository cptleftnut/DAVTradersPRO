import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

export const CumulativeProfitChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orderHistory'), orderBy('time', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let cumulative = 0;
      const processedData = snapshot.docs.map((doc) => {
        const entry = doc.data();
        const pnl = typeof entry.pnl === 'number' ? entry.pnl : 0;
        cumulative += pnl;
        
        const date = entry.time?.toDate ? entry.time.toDate() : new Date();
        
        return {
          time: date.toLocaleDateString(),
          cumulative: parseFloat(cumulative.toFixed(2)),
          pnl: pnl
        };
      });
      setData(processedData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] h-[300px]"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="size-4 text-emerald-500" />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Cumulative Profit</h3>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative Profit']}
          />
          <Area type="monotone" dataKey="cumulative" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
