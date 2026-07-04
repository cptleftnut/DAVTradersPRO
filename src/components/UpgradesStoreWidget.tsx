import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical, ChevronLeft, ChevronRight, ShoppingCart, Zap, BrainCircuit, Users, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const UpgradesStoreWidget = React.memo(({ 
  widgetOrder, 
  draggedIndex, 
  handleDragStart, 
  handleDragOver, 
  handleDrop, 
  handleDragEnd, 
  moveWidget,
  onOpenProModal,
  userEmail
}: any) => {

  const isFreeUser = userEmail === 'djminirocker@gmail.com';

  const handleBuy = (item: string) => {
    if (isFreeUser) {
      toast.success(`${item} aktiveret gratis!`);
      return;
    }
      toast.info(`Initialiserer køb af ${item}... Venter på blockchain bekræftelse.`);
  };

  return (
    <motion.div 
      layout
      style={{ order: widgetOrder.indexOf('upgradesStore') }}
      className={`p-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative group transition-all duration-300 ${draggedIndex === widgetOrder.indexOf('upgradesStore') ? 'opacity-40 ring-2 ring-purple-500/40 bg-purple-500/5' : ''}`}
    >
      {/* Reordering Header */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3 py-1.5 bg-gray-950/95 border border-gray-850 rounded-t-xl text-[9px] uppercase font-bold tracking-widest absolute -top-5 left-4 right-4 z-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
         <span className="flex items-center gap-1.5 text-purple-500 cursor-grab active:cursor-grabbing">
           <GripVertical className="size-3.5" />
           Marketplace & Upgrades
         </span>
         <div className="flex items-center gap-1 text-gray-400 font-mono">
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('upgradesStore'), -1); }} 
             disabled={widgetOrder.indexOf('upgradesStore') === 0} 
             className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
             title="Flyt op / venstre"
           >
             <ChevronLeft className="size-3.5" />
           </button>
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); moveWidget(widgetOrder.indexOf('upgradesStore'), 1); }} 
             disabled={widgetOrder.indexOf('upgradesStore') === widgetOrder.length - 1} 
             className="p-1 hover:bg-gray-850 hover:text-white rounded disabled:opacity-30 transition-colors"
             title="Flyt ned / højre"
           >
             <ChevronRight className="size-3.5" />
           </button>
         </div>
      </div>

      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
               <ShoppingCart className="size-5 text-purple-500" />
             </div>
             <div>
                 <h2 className="text-xl font-bold tracking-tight">Premium Butik</h2>
                 <p className="text-xs text-gray-400 font-mono">Maksimer din indtjening med add-ons</p>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          
          {/* Item 1 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-amber-500/50 transition-colors flex flex-col justify-between group">
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <Zap className="size-5 text-amber-500" />
                          <h3 className="font-bold text-white text-sm">Quantum Eksekvering</h3>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">POPULÆR</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Få adgang til vores hurtigste servere i Tokyo og Frankfurt. 4x hurtigere eksekvering, perfekt til HFT scalping.
                  </p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                  <div className="font-mono text-sm font-bold">{isFreeUser ? <span className="text-emerald-500">GRATIS</span> : <><strike className="text-gray-600">$49</strike> $49<span className="text-[10px] text-gray-500 font-normal">/md</span></>}</div>
                  <button onClick={() => handleBuy('Quantum Eksekvering')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${isFreeUser ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>{isFreeUser ? 'Aktivér' : 'Opgrader'}</button>
              </div>
          </div>

          {/* Item 2 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-indigo-500/50 transition-colors flex flex-col justify-between group">
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <BrainCircuit className="size-5 text-indigo-500" />
                          <h3 className="font-bold text-white text-sm">AI Pro Model</h3>
                      </div>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">SMART</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Opgrader den neurale motor til at bruge real-time on-chain data og social sentiment analyse (Twitter/Reddit).
                  </p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                  <div className="font-mono text-sm font-bold">{isFreeUser ? <span className="text-emerald-500">GRATIS</span> : <><strike className="text-gray-600">$9.99</strike> $9.99<span className="text-[10px] text-gray-500 font-normal">/md</span></>}</div>
                  <button onClick={onOpenProModal} className="px-4 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-400 transition-colors">Læs Mere</button>
              </div>
          </div>

          {/* Item 3 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-emerald-500/50 transition-colors flex flex-col justify-between group">
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <Users className="size-5 text-emerald-500" />
                          <h3 className="font-bold text-white text-sm">Whale Copy Trading</h3>
                      </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Lad din bot automatisk kopiere trades fra de top 1% mest profitable adresser på netværket.
                  </p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                  <div className="font-mono text-sm font-bold flex flex-col">
                      {isFreeUser ? <span className="text-emerald-500">GRATIS</span> : <span>$19.99<span className="text-[10px] text-gray-500 font-normal">/md</span></span>}
                      <span className="text-[9px] text-emerald-500">+2.5% Profit Share</span>
                  </div>
                  <button onClick={() => handleBuy('Whale Copy Trading')} className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors">Aktivér</button>
              </div>
          </div>

          {/* Item 4 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-blue-500/50 transition-colors flex flex-col justify-between group">
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <FileText className="size-5 text-blue-500" />
                          <h3 className="font-bold text-white text-sm">Skat & Rapportering</h3>
                      </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Generer 100% automatiseret, revisorgodkendt skatterapport (PDF/CSV) til Skattestyrelsen ved årets udgang.
                  </p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                  <div className="font-mono text-sm font-bold">{isFreeUser ? <span className="text-emerald-500">GRATIS</span> : <><strike className="text-gray-600">$29</strike> $29<span className="text-[10px] text-gray-500 font-normal">/år</span></>}</div>
                  <button onClick={() => handleBuy('Skat & Rapportering')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${isFreeUser ? 'bg-emerald-500 text-black border-emerald-500 hover:bg-emerald-400' : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700'}`}>{isFreeUser ? 'Aktivér' : 'Køb Nu'}</button>
              </div>
          </div>

      </div>
    </motion.div>
  );
});
