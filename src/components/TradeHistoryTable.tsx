import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { History, RefreshCw, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Trade {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  time: any;
}

export const TradeHistoryTable: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'orderHistory'), orderBy('time', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTrades = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[];
      setTrades(fetchedTrades);
      setLoading(false);
      setCurrentPage(0);
    });

    return () => unsubscribe();
  }, [refreshTrigger]);

  const paginatedTrades = trades.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const totalPages = Math.ceil(trades.length / itemsPerPage);

  // Prepare data for chart (oldest first)
  const chartData = [...trades].reverse();

  const exportToCSV = () => {
    if (trades.length === 0) return;

    const headers = ['Date', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Gain/Loss'];
    const rows = trades.map(trade => {
      const date = trade.time?.toDate ? new Date(trade.time.toDate()).toLocaleString() : '';
      return [
        `"${date}"`,
        `"${trade.symbol}"`,
        `"${trade.type}"`,
        trade.entryPrice || 0,
        trade.exitPrice || 0,
        trade.pnl || 0
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trade-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden p-4 transition-all duration-300 hover:scale-[1.01] hover:z-10 relative">
      <h3 className="text-sm font-bold text-white flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-cyan-400" /> Seneste Transaktioner
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 rounded-lg transition-colors cursor-pointer" 
            title="Eksportér CSV"
          >
            <Download className="size-3.5" />
            <span>Eksporter CSV</span>
          </button>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)} 
            className="p-1.5 hover:bg-gray-800 rounded-lg border border-gray-800 transition-colors cursor-pointer" 
            title="Refresh"
          >
            <RefreshCw className="size-3.5 text-gray-400" />
          </button>
        </div>
      </h3>
      {loading ? (
        <div className="text-gray-500 text-xs">Indlæser...</div>
      ) : (
        <>
          <div className="h-48 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-700)" />
                <XAxis dataKey="time" tickFormatter={(t) => t?.toDate ? new Date(t.toDate()).toLocaleDateString() : ''} tick={{fontSize: 10, fill: 'var(--color-gray-500)'}} />
                <YAxis tick={{fontSize: 10, fill: 'var(--color-gray-500)'}} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-gray-900)', borderColor: 'var(--color-gray-700)', fontSize: '12px', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-gray-200)' }}
                  labelFormatter={(t) => t?.toDate ? new Date(t.toDate()).toLocaleDateString() : ''}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gain/Loss']}
                />
                <Bar dataKey="pnl">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="py-2 min-w-[80px]">Dato</th>
                  <th className="py-2 min-w-[60px]">Symbol</th>
                  <th className="py-2 min-w-[50px]">Type</th>
                  <th className="py-2 text-right min-w-[70px]">Entry</th>
                  <th className="py-2 text-right min-w-[70px]">Exit</th>
                  <th className="py-2 text-right min-w-[70px]">Gain/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedTrades.map(trade => (
                  <tr key={trade.id} className="text-gray-300">
                    <td className="py-3 font-mono whitespace-nowrap">
                      {trade.time?.toDate ? new Date(trade.time.toDate()).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 font-bold whitespace-nowrap">{trade.symbol}</td>
                    <td className={`py-3 font-bold ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.type}
                    </td>
                    <td className="py-3 text-right font-mono whitespace-nowrap">${trade.entryPrice?.toFixed(2) ?? '-'}</td>
                    <td className="py-3 text-right font-mono whitespace-nowrap">${trade.exitPrice?.toFixed(2) ?? '-'}</td>
                    <td className={`py-3 text-right font-mono whitespace-nowrap ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.pnl !== undefined ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Forrige
              </button>
              <span>Side {currentPage + 1} af {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Næste
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
