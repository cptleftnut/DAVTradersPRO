import React from 'react';
import { motion } from 'motion/react';
import { 
  Palette, 
  Layout, 
  Eye, 
  Check, 
  Sparkles, 
  Sun, 
  Moon, 
  Leaf, 
  Grid, 
  Columns, 
  List, 
  Activity, 
  Lock,
  Compass
} from 'lucide-react';
import { toast } from 'sonner';

interface DesignCenterProps {
  activeTheme: 'obsidian' | 'alpine' | 'sage';
  setActiveTheme: (theme: 'obsidian' | 'alpine' | 'sage') => void;
  navStyle: 'grouped' | 'sidebar' | 'classic';
  setNavStyle: (style: 'grouped' | 'sidebar' | 'classic') => void;
  widgetOrder?: string[];
  setWidgetOrder?: (order: string[]) => void;
}

export const DesignCenter: React.FC<DesignCenterProps> = ({
  activeTheme,
  setActiveTheme,
  navStyle,
  setNavStyle,
  widgetOrder = [],
  setWidgetOrder
}) => {
  return (
    <div className="space-y-6" id="design-center-container">
      {/* Dynamic Header */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${
        activeTheme === 'alpine' 
          ? 'bg-slate-100 border-slate-200 text-slate-800' 
          : activeTheme === 'sage' 
            ? 'bg-[#1a241c] border-emerald-950/40 text-[#e4eae5]' 
            : 'bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-white/5 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit border ${
              activeTheme === 'alpine' 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                : activeTheme === 'sage' 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Sparkles className="size-3 animate-pulse" />
              Visuel Optimering
            </span>
            <h3 className="text-xl font-black uppercase tracking-wider flex items-center gap-2.5 mt-2.5">
              <Palette className="size-6 text-indigo-500" />
              Design & Layout Center
            </h3>
            <p className="text-xs mt-1 max-w-2xl leading-relaxed opacity-80">
              Gør din handelsskærm mere overskuelig. Skift layout-navigation for at mindske støj eller vælg et farvetema, der passer til dine belysningsforhold og mindsker øjentræthed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Selector (Farvetemaer) */}
        <div className={`p-5 rounded-3xl border text-left transition-all duration-300 ${
          activeTheme === 'alpine' ? 'bg-white border-slate-200' : activeTheme === 'sage' ? 'bg-[#18201a] border-emerald-900/10' : 'bg-gray-950/40 border-white/5'
        }`}>
          <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${
            activeTheme === 'alpine' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            <Palette className="size-4 text-indigo-500" /> 1. Vælg Farvetema (Design Eksempler)
          </h4>

          <div className="space-y-3.5">
            {/* Obsidian Dark */}
            <div 
              onClick={() => {
                setActiveTheme('obsidian');
                toast.success('Farvetema skiftet: Obsidian Dark');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                activeTheme === 'obsidian' 
                  ? 'bg-indigo-950/30 border-indigo-500/40' 
                  : 'bg-black/20 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-gray-900 text-amber-500 rounded-xl">
                  <Moon className="size-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Obsidian Dark (Standard)</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5">Klassisk mørkt cyber-dashboard med neonfarvede indikatorer.</p>
                </div>
              </div>
              {activeTheme === 'obsidian' && (
                <div className="p-1 bg-indigo-500/20 text-indigo-400 rounded-full">
                  <Check className="size-3.5" />
                </div>
              )}
            </div>

            {/* Alpine Light */}
            <div 
              onClick={() => {
                setActiveTheme('alpine');
                toast.success('Farvetema skiftet: Alpine Light (Professionel)');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                activeTheme === 'alpine' 
                  ? 'bg-indigo-50 border-indigo-300 text-slate-800' 
                  : 'bg-black/20 border-white/5 hover:border-slate-200 text-gray-400'
              }`}
            >
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-slate-100 text-indigo-600 rounded-xl">
                  <Sun className="size-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'alpine' ? 'text-slate-950' : 'text-gray-300'}`}>Alpine Light</h5>
                  <p className="text-[10px] mt-0.5 opacity-80">Høj-kontrast lys skærm. Perfekt til dagslys og udendørs brug.</p>
                </div>
              </div>
              {activeTheme === 'alpine' && (
                <div className="p-1 bg-indigo-600 text-white rounded-full">
                  <Check className="size-3.5" />
                </div>
              )}
            </div>

            {/* Nordic Sage */}
            <div 
              onClick={() => {
                setActiveTheme('sage');
                toast.success('Farvetema skiftet: Nordic Sage (Beroligende)');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                activeTheme === 'sage' 
                  ? 'bg-[#1a251e] border-emerald-500/30' 
                  : 'bg-black/20 border-white/5 hover:border-emerald-950/30'
              }`}
            >
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-[#1b261d]/80 text-emerald-400 rounded-xl">
                  <Leaf className="size-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Nordic Sage</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5">Dæmpede grønlige toner. Reducerer øjentræthed ved lange sessioner.</p>
                </div>
              </div>
              {activeTheme === 'sage' && (
                <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                  <Check className="size-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Style Selector */}
        <div className={`p-5 rounded-3xl border text-left transition-all duration-300 ${
          activeTheme === 'alpine' ? 'bg-white border-slate-200' : activeTheme === 'sage' ? 'bg-[#18201a] border-emerald-900/10' : 'bg-gray-950/40 border-white/5'
        }`}>
          <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${
            activeTheme === 'alpine' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            <Layout className="size-4 text-indigo-500" /> 2. Strukturel Layout (Gør Siden Overskuelig)
          </h4>

          <div className="space-y-3.5">
            {/* Grouped Accordions */}
            <div 
              onClick={() => {
                setNavStyle('grouped');
                toast.success('Layout opdateret: Kategoriseret Navigation');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                navStyle === 'grouped' 
                  ? activeTheme === 'alpine' ? 'bg-indigo-50 border-indigo-300' : activeTheme === 'sage' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-indigo-950/30 border-indigo-500/40'
                  : 'bg-black/20 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex gap-3 items-center">
                <div className={`p-2.5 rounded-xl ${
                  activeTheme === 'alpine' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-950 text-indigo-400'
                }`}>
                  <Grid className="size-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'alpine' ? 'text-slate-900' : 'text-white'}`}>Kategoriseret Menu (Anbefalet)</h5>
                  <p className="text-[10px] mt-0.5 opacity-85">Deler alle 13 faner op i 3 rene overskuelige hovedgrupper.</p>
                </div>
              </div>
              {navStyle === 'grouped' && (
                <div className={`p-1 rounded-full ${activeTheme === 'alpine' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  <Check className="size-3.5" />
                </div>
              )}
            </div>

            {/* Sidebar Left */}
            <div 
              onClick={() => {
                setNavStyle('sidebar');
                toast.success('Layout opdateret: Sidepanel Navigation');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                navStyle === 'sidebar' 
                  ? activeTheme === 'alpine' ? 'bg-indigo-50 border-indigo-300' : activeTheme === 'sage' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-indigo-950/30 border-indigo-500/40'
                  : 'bg-black/20 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex gap-3 items-center">
                <div className={`p-2.5 rounded-xl ${
                  activeTheme === 'alpine' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-950 text-indigo-400'
                }`}>
                  <Columns className="size-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'alpine' ? 'text-slate-900' : 'text-white'}`}>Sidepanel (Maksimal Plads)</h5>
                  <p className="text-[10px] mt-0.5 opacity-85">Flytter navigationslisten til et diskret lodret sidepanel.</p>
                </div>
              </div>
              {navStyle === 'sidebar' && (
                <div className={`p-1 rounded-full ${activeTheme === 'alpine' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  <Check className="size-3.5" />
                </div>
              )}
            </div>

            {/* Classic row */}
            <div 
              onClick={() => {
                setNavStyle('classic');
                toast.success('Layout opdateret: Klassisk række');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                navStyle === 'classic' 
                  ? activeTheme === 'alpine' ? 'bg-indigo-50 border-indigo-300' : activeTheme === 'sage' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-indigo-950/30 border-indigo-500/40'
                  : 'bg-black/20 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex gap-3 items-center">
                <div className={`p-2.5 rounded-xl ${
                  activeTheme === 'alpine' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-950 text-indigo-400'
                }`}>
                  <List className="size-4" />
                </div>
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'alpine' ? 'text-slate-900' : 'text-white'}`}>Traditionel Række</h5>
                  <p className="text-[10px] mt-0.5 opacity-85">Originalt horisontalt scrollbar-liste med alle knapper på stribe.</p>
                </div>
              </div>
              {navStyle === 'classic' && (
                <div className={`p-1 rounded-full ${activeTheme === 'alpine' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  <Check className="size-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout Presets Selector */}
      {setWidgetOrder && (
        <div className={`p-5 rounded-3xl border text-left transition-all duration-300 ${
          activeTheme === 'alpine' ? 'bg-white border-slate-200' : activeTheme === 'sage' ? 'bg-[#18201a] border-emerald-900/10' : 'bg-gray-950/40 border-white/5'
        }`}>
          <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${
            activeTheme === 'alpine' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            <Grid className="size-4 text-indigo-500" /> 3. Layout Presets (Widget Rækkefølge)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              {
                id: 'default',
                name: 'Standard Dashboard',
                description: 'Balanceret visning',
                order: ['agentControl', 'walletSummary', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'],
                icon: <Layout className="size-4" />
              },
              {
                id: 'analyst',
                name: 'Analyst View',
                description: 'Grafer og performance i fokus',
                order: ['realtimeTabs', 'aiPerformance', 'walletSummary', 'agentControl', 'risikostyring', 'maeglerforbindelse'],
                icon: <Activity className="size-4" />
              },
              {
                id: 'trading',
                name: 'Trading View',
                description: 'Handel og Wallet øverst',
                order: ['agentControl', 'walletSummary', 'maeglerforbindelse', 'realtimeTabs', 'aiPerformance', 'risikostyring'],
                icon: <Compass className="size-4" />
              }
            ].map(preset => {
              const isActive = JSON.stringify(widgetOrder) === JSON.stringify(preset.order);
              return (
                <div 
                  key={preset.id}
                  onClick={() => {
                    setWidgetOrder(preset.order);
                    toast.success(`Layout opdateret: ${preset.name}`);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-start ${
                    isActive 
                      ? activeTheme === 'alpine' ? 'bg-indigo-50 border-indigo-300' : activeTheme === 'sage' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-indigo-950/30 border-indigo-500/40'
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex gap-3 items-start w-full">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      activeTheme === 'alpine' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-950 text-indigo-400'
                    }`}>
                      {preset.icon}
                    </div>
                    <div className="pr-2">
                      <h5 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'alpine' ? 'text-slate-900' : 'text-white'}`}>{preset.name}</h5>
                      <p className="text-[10px] mt-0.5 opacity-85 leading-tight">{preset.description}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className={`absolute top-3 right-3 p-1 rounded-full shrink-0 ${activeTheme === 'alpine' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      <Check className="size-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cognitive Ease Checklist */}
      <div className={`p-5 rounded-3xl border text-left transition-all ${
        activeTheme === 'alpine' ? 'bg-slate-50 border-slate-200 text-slate-800' : activeTheme === 'sage' ? 'bg-[#161f18] border-emerald-900/10 text-gray-300' : 'bg-gray-950/20 border-white/5 text-gray-400'
      }`}>
        <h5 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 mb-3.5 ${
          activeTheme === 'alpine' ? 'text-slate-900 font-extrabold' : 'text-gray-200'
        }`}>
          <Eye className="size-4 text-indigo-500 animate-pulse" /> 4 tips til en mere overskuelig trading-hverdag
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className={`p-4 rounded-2xl border ${
            activeTheme === 'alpine' ? 'bg-white border-slate-200' : 'bg-black/20 border-white/5'
          }`}>
            <span className="font-bold text-indigo-500 block mb-1">1. Kategoriser</span>
            <p className="text-[11px] leading-relaxed opacity-85">
              Brug den <strong>Kategoriserede Menu</strong>. Det fjerner den lange vandrette liste af faner og erstatter den med 3 intuitive, faste genveje.
            </p>
          </div>
          <div className={`p-4 rounded-2xl border ${
            activeTheme === 'alpine' ? 'bg-white border-slate-200' : 'bg-black/20 border-white/5'
          }`}>
            <span className="font-bold text-emerald-500 block mb-1">2. Kontrast-bevidsthed</span>
            <p className="text-[11px] leading-relaxed opacity-85">
              Hvis du sidder i et lyst lokale, så skift til <strong>Alpine Light</strong>. Det forhindrer overanstrengelse af øjnene pga. refleksioner i skærmen.
            </p>
          </div>
          <div className={`p-4 rounded-2xl border ${
            activeTheme === 'alpine' ? 'bg-white border-slate-200' : 'bg-black/20 border-white/5'
          }`}>
            <span className="font-bold text-amber-500 block mb-1">3. Træk & Slip Widgets</span>
            <p className="text-[11px] leading-relaxed opacity-85">
              Du kan ændre rækkefølgen af widgets på forsiden ved at holde musen nede over overskrifterne og trække dem op/ned eller bruge pilene.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
