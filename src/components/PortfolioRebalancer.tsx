import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface Holding {
  asset: string;
  weight: number;
  targetWeight: number;
  value: number;
}

export function PortfolioRebalancer({
  userProfile = "Balanceret",
  walletData,
}: {
  userProfile?: string;
  walletData?: any;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [targets, setTargets] = useState<
    { asset: string; targetWeight: number }[]
  >([]);

  useEffect(() => {
    // Initialize default target weights based on selected risk profile
    if (userProfile === "Høj Risiko") {
      setTargets([
        { asset: "BTC", targetWeight: 45 },
        { asset: "ETH", targetWeight: 30 },
        { asset: "SOL", targetWeight: 20 },
        { asset: "USDT", targetWeight: 5 },
      ]);
    } else if (userProfile === "Lidt Risiko") {
      setTargets([
        { asset: "BTC", targetWeight: 20 },
        { asset: "ETH", targetWeight: 15 },
        { asset: "SOL", targetWeight: 5 },
        { asset: "USDT", targetWeight: 60 },
      ]);
    } else { // Balanceret
      setTargets([
        { asset: "BTC", targetWeight: 35 },
        { asset: "ETH", targetWeight: 25 },
        { asset: "SOL", targetWeight: 10 },
        { asset: "USDT", targetWeight: 30 },
      ]);
    }
  }, [userProfile]);

  const [holdings, setHoldings] = useState<Holding[]>([]);

  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!walletData || !walletData.spot) return;

    // Convert wallet spot array into an array of Holdings we can display
    const calculateHoldings = async () => {
      let newHoldings: Holding[] = [];
      let totalUsdtValue = 0;

      const relevantAssets = walletData.spot.filter(
        (s: any) => parseFloat(s.free) > 0 || parseFloat(s.locked) > 0,
      );

      for (const s of relevantAssets) {
        const qty = parseFloat(s.free) + parseFloat(s.locked);
        let price = 1;

        if (s.asset !== "USDT" && s.asset !== "USDC") {
          try {
            const res = await fetch(
              `/api/binance-proxy/ticker/price?symbol=${s.asset}USDT`,
            );
            if (res.ok) {
              const json = await res.json();
              price = parseFloat(json.price);
            }
          } catch (e) {} // Fallback to 1 if not paired with USDT
        }

        const val = qty * price;
        totalUsdtValue += val;
        newHoldings.push({
          asset: s.asset,
          weight: 0,
          targetWeight: 0,
          value: val,
        });
      }

      if (totalUsdtValue > 0) {
        newHoldings = newHoldings
          .map((h) => ({
            ...h,
            weight: Math.round((h.value / totalUsdtValue) * 100),
            targetWeight:
              targets.find((t) => t.asset === h.asset)?.targetWeight || 0,
          }))
          .sort((a, b) => b.weight - a.weight);
      }

      setHoldings(newHoldings);
    };

    calculateHoldings();
  }, [walletData, targets]);

  const targetColors: Record<string, string> = {
    BTC: "#f59e0b",
    ETH: "#6366f1",
    SOL: "#14b8a6",
    USDT: "#22c55e",
    USDC: "#0284c7",
  };

  const getColor = (asset: string, index: number) => {
    if (targetColors[asset]) return targetColors[asset];
    const colors = ["#8b5cf6", "#ec4899", "#f43f5e", "#a855f7"];
    return colors[index % colors.length];
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setSuggestion(null);
    try {
      const selectedModel =
        localStorage.getItem("ai_model") || "gemini-3.5-flash";
      const res = await fetch("/api/portfolio-rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProfile, walletData, model: selectedModel }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuggestion(data.suggestion);
        if (data.targets) {
          setTargets(data.targets);
        }
      } else {
        if (!data.error?.includes("429") && !data.error?.includes("kvote")) {
          toast.error(`Analysis failed: ${data.error}`);
        }
      }
    } catch (e: any) {
      if (!String(e).includes('Failed to fetch')) toast.error(`Network error: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecuteTrades = async () => {
    setExecuting(true);
    try {
      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
      const trades = [];
      for (const h of holdings) {
        if (h.asset === "USDT" || h.asset === "USDC") continue;

        const targetValue = totalValue * (h.targetWeight / 100);
        const diffUsdt = targetValue - h.value;

        if (Math.abs(diffUsdt) > 1) {
          // Only execute trades larger than 1 USDT
          trades.push({
            symbol: `${h.asset}USDT`,
            side: diffUsdt > 0 ? "BUY" : "SELL",
            allocation: Math.abs(diffUsdt),
          });
        }
      }

      // Sells first to free up USDT
      const sells = trades.filter((t) => t.side === "SELL");
      const buys = trades.filter((t) => t.side === "BUY");
      const allTrades = [...sells, ...buys];

      if (allTrades.length === 0) {
        toast.info("Ingen handler nødvendige. Porteføljen er i balance.");
        return;
      }

      for (const trade of allTrades) {
        toast.loading(`Udfører ${trade.side} ${trade.symbol}...`, {
          id: trade.symbol,
        });
        const res = await fetch("/api/trade/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: trade.symbol,
            side: trade.side,
            allocation: trade.allocation,
            isLiveTrading: false,
          }),
        });
        if (res.ok) {
          toast.success(
            `${trade.side} ${trade.symbol} udført (${trade.allocation.toFixed(2)} USDT)`,
            { id: trade.symbol },
          );
        } else {
          toast.error(`Fejl ved ${trade.side} ${trade.symbol}`, {
            id: trade.symbol,
          });
        }
        // Small delay to simulate sequential execution
        await new Promise((r) => setTimeout(r, 500));
      }

      toast.success("Alle anbefalede handler er nu udført!");
      setSuggestion(null); // Clear suggestion after execution
    } catch (e: any) {
      toast.error("Kunne ikke udføre handler");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="size-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            AI Portfolio Rebalancer
          </h2>
        </div>
        <span className="text-[10px] text-indigo-400 font-mono border border-indigo-500/30 px-2 py-1 rounded bg-indigo-500/10">
          Profil: {userProfile}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Current vs Target Allocation
          </h3>
          <div className="space-y-4">
            {holdings.map((h) => {
              const diff = h.weight - h.targetWeight;
              const isOver = diff > 0;
              return (
                <div key={h.asset} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{h.asset}</span>
                    <span className="font-mono text-gray-400 flex items-center gap-2">
                      {h.weight}% <ArrowRight className="size-3" />{" "}
                      {h.targetWeight}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(h.weight, h.targetWeight)}%`,
                        backgroundColor: targetColors[h.asset],
                      }}
                    ></div>
                    {isOver && (
                      <div
                        className="h-full bg-rose-500/50 transition-all duration-1000 striped-bg"
                        style={{ width: `${diff}%` }}
                      ></div>
                    )}
                  </div>
                  {diff !== 0 && (
                    <span
                      className={`text-[10px] font-mono text-right mt-0.5 ${isOver ? "text-rose-400" : "text-amber-400"}`}
                    >
                      {isOver ? "+" : ""}
                      {diff}% {isOver ? "Overweight" : "Underweight"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col bg-gray-950 p-4 rounded-2xl border border-gray-800 relative overflow-hidden">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bot className="size-4 text-indigo-400" /> AI Suggestions
          </h3>

          {!suggestion && !analyzing && (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
              <AlertTriangle className="size-8 text-gray-600 mb-3" />
              <p className="text-xs text-gray-500 font-mono mb-4">
                Porteføljen afviger fra din risikoprofil.
              </p>
              <button
                onClick={handleAnalyze}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                Kør AI Rebalancing
              </button>
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-center animate-pulse">
              <Loader2 className="size-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-xs text-gray-500 font-mono">
                Udregner portefølje-optimering...
              </p>
            </div>
          )}

          {suggestion && !analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed bg-indigo-950/20 p-3 rounded-lg border border-indigo-900/30 mb-4">
                {suggestion}
              </div>
              <button
                onClick={handleExecuteTrades}
                disabled={executing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing ? (
                  <>
                    Udfører... <Loader2 className="size-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Udfør Anbefalede Handler <TrendingUp className="size-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
