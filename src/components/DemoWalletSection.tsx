import { useState, useEffect } from "react";
import { Wallet, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export function DemoWalletSection() {
  const [wallet, setWallet] = useState<{ asset: string; free: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bot/state");
      const data = await res.json();
      // Assume the wallet data structure is in botState
      if (data.wallet) {
          setWallet(data.wallet.spot);
      } else {
        // Fallback or handle initial empty state
        setWallet([]);
      }
    } catch (error: any) {
      if (String(error).includes('Failed to fetch')) return;
      console.error("Failed to fetch demo wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/reset-wallet", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet.spot);
        toast.success("Demo wallet nulstillet!");
      }
    } catch (error) {
      toast.error("Kunne ikke nulstille demo wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Wallet className="size-5 text-amber-500" /> Demo Wallet
        </h3>
        <button
          onClick={resetWallet}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-amber-500 transition-colors"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Nulstil / Optank
        </button>
      </div>
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
        key={JSON.stringify(wallet)}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {wallet.map((asset) => (
          <div key={asset.asset} className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{asset.asset}</p>
            <p className="font-mono text-sm text-gray-100">{parseFloat(asset.free).toFixed(4)}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
