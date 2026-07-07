import React, { useState } from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface P2PPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  binancePayId?: string;
  referenceId: string;
}

export const P2PPaymentModal = React.memo(function P2PPaymentModal({
  isOpen,
  onClose,
  amount,
  currency = 'USDT',
  binancePayId = '854921043', // Left here for interface compat, but we use TRC20 address
  referenceId
}: P2PPaymentModalProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const trc20Address = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

  if (!isOpen) return null;

  const binancePayLink = `https://app.binance.com/qr/dplk?action=download&id=${binancePayId}&amount=${amount > 0 ? amount : ''}&currency=${currency}&ref=${referenceId}`;
  const qrData = encodeURIComponent(binancePayLink);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  const handleCopy = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} kopieret til udklipsholder`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <QrCode className="size-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-tight">Binance Pay</h3>
              <p className="text-xs text-gray-400">Scan QR for at betale via Binance Pay link</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center">
          
          <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
            <img src={qrUrl} alt="Binance Pay Link QR Code" className="w-48 h-48" />
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 mb-1">Amount to pay</p>
            <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {amount > 0 ? (
                 <>{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-amber-500">{currency}</span></>
              ) : (
                 <span className="text-2xl text-emerald-400">Valgfrit beløb</span>
              )}
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between group">
              <div className="overflow-hidden mr-4">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">Binance Pay Link</p>
                <p className="font-mono text-sm text-gray-200 truncate">{binancePayLink}</p>
              </div>
              <button 
                onClick={() => handleCopy(binancePayLink, setCopiedAddr, 'Binance Pay link')}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
                title="Copy Binance Pay link"
              >
                {copiedAddr ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between group">
              <div>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">Transaction Reference</p>
                <p className="font-mono text-sm text-emerald-400">{referenceId}</p>
              </div>
              <button 
                onClick={() => handleCopy(referenceId, setCopiedRef, 'Transaction Reference')}
                className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Copy Transaction Reference"
              >
                {copiedRef ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-950/50">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            I have completed the payment
          </button>
        </div>
      </div>
    </div>
  );
});
