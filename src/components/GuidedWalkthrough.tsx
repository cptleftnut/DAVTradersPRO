import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, ArrowRight, X, Sparkles, TrendingUp, Wallet, Eye, ChevronRight } from 'lucide-react';

interface Step {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: ReactNode;
}

const steps: Step[] = [
  {
    id: 'portfolio',
    targetId: 'portfolio-metrics',
    title: 'Portefølje Indblik',
    description: 'Her kan du se din samlede vækst, aktive agenter og realtidsopdateringer på din formue.',
    icon: <Wallet className="text-emerald-400 size-6" />
  },
  {
    id: 'ai-input',
    targetId: 'ai-analysis-input',
    title: 'AI Markedsanalyse',
    description: 'Indtast en ticker (fx BTC eller AAPL) og lad vores avancerede AI modeller analysere markedet for dig på sekunder.',
    icon: <Bot className="text-amber-500 size-6" />
  },
  {
    id: 'watchlist',
    targetId: 'watchlist-section',
    title: 'Din Overvågningsliste',
    description: 'Hold øje med de aktiver der betyder mest for dig. Watchlisten giver dig hurtig adgang til priser og AI sentiment.',
    icon: <Eye className="text-cyan-400 size-6" />
  }
];

export function GuidedWalkthrough() {
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem('walkthrough_complete');
    if (!hasSeen) {
      setTimeout(() => {
        setVisible(true);
        setCurrentStepIdx(0);
      }, 1500);
    }
  }, []);

  const updateCoords = useCallback(() => {
    if (currentStepIdx < 0 || currentStepIdx >= steps.length) return;
    const target = document.getElementById(steps[currentStepIdx].targetId);
    if (target) {
      const rect = target.getBoundingClientRect();
      setCoords({
        top: rect.top, // Store relative to viewport for fixed positioning
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStepIdx]);

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [updateCoords]);

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setVisible(false);
    localStorage.setItem('walkthrough_complete', 'true');
  };

  if (!visible || currentStepIdx === -1) return null;

  const currentStep = steps[currentStepIdx];

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Dimmed Background with Hole */}
      <AnimatePresence>
        {coords && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 pointer-events-auto"
            style={{
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${coords.left}px 100%, 
                ${coords.left}px ${coords.top}px, 
                ${coords.left + coords.width}px ${coords.top}px, 
                ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                ${coords.left}px ${coords.top + coords.height}px, 
                ${coords.left}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
            onClick={handleComplete}
          />
        )}
      </AnimatePresence>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed z-[201] pointer-events-auto"
          style={{
            top: coords ? Math.min(window.innerHeight - 300, Math.max(20, coords.top + coords.height + 20)) : '50%',
            left: coords ? Math.min(window.innerWidth - 340, Math.max(20, coords.left + coords.width / 2 - 160)) : '50%',
            transform: coords ? 'none' : 'translate(-50%, -50%)',
            width: '320px'
          }}
        >
          <div className="bg-gray-900 border border-amber-500/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl border border-gray-800">
                {currentStep.icon}
              </div>
              <button 
                onClick={handleComplete}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 italic uppercase tracking-tight">
              {currentStep.title}
              <Sparkles size={14} className="text-amber-500" />
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium mb-6">
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all ${i === currentStepIdx ? 'w-4 bg-amber-500' : 'w-2 bg-gray-800'}`} 
                  />
                ))}
              </div>
              <button 
                onClick={handleNext}
                className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2 group"
              >
                {currentStepIdx === steps.length - 1 ? 'Kom i gang' : 'Næste'}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
