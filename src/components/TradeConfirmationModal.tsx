import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface TradeDetails {
  estimatedPrice: number;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType: string;
  symbol: string;
}

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tradeDetails: TradeDetails;
}

export function TradeConfirmationModal({ isOpen, onClose, onConfirm, tradeDetails }: TradeConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] p-6 w-full max-w-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Bekræft Ordre</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>


            <div className="bg-gray-900/60 rounded-xl p-4 mb-6 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">Forventet Effekt (Værdi)</div>
              <div className="text-2xl font-mono text-white mb-2">
                {tradeDetails.side === 'BUY' ? '-' : '+'}${(tradeDetails.quantity * tradeDetails.estimatedPrice).toFixed(2)}
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Dette er en estimeret værdi baseret på nuværende markedspris (\${tradeDetails.estimatedPrice.toFixed(2)}). Den endelige afviklingspris kan variere grundet slippage og markedsudsving under eksekvering.
              </p>
            </div>


            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Side</span>
                <span className={`font-bold ${tradeDetails.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{tradeDetails.side}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Symbol</span>
                <span className="font-mono text-white">{tradeDetails.symbol}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Mængde (Allocation)</span>
                <span className="font-mono text-white">{tradeDetails.quantity}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Estimeret Pris</span>
                <span className="font-mono text-white">\${tradeDetails.estimatedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Ordretype</span>
                <span className="font-mono text-white">{tradeDetails.orderType}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl transition-all font-bold uppercase text-xs tracking-widest"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 ${tradeDetails.side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'} text-white py-3 rounded-2xl transition-all font-bold uppercase text-xs tracking-widest`}
              >
                Bekræft
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
