import React, { useState, useEffect, Fragment, useMemo } from 'react';
import {
  History,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Settings2,
} from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

function MiniSparkline({ data, width, height, color }: { data: number[], width: number, height: number, color: string }) {
  if (!data || data.length === 0) return <div style={{width, height}} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((val - min) / range) * innerHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="opacity-80 mix-blend-screen" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

interface Trade {
  id: string;
  ticker: string;
  side: "BUY" | "SELL";
  price: number;
  amount: number;
  status: "FILLED" | "PENDING" | "REJECTED";
  timestamp: string;
  realizedPnL?: number;
  trendLine?: number[];
}

// Mock data generator
const generateMockTrades = (count: number): Trade[] => {
  const tickers = [
    "BTCUSDT",
    "ETHUSDT",
    "SOLUSDC",
    "XRPUSDT",
    "ADAUSDT",
    "DOGEUSDT",
    "AVAXUSDT",
  ];
  const trades: Trade[] = [];

  const now = new Date();

  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.5;
    const pastDate = new Date(
      now.getTime() - Math.floor(Math.random() * 1000000000),
    );
    const statusRand = Math.random();
    const isFilled = statusRand > 0.2;
    
    // Generate mock trend line
    let currentPrice = 100;
    const trendLine = Array.from({ length: 15 }, () => {
       const change = (Math.random() - 0.5) * 5;
       currentPrice += change;
       return currentPrice;
    });

    trades.push({
      id: `TRD-${Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0")}`,
      ticker: tickers[Math.floor(Math.random() * tickers.length)],
      side: isBuy ? "BUY" : "SELL",
      price: Math.random() * 1000 + (isBuy ? 0 : 50),
      amount: Math.random() * 10,
      status:
        isFilled ? "FILLED" : statusRand > 0.1 ? "PENDING" : "REJECTED",
      timestamp: pastDate.toISOString(),
      realizedPnL: (!isBuy && isFilled) ? (Math.random() * 200 - 100) : 0,
      trendLine,
    });
  }

  return trades.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
};

export const TradeHistory = React.memo(function TradeHistory({ journalEntries = [] }: { journalEntries?: any[] }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orderHistory'), orderBy('time', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mappedTrades: Trade[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ticker: data.symbol,
          side: data.type === 'BUY' ? 'BUY' : 'SELL',
          price: data.price || 0,
          amount: data.quantity || 0,
          status: 'FILLED',
          timestamp: data.time?.toDate?.().toISOString() || data.time,
          realizedPnL: data.pnl || 0,
          trendLine: []
        };
      });
      setTrades(mappedTrades);
      setLoading(false);
    }, (error) => {
      if (String(error).includes('Failed to fetch')) {
        setLoading(false);
        return;
      }
      console.error("Failed to fetch trades:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [columns, setColumns] = useState({
    date: { label: "Dato", visible: true },
    ticker: { label: "Aktiv", visible: true },
    trend: { label: "Trend", visible: true },
    side: { label: "Side", visible: true },
    price: { label: "Pris", visible: true },
    amount: { label: "Mængde", visible: true },
    fee: { label: "Gebyr", visible: false },
    execTime: { label: "Tid", visible: false },
    status: { label: "Status", visible: true },
    pnl: { label: "PnL", visible: true },
    orderId: { label: "Ordre ID", visible: false },
  });
  const itemsPerPage = 5;

  const totalPages = Math.ceil(trades.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentTrades = trades.slice(startIndex, startIndex + itemsPerPage);
  
  const totalPnL = currentTrades.reduce((sum, trade) => sum + (trade.realizedPnL || 0), 0);

  const tradesWithPnL = useMemo(() => {
    return currentTrades.filter(
      (t) => t.status === "FILLED" && t.realizedPnL !== undefined && t.realizedPnL !== 0
    );
  }, [currentTrades]);

  const winningTrades = useMemo(() => {
    return tradesWithPnL.filter((t) => t.realizedPnL !== undefined && t.realizedPnL > 0);
  }, [tradesWithPnL]);

  const winRate = useMemo(() => {
    return tradesWithPnL.length > 0
      ? (winningTrades.length / tradesWithPnL.length) * 100
      : 0;
  }, [winningTrades, tradesWithPnL]);

  const getStatusIcon = (trade: Trade) => {
    const isLoss = trade.realizedPnL !== undefined && trade.realizedPnL < 0;
    switch (trade.status) {
      case "FILLED":
        return <CheckCircle2 className={`size-4 ${isLoss ? "text-rose-400" : "text-emerald-400"}`} />;
      case "PENDING":
        return <Clock className="size-4 text-amber-400" />;
      case "REJECTED":
        return <XCircle className="size-4 text-rose-400" />;
    }
  };

  const getStatusColor = (trade: Trade) => {
    const isLoss = trade.realizedPnL !== undefined && trade.realizedPnL < 0;
    switch (trade.status) {
      case "FILLED":
        return isLoss ? "text-rose-400 bg-rose-400/10" : "text-emerald-400 bg-emerald-400/10";
      case "PENDING":
        return "text-amber-400 bg-amber-400/10";
      case "REJECTED":
        return "text-rose-400 bg-rose-400/10";
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const cumulativeData = useMemo(() => {
    return [...trades]
      .reverse()
      .filter((t) => t.status === "FILLED" && t.realizedPnL !== undefined)
      .reduce((acc, t) => {
        const prevTotal = acc.length > 0 ? acc[acc.length - 1].total : 0;
        acc.push({
          date: new Date(t.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
          total: prevTotal + (t.realizedPnL || 0),
        });
        return acc;
      }, [] as { date: string; total: number }[]);
  }, [trades]);

  const exportToCSV = () => {
    const headers = ["Dato", "Aktiv", "Side", "Pris", "Mængde", "Status", "PnL", "Ordre ID"];
    const csvContent = [
      headers.join(","),
      ...trades.map(t => {
        const date = new Date(t.timestamp).toLocaleString();
        return [
          `"${date}"`,
          `"${t.ticker}"`,
          `"${t.side}"`,
          t.price,
          t.amount,
          `"${t.status}"`,
          t.realizedPnL || 0,
          `"${t.id}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "trade_history.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({
      ...prev,
      [key]: { ...prev[key], visible: !prev[key].visible }
    }));
  };

  const winLossStats30Days = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) return { wins: 0, losses: 0, ratio: 0, total: 0, wlRatio: '0.00' };
    
    let wins = 0;
    let losses = 0;
    let total = 0;
    const now = new Date().getTime();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const positions: Record<string, { totalAmount: number; count: number }> = {};
    
    [...journalEntries].reverse().forEach((entry) => {
      const entryTime = new Date(entry.time).getTime();
      
      if (entry.side === "BUY") {
        if (!positions[entry.ticker]) {
          positions[entry.ticker] = { totalAmount: 0, count: 0 };
        }
        positions[entry.ticker].totalAmount += entry.price;
        positions[entry.ticker].count += 1;
      } else if (entry.side === "SELL") {
        if (positions[entry.ticker] && positions[entry.ticker].count > 0) {
          const avgBuyPrice = positions[entry.ticker].totalAmount / positions[entry.ticker].count;
          const tradeProfit = entry.price - avgBuyPrice;
          
          if (entryTime >= thirtyDaysAgo) {
            total += 1;
            if (tradeProfit > 0) {
              wins += 1;
            } else {
              losses += 1;
            }
          }
          
          positions[entry.ticker].totalAmount -= avgBuyPrice;
          positions[entry.ticker].count -= 1;
        } else {
          if (entryTime >= thirtyDaysAgo) {
             total += 1;
             if (entry.price > 0) {
                 wins += 1;
             } else {
                 losses += 1;
             }
          }
        }
      }
    });

    const ratio = total > 0 ? wins / total : 0;
    const wlRatio = losses > 0 ? (wins / losses).toFixed(2) : wins > 0 ? '∞' : '0.00';
    return { wins, losses, ratio: ratio * 100, total, wlRatio };
  }, [journalEntries]);

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-shrink-0">
            <History className="size-4 text-cyan-400" /> Ordrehistorik
          </h3>
          {winLossStats30Days.total > 0 && (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold whitespace-nowrap">30d Win Rate</span>
              <span className={`text-xs font-mono font-bold ${winLossStats30Days.ratio >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                {winLossStats30Days.ratio.toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                ({winLossStats30Days.wins}W / {winLossStats30Days.losses}L)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {trades.length} handler totalt
          </span>
          <button
            onClick={exportToCSV}
            disabled={loading || trades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Eksportér CSV</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-colors ${showSettings ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-300"}`}
            >
              <Settings2 className="size-4" />
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-800 bg-gray-900/50">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Synlige kolonner</p>
                  </div>
                  <div className="p-2 flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
                    {Object.entries(columns).map(([key, colValue]) => {
                      const col = colValue as { label: string; visible: boolean };
                      return (
                      <button
                        key={key}
                        onClick={() => toggleColumn(key as any)}
                        className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-800 text-left"
                      >
                        <span className={`text-xs ${col.visible ? "text-gray-300 font-medium" : "text-gray-500"}`}>{col.label}</span>
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${col.visible ? "bg-cyan-500 border-cyan-500 text-white" : "border-gray-700 bg-gray-900/50"}`}>
                           {col.visible && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                      </button>
                    )})}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-800 bg-gray-900/30">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Win/Loss Ratio (30d)</p>
            <p className="text-xl font-mono text-white">
              {winLossStats30Days.wlRatio}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Trades (30d)</p>
            <p className="text-xl font-mono text-white flex items-center gap-2">
              {winLossStats30Days.total}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Net Wins vs Losses</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-mono text-emerald-400">{winLossStats30Days.wins}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-xs font-mono text-rose-400">{winLossStats30Days.losses}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!loading && cumulativeData.length > 0 && (
        <div className="p-4 border-b border-gray-800/50 bg-gray-900/20 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeData}>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                     const total = payload[0].value as number;
                     return (
                       <div className="bg-gray-900 border border-gray-800 p-2 rounded shadow-xl">
                         <p className="text-[10px] text-gray-400 mb-1">{payload[0].payload.date}</p>
                         <p className={`text-xs font-mono font-bold ${total >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                           Udvikling: {total >= 0 ? "+" : ""}{formatCurrency(total)}
                         </p>
                       </div>
                     );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#22d3ee" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full p-8 min-h-[250px]">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="min-h-[250px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-900/80 uppercase text-[10px] tracking-wider text-gray-500 sticky top-0 z-10">
                <tr>
                  {columns.date.visible && <th className="px-4 py-3 font-medium">Dato</th>}
                  {columns.ticker.visible && <th className="px-4 py-3 font-medium">Aktiv</th>}
                  {columns.trend.visible && <th className="px-4 py-3 font-medium text-center">Trend</th>}
                  {columns.side.visible && <th className="px-4 py-3 font-medium">Side</th>}
                  {columns.price.visible && <th className="px-4 py-3 font-medium text-right">Pris</th>}
                  {columns.amount.visible && <th className="px-4 py-3 font-medium text-right">Mængde</th>}
                  {columns.fee.visible && <th className="px-4 py-3 font-medium text-right">Gebyr</th>}
                  {columns.execTime.visible && <th className="px-4 py-3 font-medium">Tid</th>}
                  {columns.status.visible && <th className="px-4 py-3 font-medium text-center">Status</th>}
                  {columns.pnl.visible && <th className="px-4 py-3 font-medium text-right">PnL</th>}
                  {columns.orderId.visible && <th className="px-4 py-3 font-medium">Ordre ID</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {currentTrades.map((trade) => (
                  <Fragment key={trade.id}>
                    <motion.tr
                      className="group cursor-pointer relative"
                      onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                      whileHover={{ 
                        scale: 1.01, 
                        backgroundColor: "rgba(31, 41, 55, 0.4)",
                        boxShadow: "inset 0 0 0 1px rgba(34, 211, 238, 0.3), 0 0 10px rgba(34, 211, 238, 0.1)"
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {columns.date.visible && (
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(trade.timestamp).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      )}
                      {columns.ticker.visible && (
                        <td className="px-4 py-3 font-bold text-white">
                          {trade.ticker}
                        </td>
                      )}
                      {columns.trend.visible && (
                        <td className="px-4 py-3 w-20">
                          <MiniSparkline data={trade.trendLine || []} width={60} height={20} color={trade.realizedPnL && trade.realizedPnL < 0 ? '#fb7185' : '#34d399'} />
                        </td>
                      )}
                      {columns.side.visible && (
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trade.side === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                            {trade.side}
                          </span>
                        </td>
                      )}
                      {columns.price.visible && (
                        <td className={`px-4 py-3 text-right font-mono ${trade.realizedPnL !== undefined && trade.realizedPnL !== 0 ? (trade.realizedPnL > 0 ? "text-emerald-400" : "text-rose-400") : "text-gray-300"}`}>
                          {formatCurrency(trade.price)}
                        </td>
                      )}
                      {columns.amount.visible && (
                        <td className="px-4 py-3 text-right font-mono text-gray-300">
                          {trade.amount.toFixed(4)}
                        </td>
                      )}
                      {columns.fee.visible && (
                        <td className="px-4 py-3 text-right font-mono text-gray-400">
                          {formatCurrency(trade.price * trade.amount * 0.001)}
                        </td>
                      )}
                      {columns.execTime.visible && (
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                          {new Date(trade.timestamp).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      )}
                      {columns.status.visible && (
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(trade)}`}>
                              {getStatusIcon(trade)}
                              <span className="hidden sm:inline">
                                {trade.status}
                              </span>
                            </span>
                          </div>
                        </td>
                      )}
                      {columns.pnl.visible && (
                        <td className="px-4 py-3 text-right font-mono">
                          {trade.realizedPnL !== undefined && trade.realizedPnL !== 0 ? (
                            <span className={trade.realizedPnL > 0 ? "text-emerald-400" : "text-rose-400"}>
                              {trade.realizedPnL > 0 ? "+" : ""}{formatCurrency(trade.realizedPnL)}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      )}
                      {columns.orderId.visible && (
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                          {trade.id}
                        </td>
                      )}
                    </motion.tr>
                    <AnimatePresence initial={false}>
                      {expandedId === trade.id && (
                        <tr className="bg-gray-900/40 border-b border-gray-800/50">
                          <td colSpan={Object.values(columns).filter((c: any) => c.visible).length} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                  <p className="text-gray-500 mb-1 font-medium">Ordre ID</p>
                                  <p className="text-gray-300 font-mono">{trade.id}</p>
                                </div>
                                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                  <p className="text-gray-500 mb-1 font-medium">Udførelsestid</p>
                                  <p className="text-gray-300">
                                    {new Date(trade.timestamp).toLocaleString([], {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                  <p className="text-gray-500 mb-1 font-medium">Handelsgebyr (Estimeret)</p>
                                  <p className="text-gray-300 font-mono">{formatCurrency(trade.price * trade.amount * 0.001)}</p>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))}
                {currentTrades.length === 0 && (
                  <tr>
                    <td
                      colSpan={Object.values(columns).filter((c: any) => c.visible).length}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Ingen handelshistorik fundet
                    </td>
                  </tr>
                )}
                {currentTrades.length > 0 && (
                  <tr className="bg-gray-900/60 border-t border-gray-800">
                    <td colSpan={Object.values(columns).filter((c: any) => c.visible).length - 1} className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-widest">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Win Rate:</span>
                          <span className={`font-mono text-xs font-bold ${winRate >= 50 ? "text-emerald-400" : winRate > 0 ? "text-rose-400" : "text-gray-500"}`}>
                            {tradesWithPnL.length > 0 ? `${winRate.toFixed(1)}%` : "N/A"}
                          </span>
                          {tradesWithPnL.length > 0 && (
                            <span className="text-[10px] text-gray-500 lowercase normal-case ml-1">
                              ({winningTrades.length}/{tradesWithPnL.length} vundne)
                            </span>
                          )}
                        </div>
                        <span>Total Realiseret PnL:</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {totalPnL >= 0 ? "+" : ""}{formatCurrency(totalPnL)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 flex items-center justify-between bg-gray-900/30">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs text-gray-500">
          Side <span className="text-white font-medium">{page}</span> af{" "}
          <span className="text-white font-medium">
            {Math.max(1, totalPages)}
          </span>
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || loading}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
});

