import { X, Mic, Volume2, Search, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceGuideModalProps {
  onClose: () => void;
}

export function VoiceGuideModal({ onClose }: VoiceGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
             <div className="bg-amber-950/30 p-2 rounded-xl text-amber-500 border border-amber-900/50">
               <Mic className="size-5" />
             </div>
             <h2 className="text-xl font-bold text-white uppercase tracking-wider">Voice Guide</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
           <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-800">
              <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                 <Search className="size-4" /> Global Analysis Command
              </h3>
              <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                 You can click the microphone icon in the main search bar to use speech recognition to analyze symbols.
              </p>
              <div className="bg-black/40 rounded-lg p-3 border border-gray-800/80 font-mono text-xs text-gray-300">
                 Say: <span className="text-white font-bold">"Analyze AAPL"</span> or <span className="text-white font-bold">"Analyze Bitcoin"</span>
              </div>
           </div>

           <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-800">
              <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                 <FileText className="size-4" /> Trading Notes Dictation
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-3">
                 In the Trading Notes tab (for individual tickers), click the microphone to dictate your strategies and notes directly into text. It will keep listening until you click stop.
              </p>
              <div className="bg-black/40 rounded-lg p-3 border border-gray-800/80 font-mono text-xs text-gray-300">
                 Just talk normally to take hands-free notes.
              </div>
           </div>

           <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-800">
              <h3 className="text-rose-400 font-bold mb-2 flex items-center gap-2">
                 <Volume2 className="size-4" /> AI Voice Synthesis
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-3">
                 Look for the "Lyt til Analyse" (Listen to Analysis) button below completed AI assessments. The assistant will read the detailed market report aloud.
              </p>
              <div className="bg-black/40 rounded-lg p-3 border border-gray-800/80 font-mono text-xs text-gray-300">
                 Click the speaker icon to play or stop playback.
              </div>
           </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <button 
             onClick={onClose}
             className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl text-sm transition-colors uppercase tracking-widest"
          >
             Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
