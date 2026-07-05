import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

export const DailyPerformanceMetric: React.FC = () => {
  const [dailyPnL, setDailyPnL] = useState(0);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'orderHistory'),
      where('time', '>=', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalPnL = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (typeof data.pnl === 'number') {
          totalPnL += data.pnl;
        }
      });
      setDailyPnL(totalPnL);
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1"
    >
      <div className="flex items-center gap-2 mb-2">
         <p className="text-[10px] uppercase tracking-widest text-gray-500">Daily Performance</p>
         <DollarSign className="size-3 text-gray-600" />
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-3xl sm:text-4xl font-bold font-mono tracking-tighter ${dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
           {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}
        </p>
        {dailyPnL >= 0 ? (
          <TrendingUp className="size-6 text-emerald-500" />
        ) : (
          <TrendingDown className="size-6 text-rose-500" />
        )}
      </div>
    </motion.div>
  );
};
