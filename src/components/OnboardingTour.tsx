import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, ArrowRight, ArrowLeft, X, Sparkles, TrendingUp, Wallet, LayoutGrid, Layers, ShieldCheck, HelpCircle } from 'lucide-react';

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: ReactNode;
  tabToActivate?: 'dashboard' | 'live' | 'history' | 'wallet' | 'alerts' | 'analyses' | 'compare' | 'backtest' | 'journal' | 'scanner' | 'autopilot' | 'macro' | 'correlation' | 'risk' | 'design' | 'stocks';
}

const steps: TourStep[] = [
  {
    id: 'welcome',
    targetId: 'welcome-header',
    title: 'Velkommen til DAVs Trading Terminal!',
    description: 'Lad os tage en lynhurtig rundvisning i dit nye intelligente handelspanel. Vi vil guide dig igennem de mest essentielle widgets og den daglige trading workflow.',
    icon: <Sparkles className="text-amber-400 size-6 animate-pulse" />,
    tabToActivate: 'dashboard'
  },
  {
    id: 'navigation',
    targetId: 'trading-panel-categories',
    title: 'Kategorier & Moduler',
    description: 'Brug denne sidemenu til at navigere mellem live markedsdata, kvantitative analyser, historik, alarmsystemer og meget mere.',
    icon: <LayoutGrid className="text-cyan-400 size-6" />,
    tabToActivate: 'dashboard'
  },
  {
    id: 'paper-vs-live',
    targetId: 'trading-execution-card',
    title: 'Papirhandel (Sandbox)',
    description: 'VIGTIGT: For din sikkerhed er "Papirhandel" (Sandbox) aktiveret som standard. Her kan du afprøve ideer og handle risikofrit med simulerede midler. Du kan skifte til live-tilstand her, når du er klar.',
    icon: <ShieldCheck className="text-emerald-400 size-6" />,
    tabToActivate: 'live'
  },
  {
    id: 'manual-trade',
    targetId: 'trading-execution-card',
    title: 'Manuel Handels-eksekvering',
    description: 'Udfør manuelle ordrer (Køb/Sælg) øjeblikkeligt herfra. Du kan finjustere din allokering, aktivere automatisk Stop Loss, Trailing Stops og Smart-Routing split.',
    icon: <TrendingUp className="text-blue-400 size-6" />,
    tabToActivate: 'live'
  },
  {
    id: 'ai-copilot',
    targetId: 'toggle-copilot-btn',
    title: 'AI Copilot & Autopilot',
    description: 'Her konfigurerer og tænder du for AI Autopiloten. Når den er aktiv, vil automatiserede agenter scanne markedet og eksekvere handler baseret på de valgte strategier helt automatisk.',
    icon: <Bot className="text-purple-400 size-6" />,
    tabToActivate: 'autopilot'
  },
  {
    id: 'sidebar-widgets',
    targetId: 'widget-container-DailyPerformanceMetric',
    title: 'Bento-widgets & Layout',
    description: 'I højre side har du dine interaktive dashboard widgets. Du kan trække og slippe dem for at omarrangere dit layout, eller klikke på dem for at åbne en fuldskærms detaljevisning.',
    icon: <Layers className="text-amber-500 size-6 animate-bounce" />,
    tabToActivate: 'dashboard'
  }
];

interface OnboardingTourProps {
  onSidebarToggle: (isOpen: boolean) => void;
}

export function OnboardingTour({ onSidebarToggle }: OnboardingTourProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Auto start for new users
  useEffect(() => {
    const hasSeen = localStorage.getItem('onboarding_tour_complete');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setVisible(true);
        setCurrentStepIdx(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to manual start request
  useEffect(() => {
    const handleStartTour = () => {
      setVisible(true);
      setCurrentStepIdx(0);
    };
    window.addEventListener('start-onboarding-tour', handleStartTour);
    return () => window.removeEventListener('start-onboarding-tour', handleStartTour);
  }, []);

  const updateCoords = useCallback(() => {
    if (!visible || currentStepIdx < 0 || currentStepIdx >= steps.length) return;
    
    const step = steps[currentStepIdx];
    
    // Auto-toggle sidebar if we are highlighting sidebar widgets
    if (step.id === 'sidebar-widgets') {
      onSidebarToggle(true);
    }

    const target = document.getElementById(step.targetId);
    if (target) {
      const rect = target.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // If target element is not found (e.g. not rendered yet), clear coordinates
      setCoords(null);
    }
  }, [currentStepIdx, visible, onSidebarToggle]);

  // Handle active tab switching and step transitions
  useEffect(() => {
    if (!visible || currentStepIdx < 0 || currentStepIdx >= steps.length) return;

    const step = steps[currentStepIdx];
    if (step.tabToActivate && typeof (window as any).setBinancePanelTab === 'function') {
      (window as any).setBinancePanelTab(step.tabToActivate);
    }

    // Wait a brief moment for tab change and component rendering before updating coords
    const timer = setTimeout(() => {
      updateCoords();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStepIdx, visible, updateCoords]);

  // Handle window resizing and scrolls
  useEffect(() => {
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

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setVisible(false);
    setCurrentStepIdx(-1);
    setCoords(null);
    localStorage.setItem('onboarding_tour_complete', 'true');
  };

  if (!visible || currentStepIdx === -1) return null;

  const currentStep = steps[currentStepIdx];

  return (
    <div className="fixed inset-0 z-[250] pointer-events-none">
      {/* Spotlight Overlay */}
      <AnimatePresence>
        {coords && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 pointer-events-auto cursor-help"
            style={{
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${coords.left - 8}px 100%, 
                ${coords.left - 8}px ${coords.top - 8}px, 
                ${coords.left + coords.width + 8}px ${coords.top - 8}px, 
                ${coords.left + coords.width + 8}px ${coords.top + coords.height + 8}px, 
                ${coords.left - 8}px ${coords.top + coords.height + 8}px, 
                ${coords.left - 8}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
            onClick={handleComplete}
          />
        )}
      </AnimatePresence>

      {/* Tooltip Card Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          className="fixed z-[251] pointer-events-auto"
          style={{
            // Compute visual position near target or center of screen if coords are missing
            top: coords 
              ? Math.min(window.innerHeight - 340, Math.max(20, coords.top + coords.height + 15)) 
              : '50%',
            left: coords 
              ? Math.min(window.innerWidth - 380, Math.max(20, coords.left + coords.width / 2 - 170)) 
              : '50%',
            transform: coords ? 'none' : 'translate(-50%, -50%)',
            width: '340px'
          }}
        >
          <div className="bg-gray-900 border border-amber-500/40 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden text-left">
            {/* Glowing accents */}
            <div className="absolute top-0 right-0 p-10 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-10 bg-cyan-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 flex items-center justify-center">
                {currentStep.icon}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-gray-950 px-2 py-1 rounded-lg border border-gray-800">
                  Trin {currentStepIdx + 1} af {steps.length}
                </span>
                <button 
                  onClick={handleComplete}
                  className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  title="Spring rundvisning over"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-md font-bold text-white mb-2 flex items-center gap-1.5 uppercase tracking-tight italic relative z-10">
              {currentStep.title}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium mb-6 relative z-10">
              {currentStep.description}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-between relative z-10">
              <button
                onClick={handleBack}
                disabled={currentStepIdx === 0}
                className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border ${
                  currentStepIdx === 0 
                    ? 'text-gray-600 border-transparent cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white border-gray-800 hover:bg-gray-800 cursor-pointer'
                }`}
              >
                <ArrowLeft size={12} />
                Tilbage
              </button>

              <button 
                onClick={handleNext}
                className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-900/30 flex items-center gap-1.5 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{currentStepIdx === steps.length - 1 ? 'Afslut' : 'Næste'}</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
