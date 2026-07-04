import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, ArrowRight, Zap, Target, Activity, Settings, TrendingUp, BookOpen, Clock, Layers, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { speakTradeAction } from '../lib/speech';

export function GlobalCommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field (unless they hit Cmd+K)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        return; // Handled by App.tsx
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const commands = [
    { category: "Trading", icon: <TrendingUp className="size-4 text-emerald-400" />, label: "Quick Buy: BTC Market", action: () => { toast.success('Order requested: Buy BTC Market'); speakTradeAction('Buy'); onClose(); } },
    { category: "Trading", icon: <Target className="size-4 text-rose-400" />, label: "Quick Sell: ETH Market", action: () => { toast.success('Order requested: Sell ETH Market'); speakTradeAction('Sell'); onClose(); } },
    { category: "Analysis", icon: <Globe className="size-4 text-cyan-400" />, label: "Open Global Macro Panel", action: () => { toast.info('Navigerer til Global Macro'); onClose(); } },
    { category: "Analysis", icon: <Activity className="size-4 text-purple-400" />, label: "Run Neural Market Scan", action: () => { toast.info('Initiating deep neural scan...'); onClose(); } },
    { category: "System", icon: <Zap className="size-4 text-amber-400" />, label: "Toggle AI Trade Copilot", action: () => { toast.info('Copilot panel åbnet'); onClose(); } },
    { category: "System", icon: <Layers className="size-4 text-indigo-400" />, label: "View Portfolio Exposure Matrix", action: () => { toast.info('Åbner portefølje-oversigt...'); onClose(); } },
    { category: "System", icon: <BookOpen className="size-4 text-violet-400" />, label: "Open Trading Journal", action: () => { onClose(); } },
    { category: "Settings", icon: <Settings className="size-4 text-gray-400" />, label: "DAVs System Preferences", action: () => { onClose(); } }
  ];

  const filteredCommands = query 
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Group filtered commands by category
  const grouped = filteredCommands.reduce((acc, cmd) => {
     (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
     return acc;
  }, {} as Record<string, typeof commands>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-gray-900/90 border border-gray-800 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[101] overflow-hidden backdrop-blur-md"
          >
            <div className="flex items-center px-6 border-b border-gray-800/80">
               <Search className="size-6 text-gray-500 mr-4" />
               <input 
                 autoFocus
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Terminal Command (e.g., 'buy btc', 'macro')..."
                 className="w-full bg-transparent py-6 text-xl font-mono text-gray-200 outline-none placeholder-gray-600 focus:ring-0"
               />
               <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-950/50 px-3 py-1.5 rounded-lg border border-gray-800">
                 <Command className="size-3" /> K
               </div>
            </div>
            <div className="p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
               {Object.keys(grouped).length === 0 ? (
                 <div className="p-12 flex flex-col items-center justify-center text-gray-500 font-mono text-sm">
                    <Activity className="size-8 mb-4 opacity-50" />
                    No commands found matching "{query}"
                 </div>
               ) : (
                 <div className="space-y-4 p-2">
                   {Object.entries(grouped).map(([category, cmds]) => (
                     <div key={category} className="space-y-1">
                       <div className="px-4 py-2 text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
                         {category}
                       </div>
                       {cmds.map((cmd, i) => (
                          <button 
                             key={i}
                             onClick={cmd.action}
                             className="w-full flex items-center justify-between p-3 px-4 hover:bg-gray-800/80 rounded-xl transition-all group cursor-pointer text-left active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-4">
                               <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50 group-hover:border-gray-700 transition-colors shadow-inner">
                                 {cmd.icon}
                               </div>
                               <span className="text-gray-300 font-medium group-hover:text-white transition-colors text-sm font-mono tracking-wide">
                                 {cmd.label}
                               </span>
                            </div>
                            <ArrowRight className="size-4 text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                          </button>
                       ))}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
