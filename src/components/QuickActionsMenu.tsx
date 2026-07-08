import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Wallet, HelpCircle, X, Zap } from 'lucide-react';
import { toast } from 'sonner';

export const QuickActionsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Place Order',
      icon: Zap,
      action: () => {
        // TODO: Implement Place Order logic
        toast.info('Place Order action triggered');
        setIsOpen(false);
      }
    },
    {
      label: 'Check Balance',
      icon: Wallet,
      action: () => {
        // TODO: Implement Check Balance logic
        toast.info('Check Balance action triggered');
        setIsOpen(false);
      }
    },
    {
      label: 'Open Help',
      icon: HelpCircle,
      action: () => {
        // TODO: Implement Open Help logic
        toast.info('Open Help action triggered');
        setIsOpen(false);
      }
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 mb-4"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={action.action}
                className="flex items-center gap-3 bg-gray-900/90 backdrop-blur-md text-gray-200 px-4 py-3 rounded-2xl shadow-xl border border-white/10 hover:bg-gray-800 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
              >
                <action.icon className="size-4 text-amber-500" />
                {action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-amber-500 text-black p-4 rounded-full shadow-lg hover:bg-amber-400 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="size-6" /> : <Plus className="size-6" />}
      </button>
    </div>
  );
};
