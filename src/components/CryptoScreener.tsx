import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

export interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export function CryptoScreener() {
  const [data, setData] = useState<BinanceTicker24hr[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"volume" | "gainers" | "losers">(
    "volume",
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/binance-proxy/ticker/24hr");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let allData: any = await response.json();

      if (!Array.isArray(allData)) {
          if (allData && allData.symbol) {
              allData = [allData];
          } else {
              console.warn("Expected array from binance proxy, got:", typeof allData, allData);
              const errMsg = allData?.msg || allData?.message || allData?.error || "Invalid response format";
              throw new Error(`Binance API Error: ${errMsg}`);
          }
      }

      const usdtPairs = allData.filter(
        (d: any) =>
          d.symbol && 
          (d.symbol.endsWith("USDT") || d.symbol.endsWith("USDC")) &&
          !d.symbol.includes("UPUSDT") &&
          !d.symbol.includes("DOWNUSDT") &&
          !d.symbol.includes("UPUSDC") &&
          !d.symbol.includes("DOWNUSDC"),
      );

      if (usdtPairs.length === 0) {
        throw new Error("No USDT/USDC pairs found in response");
      }

      setData(usdtPairs);
    } catch (err: any) {
      if (!String(err).includes('Failed to fetch')) console.error("Failed to fetch screener data:", err);
      // Fallback to mock data to prevent app crash and empty state
      const mockData: BinanceTicker24hr[] = [
        { symbol: "BTCUSDT", priceChange: "1230.5", priceChangePercent: "1.8", lastPrice: "68350.20", quoteVolume: "2450000000", volume: "35800" } as any,
        { symbol: "ETHUSDT", priceChange: "-50.4", priceChangePercent: "-1.2", lastPrice: "3490.15", quoteVolume: "1100000000", volume: "315000" } as any,
        { symbol: "SOLUSDC", priceChange: "12.3", priceChangePercent: "8.5", lastPrice: "156.70", quoteVolume: "850000000", volume: "5420000" } as any,
        { symbol: "BNBUSDT", priceChange: "5.2", priceChangePercent: "0.8", lastPrice: "585.30", quoteVolume: "350000000", volume: "598000" } as any,
        { symbol: "XRPUSDT", priceChange: "0.01", priceChangePercent: "1.5", lastPrice: "0.52", quoteVolume: "250000000", volume: "480000000" } as any,
        { symbol: "ADAUSDT", priceChange: "-0.02", priceChangePercent: "-3.4", lastPrice: "0.45", quoteVolume: "120000000", volume: "266000000" } as any,
        { symbol: "DOGEUSDT", priceChange: "0.015", priceChangePercent: "9.2", lastPrice: "0.165", quoteVolume: "950000000", volume: "5700000000" } as any,
        { symbol: "AVAXUSDT", priceChange: "-1.5", priceChangePercent: "-3.2", lastPrice: "45.30", quoteVolume: "180000000", volume: "3970000" } as any,
      ];
      setData(mockData);
      setError(err.message || "Failed to load real screener data. Showing mock data.");
    } finally {
      setLoading(false);
    }
  };

  const [isTabActive, setIsTabActive] = useState(() => typeof document !== 'undefined' ? !document.hidden : true);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, isTabActive ? 60000 : 300000); // 1m active, 5m inactive
    return () => clearInterval(interval);
  }, [isTabActive]);

  const getSortedData = () => {
    let sorted = [...data];
    if (filter === "volume") {
      sorted.sort(
        (a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume),
      );
    } else if (filter === "gainers") {
      sorted.sort(
        (a, b) =>
          parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent),
      );
    } else if (filter === "losers") {
      sorted.sort(
        (a, b) =>
          parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent),
      );
    }
    return sorted.slice(0, 15); // Top 15
  };

  const displayData = getSortedData();

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Crypto Screener</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("volume")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === "volume" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" : "bg-gray-800 text-gray-400 hover:text-white border border-transparent"}`}
          >
            Highest Volume
          </button>
          <button
            onClick={() => setFilter("gainers")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === "gainers" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-gray-800 text-gray-400 hover:text-white border border-transparent"}`}
          >
            <TrendingUp className="size-3" /> Top Gainers
          </button>
          <button
            onClick={() => setFilter("losers")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === "losers" ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-gray-800 text-gray-400 hover:text-white border border-transparent"}`}
          >
            <TrendingDown className="size-3" /> Top Losers
          </button>
          <button
            onClick={fetchData}
            className="ml-2 p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        {error && (
          <div className="text-center py-2 mb-4 text-amber-500 font-mono text-xs bg-amber-500/10 rounded-lg border border-amber-500/20">
            {error}
          </div>
        )}
        {loading && data.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <RefreshCw className="size-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-mono text-gray-500">
                <th className="pb-3 pl-2 font-medium">SYMBOL</th>
                <th className="pb-3 text-right font-medium">PRICE</th>
                <th className="pb-3 text-right font-medium">24H CHANGE</th>
                <th className="pb-3 text-right font-medium">
                  24H VOLUME (USDT/USDC)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {displayData.map((item) => {
                const changeNum = parseFloat(item.priceChangePercent);
                const isPositive = changeNum >= 0;
                const price = parseFloat(item.lastPrice);
                const vol = parseFloat(item.quoteVolume);

                return (
                  <tr
                    key={item.symbol}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-3 pl-2">
                      <div className="font-bold text-white flex items-center gap-2">
                        {item.symbol.replace("USDT", "")}
                        <span className="text-[10px] text-gray-500 font-mono">
                          /USDT
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-gray-300">
                      $
                      {price < 0.01
                        ? price.toPrecision(4)
                        : price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                    </td>
                    <td className="py-3 text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded bg-opacity-10 text-xs font-bold font-mono ${isPositive ? "text-emerald-400 bg-emerald-400" : "text-rose-400 bg-rose-400"}`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {isPositive ? "+" : ""}
                        {changeNum.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-xs text-gray-400">
                      ${(vol / 1_000_000).toFixed(2)}M
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
