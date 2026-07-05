import { useState, useEffect } from 'react';
import { ShieldAlert, Percent, Activity, Save, Landmark, AlertCircle, Info, PieChart, TrendingDown, ShieldCheck, Target, Zap, Check, ArrowRight, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function RiskManagementModule() {
  // Core limits
  const [stopLoss, setStopLoss] = useState(5);
  const [maxPositionSize, setMaxPositionSize] = useState(2);
  const [maxSectorExposure, setMaxSectorExposure] = useState(20);
  const [portfolioRisk, setPortfolioRisk] = useState(1.5);
  const [isSaving, setIsSaving] = useState(false);

  // Bot Specific Risk Model
  const [botStopLoss, setBotStopLoss] = useState(5.0);
  const [botTakeProfit, setBotTakeProfit] = useState(10.0);
  const [isApplyingBotModel, setIsApplyingBotModel] = useState(false);
  const [simulatedPricePercent, setSimulatedPricePercent] = useState(0.0);

  // Fetch current bot state on load
  useEffect(() => {
    fetch('/api/bot/state')
      .then(res => res.json())
      .then(state => {
        if (state) {
          if (state.stopLoss) setBotStopLoss(state.stopLoss);
          if (state.takeProfit) setBotTakeProfit(state.takeProfit);
        }
      })
      .catch(err => { if (!String(err).includes('Failed to fetch')) console.error('Fejl ved indlæsning af bot-risiko:', err); });
  }, []);

  const handleApplyBotRiskModel = async (sl: number, tp: number) => {
    setIsApplyingBotModel(true);
    try {
      const res = await fetch('/api/bot/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stopLoss: sl,
          takeProfit: tp,
          stopLossType: 'percentage'
        })
      });
      if (res.ok) {
        toast.success(`Risikostyringsmodel opdateret! Stop-Loss: ${sl}%, Take-Profit: ${tp}% er nu AKTIV.`);
      } else {
        toast.error('Kunne ikke gemme risikoparametre på serveren.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Netværksfejl under lagring af risikostyring.');
    } finally {
      setIsApplyingBotModel(false);
    }
  };

  // Calculator state
  const [accountSize, setAccountSize] = useState(10000);
  const [volatility, setVolatility] = useState(2.5);
  const [riskPerTrade, setRiskPerTrade] = useState(1.0);

  // Position Sizing Calculation
  // Optimal Allocation = (Capital * Risk %) / (Volatility % * 1.5)
  const stopLossDistance = volatility * 1.5; // stop loss placed at 1.5x of volatility (ATR)
  const optimalSizeAmount = stopLossDistance > 0 ? (accountSize * (riskPerTrade / 100)) / (stopLossDistance / 100) : 0;
  const optimalSizePercent = accountSize > 0 ? (optimalSizeAmount / accountSize) * 100 : 0;

  // Cap at max position size rule if calculated size exceeds it
  const finalAdvisedSizePercent = Math.min(optimalSizePercent, maxPositionSize);
  const finalAdvisedSizeAmount = (accountSize * finalAdvisedSizePercent) / 100;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Risikostyringsregler gemt succesfuldt. Bot vil anvende nye grænser på næste trade.');
    }, 600);
  };

  // Static Sector Diversification Advice
  const sectors = [
    { name: 'Teknologi & IT', recommended: 30, color: 'bg-cyan-500' },
    { name: 'Finans', recommended: 20, color: 'bg-indigo-500' },
    { name: 'Sundhedspleje (Healthcare)', recommended: 20, color: 'bg-emerald-500' },
    { name: 'Energi & Industri', recommended: 15, color: 'bg-amber-500' },
    { name: 'Cyklisk Forbrug (Consumer)', recommended: 15, color: 'bg-rose-500' },
  ];

  // Simulator helper
  const getSimulatorStatus = () => {
    if (simulatedPricePercent <= -botStopLoss) {
      return {
        label: 'Stop-Loss Udløst (SÆLG)',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        desc: `Prisen faldt med ${Math.abs(simulatedPricePercent).toFixed(1)}% (Grænse: -${botStopLoss}%). Positionen lukkes automatisk for at forhindre yderligere tab.`,
        badgeColor: 'bg-rose-500',
        pctColor: 'text-rose-500'
      };
    }
    if (simulatedPricePercent >= botTakeProfit) {
      return {
        label: 'Take-Profit Udløst (SÆLG)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        desc: `Prisen steg med ${simulatedPricePercent.toFixed(1)}% (Grænse: +${botTakeProfit}%). Positionen sælges automatisk for at sikre gevinsten.`,
        badgeColor: 'bg-emerald-500',
        pctColor: 'text-emerald-500'
      };
    }
    return {
      label: 'Position Aktiv (OVERVÅGES)',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: `Aktivet handles i det neutrale bånd (${simulatedPricePercent >= 0 ? '+' : ''}${simulatedPricePercent.toFixed(1)}%). Botten overvåger prisen kontinuerligt.`,
      badgeColor: 'bg-amber-500',
      pctColor: 'text-amber-500'
    };
  };

  const simStatus = getSimulatorStatus();

  return (
    <div className="space-y-8">
      {/* Stock Trader Bot Risk Model & Simulator Card */}
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800 relative overflow-hidden">
        {/* Glowing background shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-indigo-600 p-2 rounded-2xl shadow-lg">
              <ShieldCheck className="size-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                Aktietrader Bot Risikomodel
              </h3>
              <p className="text-xs text-gray-400">Automatisk tabsbegrænsning og gevinsthjemtagning i realtid.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setBotStopLoss(5.0);
              setBotTakeProfit(10.0);
              handleApplyBotRiskModel(5.0, 10.0);
            }}
            disabled={isApplyingBotModel}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50"
          >
            <Zap className="size-4 fill-current" />
            {isApplyingBotModel ? 'Anvender...' : 'Anvend Standardmodel (10% TP / 5% SL)'}
          </button>
        </div>

        {/* Info Box detailing the design parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
          <div className="bg-gray-950 p-5 rounded-2xl border border-gray-850 flex items-start gap-4 hover:border-rose-500/30 transition-all">
            <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 shrink-0">
              <TrendingDown className="size-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5">
                5% Stop-Loss Mekanisme
                <span className="text-[10px] bg-rose-950/40 text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-900/40 font-bold font-sans">
                  Aktiv
                </span>
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Når botten åbner en position, overvåges prisen konstant. Hvis prisen falder med <strong>mere end {botStopLoss}%</strong> i forhold til din anskaffelseskurs, eksekveres en øjeblikkelig salgsordre for at beskytte handelskapitalen.
              </p>
            </div>
          </div>

          <div className="bg-gray-950 p-5 rounded-2xl border border-gray-850 flex items-start gap-4 hover:border-emerald-500/30 transition-all">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 shrink-0">
              <Target className="size-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5">
                10% Take-Profit Funktion
                <span className="text-[10px] bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-900/40 font-bold font-sans">
                  Aktiv
                </span>
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Botten lukker automatisk positionen og realiserer afkastet, så snart prisen stiger med <strong>{botTakeProfit}% eller derover</strong>. Dette låser gevinster fast automatisk uden behov for manuel markedsmonitorering.
              </p>
            </div>
          </div>
        </div>

        {/* Live Config & Visual Interactive Simulator */}
        <div className="bg-gray-950/60 p-6 rounded-2xl border border-gray-850 relative z-10">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6 font-mono flex items-center gap-2">
            <Sliders className="size-4 text-amber-500" />
            Interaktiv Prissimulator & Finjustering
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Fine tuning parameters */}
            <div className="space-y-5 lg:col-span-1">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Finjuster Stop-Loss</label>
                  <span className="text-xs font-mono font-bold text-rose-400">-{botStopLoss}%</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={botStopLoss}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBotStopLoss(val);
                    handleApplyBotRiskModel(val, botTakeProfit);
                  }}
                  className="w-full accent-rose-500 h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Finjuster Take-Profit</label>
                  <span className="text-xs font-mono font-bold text-emerald-400">+{botTakeProfit}%</span>
                </div>
                <input 
                  type="range"
                  min="2"
                  max="30"
                  step="0.5"
                  value={botTakeProfit}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBotTakeProfit(val);
                    handleApplyBotRiskModel(botStopLoss, val);
                  }}
                  className="w-full accent-emerald-500 h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-gray-900">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                  <Info className="size-3 shrink-0" />
                  <span>Når du flytter skyderne, gemmes og opdateres din Autopilot Bot risiko-profil automatisk på serveren.</span>
                </div>
              </div>
            </div>

            {/* Simulated price drag & response status */}
            <div className="lg:col-span-2 bg-gray-950 p-5 rounded-xl border border-gray-900/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Test Prisudsving Live</span>
                  <span className="text-[10px] text-gray-500 font-mono">Træk for at ændre pris</span>
                </div>

                {/* Price slider */}
                <div className="relative pt-6 pb-2 px-1">
                  {/* Visual limits indicators */}
                  <div className="absolute top-0 left-0 text-[10px] font-mono text-rose-500 font-semibold">-${botStopLoss}%</div>
                  <div className="absolute top-0 right-0 text-[10px] font-mono text-emerald-500 font-semibold">+{botTakeProfit}%</div>
                  
                  {/* Slider line color coded bands */}
                  <div className="relative w-full h-2 rounded-full overflow-hidden bg-gray-900 mb-4">
                    {/* Stop loss band (red) */}
                    <div className="absolute top-0 left-0 h-full bg-rose-500/20" style={{ width: `${Math.max(0, Math.min(100, (botStopLoss / 27) * 100))}%` }} />
                    {/* Middle band */}
                    <div className="absolute top-0 h-full bg-amber-500/10" style={{ left: `${(botStopLoss / 27) * 100}%`, right: `${(1 - (botTakeProfit + botStopLoss) / 27) * 100}%` }} />
                    {/* Take profit band (green) */}
                    <div className="absolute top-0 right-0 h-full bg-emerald-500/20" style={{ width: `${Math.max(0, Math.min(100, (1 - botTakeProfit / 27) * 100))}%` }} />
                  </div>

                  <input 
                    type="range"
                    min="-12"
                    max="15"
                    step="0.1"
                    value={simulatedPricePercent}
                    onChange={(e) => setSimulatedPricePercent(parseFloat(e.target.value))}
                    className="w-full accent-white h-2 opacity-0 absolute top-7 left-0 cursor-pointer z-20"
                  />
                  {/* Custom beautiful slider handle overlay */}
                  <div className="relative w-full h-1 pointer-events-none -mt-5">
                    {/* Calculate handle percentage position based on slider bounds (-12 to +15 is range of 27) */}
                    {(() => {
                      const pct = ((simulatedPricePercent + 12) / 27) * 100;
                      return (
                        <div 
                          className="absolute size-4 rounded-full bg-white border-2 border-gray-950 shadow-md flex items-center justify-center -translate-x-1/2 -top-1.5 transition-all duration-75"
                          style={{ left: `${pct}%` }}
                        >
                          <div className="size-1.5 rounded-full bg-amber-500" />
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* State indicator message */}
                <div className={`p-4 rounded-xl border mt-4 transition-all duration-300 ${simStatus.color}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`size-2 rounded-full ${simStatus.badgeColor}`} />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">{simStatus.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{simStatus.desc}</p>
                </div>
              </div>

              {/* Graphic Flow of automation */}
              <div className="grid grid-cols-5 gap-1 text-[10px] text-gray-500 font-mono mt-4 pt-4 border-t border-gray-900 items-center text-center">
                <span className="text-left font-bold text-gray-400">Start (Køb)</span>
                <ArrowRight className="size-3 mx-auto text-gray-700" />
                <span className="text-amber-500/80">Svingninger</span>
                <ArrowRight className="size-3 mx-auto text-gray-700" />
                <span className="text-right font-bold text-gray-400">Automatisk Luk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Configuration Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-5 text-rose-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Risikostyringsmodul</h3>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
          >
            <Save className="size-4" />
            {isSaving ? 'Gemmer...' : 'Gem Regler'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-950 p-4 rounded-xl border border-gray-800"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <TrendingDown className="size-3 text-rose-400" />
                Global Stop-Loss
              </span>
              <span className="text-sm font-mono text-white font-bold">{stopLoss}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={stopLoss} 
              onChange={(e) => setStopLoss(parseInt(e.target.value) || 1)}
              className="w-full accent-rose-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-gray-500 mt-2 font-mono">Luk automatisk alle positioner, der falder under denne tærskel for at beskytte mod ekstreme fald.</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-950 p-4 rounded-xl border border-gray-800"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Activity className="size-3 text-indigo-400" />
                Max Positionsstørrelse
              </span>
              <span className="text-sm font-mono text-white font-bold">{maxPositionSize}%</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="10" 
              step="0.5"
              value={maxPositionSize} 
              onChange={(e) => setMaxPositionSize(parseFloat(e.target.value) || 0.5)}
              className="w-full accent-indigo-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-gray-500 mt-2 font-mono">Maksimale allokering til én enkelt handel baseret på samlet porteføljeværdi.</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-950 p-4 rounded-xl border border-gray-800"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <PieChart className="size-3 text-emerald-400" />
                Max Sektor Eksponering
              </span>
              <span className="text-sm font-mono text-white font-bold">{maxSectorExposure}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="50" 
              step="5"
              value={maxSectorExposure} 
              onChange={(e) => setMaxSectorExposure(parseInt(e.target.value) || 5)}
              className="w-full accent-emerald-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-gray-500 mt-2 font-mono">Grænse for hvor stor en procentdel af porteføljen der må investeres i en enkelt sektor (diversificeringsregel).</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-950 p-4 rounded-xl border border-gray-800"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Percent className="size-3 text-amber-400" />
                Portefølje Risiko Tolerance
              </span>
              <span className="text-sm font-mono text-white font-bold">{portfolioRisk}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1"
              value={portfolioRisk} 
              onChange={(e) => setPortfolioRisk(parseFloat(e.target.value) || 0.1)}
              className="w-full accent-amber-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-gray-500 mt-2 font-mono">Maksimal acceptabel risiko for hele porteføljen (bruges til Kelly Kriterium justeringer).</p>
          </motion.div>
        </div>
      </div>

      {/* Position Sizing Calculator */}
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <Landmark className="size-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Positionsstørrelse Beregner</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="space-y-4 lg:col-span-1">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Kontostørrelse ($)</label>
              <input 
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Asset Volatilitet (ATR %)</label>
              <input 
                type="number"
                step="0.1"
                value={volatility}
                onChange={(e) => setVolatility(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Risiko Tolerance pr. Trade (%)</label>
              <input 
                type="number"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Real-time result visualization */}
          <div className="lg:col-span-2 bg-gray-950 p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="size-4 text-cyan-400" />
                Optimal Handelsallokering (Resultat)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Anbefalet beløb</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                    ${finalAdvisedSizeAmount.toLocaleString('da-DK', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Portefølje Andel</p>
                  <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">
                    {finalAdvisedSizePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 pt-4 border-t border-gray-900">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span>Volatilitets-baseret stop-loss distance (1.5x ATR):</span>
                <span className="text-white font-bold">{stopLossDistance.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span>Ujusteret Kelly-allokering:</span>
                <span className="text-white font-bold">{optimalSizePercent.toFixed(2)}% (${optimalSizeAmount.toFixed(0)})</span>
              </div>
              {optimalSizePercent > maxPositionSize && (
                <div className="bg-amber-950/20 text-amber-500 text-[10px] p-2.5 rounded-lg border border-amber-900/40 flex items-start gap-2">
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                  <span>
                    Beregnet allokering overskrider din <strong>Maks. Positionsstørrelse ({maxPositionSize}%)</strong>. For at overholde risikoreglene er allokeringen droslet ned til grænsen.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diversification Strategy recommendations across sectors */}
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="size-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Sektor Diversificeringsstrategi</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-2">Foreslåede Sektormaksima</h4>
            <div className="space-y-3">
              {sectors.map((sec, i) => {
                const isOverExposed = sec.recommended > maxSectorExposure;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-300">{sec.name}</span>
                      <span className="text-white font-bold">Foreslået: {sec.recommended}%</span>
                    </div>
                    <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden">
                      <div className={`${sec.color} h-full transition-all duration-500`} style={{ width: `${sec.recommended}%` }} />
                    </div>
                    {isOverExposed && (
                      <p className="text-[9px] text-amber-500 font-mono">⚠️ Sektoranbefaling overskrider din generelle regel på {maxSectorExposure}%!</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono mb-3">Strategisk Diversificeringstip</h4>
            <div className="space-y-4 text-xs font-mono text-gray-400 leading-relaxed">
              <div className="flex gap-2 items-start">
                <span className="text-emerald-400 font-bold shrink-0">1.</span>
                <p><strong>Cyklisk og defensiv balance:</strong> IT og Teknologi er volatile. Balancer altid med defensive sektorer som Sundhedspleje og Forbrug for at dæmpe porteføljens beta.</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-emerald-400 font-bold shrink-0">2.</span>
                <p><strong>Maksimal eksponering:</strong> Dit nuværende maks-loft på <strong className="text-white">{maxSectorExposure}%</strong> sikrer, at du er beskyttet mod pludselige sektorspecifikke krak.</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-emerald-400 font-bold shrink-0">3.</span>
                <p><strong>Korrelationstjek:</strong> Sørg for at vælge aktiver med lav indbyrdes korrelation. Se Korrelationsmatriklen længere nede for at se den aktuelle statistiske samvarians.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
