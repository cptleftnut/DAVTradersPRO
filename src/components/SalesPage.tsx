import { motion } from 'motion/react';
import { ArrowRight, Activity, ShieldCheck, Zap, BrainCircuit, TrendingUp, Lock, CheckCircle2, Clock, Wallet, ChevronDown, AlertTriangle, Crosshair, DollarSign, Rocket, Target, Globe, Cpu, Terminal, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SalesPage({ onGoToPlatform }: { onGoToPlatform: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-white selection:bg-amber-500 selection:text-black font-sans overflow-x-hidden">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-600/10 blur-[180px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[180px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-600/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Sticky Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#02040a]/80 backdrop-blur-2xl border-b border-white/5 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Activity className="size-8 text-amber-500 relative z-10" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white uppercase italic">DAVs<span className="text-amber-500">.</span></span>
          </div>
          <button
            onClick={onGoToPlatform}
            className="px-6 py-2.5 bg-white hover:bg-gray-100 text-black font-black rounded-full transition-all text-sm uppercase tracking-widest flex items-center gap-2 hover:-translate-y-0.5 shadow-lg"
          >
            Åbn Platform <ArrowRight className="size-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* HERO SECTION - Premium & Aggressive */}
        <section className="relative pt-40 pb-20 px-6 sm:px-12 flex flex-col items-center justify-center min-h-screen">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 font-bold text-xs sm:text-sm mb-8 uppercase tracking-[0.2em] backdrop-blur-md shadow-2xl">
              <Sparkles className="size-4 text-amber-500" />
              Næste generations algoritmisk handel
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-7xl md:text-[5.5rem] font-black text-white leading-[1.05] tracking-tighter mb-8 uppercase">
              Mens du sover, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700">
                Tjener algoritmerne penge.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
              Menneskelige følelser er din største fjende i krypto. DAVs er en nådesløs, algoritmisk trading maskine, der analyserer markederne og eksekverer 24/7 på din Binance konto. <strong className="text-white">Ingen stress. Kun ren logik.</strong>
            </motion.p>
            
            <motion.div variants={scaleIn} className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={onGoToPlatform}
                className="w-full sm:w-auto px-12 py-6 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black rounded-full transition-all flex items-center justify-center gap-4 text-xl shadow-[0_0_50px_rgba(245,158,11,0.5)] hover:shadow-[0_0_80px_rgba(245,158,11,0.7)] hover:-translate-y-1 uppercase tracking-widest border-2 border-amber-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                Aktiver Din AI Agent
                <Zap className="size-6 relative z-10" fill="currentColor" />
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><Lock className="size-4 text-emerald-500" /> Pengene bliver på Binance</div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><CheckCircle2 className="size-4 text-emerald-500" /> Tager 3 minutter at opsætte</div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><DollarSign className="size-4 text-emerald-500" /> Betal kun af overskuddet</div>
            </motion.div>
          </motion.div>

          {/* Abstract Dashboard Visualization / Hero Image */}
          <motion.div 
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mt-24 relative perspective-[2000px]"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/80 to-transparent z-20 h-full w-full pointer-events-none"></div>
            
            <div className="relative rounded-t-3xl sm:rounded-t-[3rem] border-t border-l border-r border-white/10 bg-[#07090e]/80 backdrop-blur-xl p-4 sm:p-8 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] overflow-hidden rotate-x-[5deg] transform-origin-bottom">
               {/* Decorative grid */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
               
               <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>
                  <div className="font-mono text-xs text-amber-500/70 tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    DAVs_CORE_V3.0_LIVE
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 {/* Mock Chart Area */}
                 <div className="md:col-span-2 bg-gradient-to-br from-gray-900/80 to-black/80 border border-white/5 rounded-2xl p-6 h-72 flex flex-col justify-between relative overflow-hidden backdrop-blur-md shadow-inner">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest">Akkumuleret Profit (30 Dage)</div>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600">+12,431.50 USDT</div>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/20 flex items-center gap-1">
                        <TrendingUp className="size-4" /> +14.2%
                      </div>
                    </div>
                    {/* Advanced SVG Chart Mock */}
                    <div className="w-full h-40 relative mt-4">
                      <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
                          </linearGradient>
                        </defs>
                        <path d="M0 40 L0 30 L10 28 L20 32 L30 20 L40 25 L50 15 L60 18 L70 5 L80 10 L90 2 L100 0 L100 40 Z" fill="url(#chartGrad)" />
                        <path d="M0 30 L10 28 L20 32 L30 20 L40 25 L50 15 L60 18 L70 5 L80 10 L90 2 L100 0" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        
                        {/* Data points */}
                        <circle cx="30" cy="20" r="1.5" fill="#fff" className="animate-pulse" />
                        <circle cx="70" cy="5" r="1.5" fill="#fff" className="animate-pulse" />
                        <circle cx="100" cy="0" r="2" fill="#34d399" className="animate-pulse" />
                      </svg>
                    </div>
                 </div>
                 
                 {/* Mock Trade Feed */}
                 <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-white/5 rounded-2xl p-6 flex flex-col h-72 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
                    <div className="text-gray-400 text-xs font-bold uppercase mb-6 tracking-widest flex items-center justify-between">
                      <span>Neural Engine Feed</span>
                      <Activity className="size-4 text-amber-500" />
                    </div>
                    <div className="flex-1 space-y-4 overflow-hidden font-mono text-[11px] sm:text-xs relative z-10">
                      <div className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5">
                        <span className="text-emerald-400 font-bold flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> [BUY] SOL/USDT</span>
                        <span className="text-white">142.50</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5">
                        <span className="text-amber-400 font-bold flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> [PROFIT] BTC/USDT</span>
                        <span className="text-white">+3.2%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5">
                        <span className="text-blue-400 font-bold flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> SCANNING</span>
                        <span className="text-gray-400">142 PAIRS</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5 opacity-50">
                        <span className="text-emerald-400 font-bold flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> [SELL] ETH/USDT</span>
                        <span className="text-white">3,120.00</span>
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </motion.div>
        </section>

        {/* LOGO CLOUD - Social Proof (Simulated) */}
        <section className="py-12 border-y border-white/5 bg-black/50 backdrop-blur-sm relative z-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-8">Designet til at forbinde sømløst med verdens største børs</p>
            <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 text-2xl font-black tracking-tighter"><div className="w-8 h-8 bg-[#FCD535] rounded-lg flex items-center justify-center text-black">B</div>BINANCE</div>
            </div>
          </div>
        </section>

        {/* THE BRUTAL TRUTH SECTION */}
        <section className="py-32 px-6 sm:px-12 bg-[#02040a] relative overflow-hidden">
          <div className="absolute top-1/2 right-0 w-[800px] h-[800px] bg-red-900/5 blur-[200px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
            >
              <div>
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs mb-6 uppercase tracking-widest">
                  <AlertTriangle className="size-3" /> Den barske virkelighed
                </motion.div>
                
                <motion.h2 variants={fadeInUp} className="text-5xl sm:text-7xl font-black mb-8 uppercase tracking-tighter leading-[1.1]">
                  Du er <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">elendig</span> til at handle krypto.
                </motion.h2>
                
                <motion.p variants={fadeInUp} className="text-xl text-gray-400 mb-10 font-medium leading-relaxed">
                  Lad os være ærlige. Du har ikke tid til at sidde klistret til skærmen 24/7. Du lader dig styre af FOMO når markedet pumper, og panikker når det dumper. Du konkurrerer mod supercomputere.
                </motion.p>
                
                <motion.ul variants={staggerContainer} className="space-y-8">
                  <motion.li variants={fadeInUp} className="flex items-start gap-5 group">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                      <Clock className="size-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Du skal sove. Det gør markedet ikke.</h4>
                      <p className="text-gray-400 leading-relaxed">Mens du sover 8 timer i døgnet, crasher asiatiske markeder eller pumper europæiske hvaler. Du misser konstante muligheder.</p>
                    </div>
                  </motion.li>
                  
                  <motion.li variants={fadeInUp} className="flex items-start gap-5 group">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                      <BrainCircuit className="size-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Følelser = Tabt Kapital</h4>
                      <p className="text-gray-400 leading-relaxed">Du handler baseret på mavefornemmelser, Twitter-hype og grådighed. Opskriften på at blive likvideret.</p>
                    </div>
                  </motion.li>
                  
                  <motion.li variants={fadeInUp} className="flex items-start gap-5 group">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                      <Crosshair className="size-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Ingen exit-strategi</h4>
                      <p className="text-gray-400 leading-relaxed">Du mangler den militante disciplin til at tage profit på toppen og cutte tab før de bløder dig tør.</p>
                    </div>
                  </motion.li>
                </motion.ul>
              </div>
              
              <motion.div variants={scaleIn} className="relative lg:ml-10">
                <div className="absolute inset-0 bg-red-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="bg-gradient-to-b from-[#110a0a] to-black border border-red-500/20 rounded-[2rem] p-8 sm:p-12 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                  <div className="flex items-center gap-4 mb-10 pb-8 border-b border-red-500/10">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-inner">
                      <AlertTriangle className="size-8 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-tight">VS. Maskinen</h3>
                      <p className="text-red-400 font-bold uppercase tracking-widest text-sm mt-1">Menneskelig Underlegenhed</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 font-mono text-sm sm:text-base">
                    <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                      <span className="text-gray-400">Reaktionstid:</span>
                      <span className="text-red-400 font-bold">Langsom (Sekunder)</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                      <span className="text-gray-400">Data kapacitet:</span>
                      <span className="text-red-400 font-bold">1-2 grafer ad gangen</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                      <span className="text-gray-400">Disciplin:</span>
                      <span className="text-red-400 font-bold">Ustabil / Følelsesladet</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                      <span className="text-gray-400">Oppetid:</span>
                      <span className="text-red-400 font-bold">Max 16 Timer/Døgn</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* THE SOLUTION / FEATURES */}
        <section className="py-32 px-6 sm:px-12 relative bg-[#05070c] border-t border-white/5">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-sm mb-8 uppercase tracking-[0.2em]"
              >
                Løsningen
              </motion.div>
              <h2 className="text-5xl sm:text-7xl font-black mb-8 uppercase tracking-tighter">
                Velkommen til <span className="text-amber-500">Fremtiden</span>
              </h2>
              <p className="text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Vi har bygget præcis den type infrastruktur, Wall Street bruger til at plukke retail-tradere. Nu lægger vi magten i dine hænder.
              </p>
            </div>

            <div className="space-y-40">
              {/* Feature 1 */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
              >
                <div className="flex-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                      <Cpu className="size-8 text-amber-500" />
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tight">Kold Eksekvering</h3>
                  </div>
                  <p className="text-xl text-gray-400 leading-relaxed mb-8">
                    DAVs kender ikke til frygt eller grådighed. Den analyserer hundredvis af valutaer og tusindvis af datapunkter i sekundet. Når algoritmen dikterer et setup med høj sandsynlighed, trykker den på knappen hurtigere end du kan blinke.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 className="size-5 text-amber-500" /> Handler 24/7/365</li>
                    <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 className="size-5 text-amber-500" /> Millisekund eksekvering</li>
                    <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 className="size-5 text-amber-500" /> 100% data-drevet</li>
                  </ul>
                </div>
                <div className="flex-1 lg:order-1 w-full">
                  <div className="aspect-square sm:aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-[#0a0d14] to-black border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <Terminal className="size-48 text-amber-500/5 absolute -bottom-10 -right-10 transform group-hover:scale-110 transition-transform duration-700" />
                    
                    <div className="w-full bg-[#05070c]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 font-mono text-sm text-emerald-500 shadow-2xl relative z-10 transform group-hover:-translate-y-2 transition-transform duration-500">
                      <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                      </div>
                      <p className="opacity-70">{">"} INITIALIZING NEURAL PATHWAYS...</p>
                      <p className="opacity-70">{">"} SCANNING MARKET CONDITIONS...</p>
                      <p className="text-white mt-2 font-bold">{">"} OPPORTUNITY DETECTED: BTC/USDT</p>
                      <p className="text-gray-400">{">"} CALCULATING RISK RATIO: 1:3</p>
                      <p className="text-amber-500 mt-2 flex items-center gap-2">{">"} EXECUTING ORDER <span className="animate-pulse">_</span></p>
                      <p className="text-emerald-400 font-bold mt-4 bg-emerald-500/10 inline-block px-2 py-1 rounded">ORDER FILLED @ 64,230.00</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <ShieldCheck className="size-8 text-emerald-500" />
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tight">Militant Risikostyring</h3>
                  </div>
                  <p className="text-xl text-gray-400 leading-relaxed mb-8">
                    Hemmeligheden bag langsigtet profit er ikke hvor meget du kan vinde, men <strong className="text-white">hvor lidt du taber</strong> på de dårlige dage. DAVs har indbygget dynamisk stop-loss og avanceret position-sizing. Den beskytter din kapital som en vagthund. Aldrig mere likviderede konti.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 className="size-5 text-emerald-500" /> Automatisk Stop-Loss</li>
                    <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 className="size-5 text-emerald-500" /> Trailing Take-Profit</li>
                    <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 className="size-5 text-emerald-500" /> Kapital-bevarelse først</li>
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <div className="aspect-square sm:aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-[#0a0d14] to-black border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                     
                     <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-500">
                        <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-4 border-emerald-500/20 mb-8 relative shadow-[0_0_50px_rgba(16,185,129,0.2)] bg-black">
                          <div className="absolute inset-[-4px] rounded-full border-4 border-emerald-500 border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                          <div className="absolute inset-2 rounded-full border-4 border-emerald-400/50 border-b-transparent animate-[spin_4s_linear_infinite_reverse]"></div>
                          <ShieldCheck className="size-16 text-emerald-500 relative z-10" />
                        </div>
                        <h4 className="text-3xl font-black text-white tracking-widest uppercase text-shadow">Capital Protected</h4>
                        <div className="inline-block mt-4 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full">
                          <p className="text-emerald-400 font-mono font-bold tracking-widest text-sm">MAX DRAWDOWN: 2.5%</p>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
              >
                <div className="flex-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                      <Lock className="size-8 text-blue-500" />
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tight">100% Kontrol. Din Konto.</h3>
                  </div>
                  <p className="text-xl text-gray-400 leading-relaxed mb-8">
                    Dine penge forlader <strong className="text-white">aldrig</strong> Binance. Du opretter en API-nøgle, som KUN giver DAVs tilladelse til at handle. Vi kan bogstaveligt talt ikke hæve dine midler. Du bevarer fuld kontrol og kan afbryde forbindelsen med ét klik, når som helst.
                  </p>
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <p className="text-blue-400 font-bold flex items-center gap-2">
                      <ShieldCheck className="size-5" /> Sikkerhed på bank-niveau via Binance API.
                    </p>
                  </div>
                </div>
                <div className="flex-1 lg:order-1 w-full">
                  <div className="aspect-square sm:aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-[#0a0d14] to-black border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <Globe className="size-48 text-blue-500/5 absolute -bottom-10 -left-10 transform group-hover:-rotate-12 transition-transform duration-1000" />
                    
                    <div className="w-full max-w-sm mx-auto space-y-4 z-10">
                      <div className="bg-[#05070c] border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg transform group-hover:-translate-x-2 transition-transform duration-500 delay-100">
                        <div className="flex items-center gap-3">
                          <Activity className="size-5 text-gray-500" />
                          <span className="text-gray-300 font-bold uppercase tracking-wide text-sm">Read/Data Access</span>
                        </div>
                        <span className="text-emerald-500 font-black text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">GRANTED</span>
                      </div>
                      
                      <div className="bg-[#05070c] border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg transform group-hover:translate-x-2 transition-transform duration-500 delay-200">
                        <div className="flex items-center gap-3">
                          <Target className="size-5 text-gray-500" />
                          <span className="text-gray-300 font-bold uppercase tracking-wide text-sm">Spot Trading</span>
                        </div>
                        <span className="text-emerald-500 font-black text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">GRANTED</span>
                      </div>

                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg transform group-hover:-translate-x-2 transition-transform duration-500 delay-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                        <div className="flex items-center gap-3 relative z-10">
                          <Wallet className="size-5 text-red-400" />
                          <span className="text-red-400 font-bold uppercase tracking-wide text-sm">Fund Withdrawals</span>
                        </div>
                        <span className="text-red-500 font-black text-xs bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 relative z-10 flex items-center gap-1"><Lock className="size-3" /> DENIED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 4 (Profit Share) */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#FCD535]/10 rounded-2xl flex items-center justify-center border border-[#FCD535]/20 shadow-[0_0_30px_rgba(252,213,53,0.2)]">
                      <DollarSign className="size-8 text-[#FCD535]" />
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tight">Vi tjener <span className="underline decoration-[#FCD535] underline-offset-4">kun</span>, når du gør.</h3>
                  </div>
                  <p className="text-xl text-gray-400 leading-relaxed mb-8">
                    Ingen skjulte abonnementer. Ingen faste månedlige gebyrer. Vi tager kun <strong className="text-white">1% i profitshare</strong> af de handler, vi vinder for dig.
                  </p>
                  <p className="text-lg text-gray-400 leading-relaxed bg-[#FCD535]/5 p-6 rounded-2xl border border-[#FCD535]/10">
                    Dette gebyr opgøres automatisk og betales dagligt, for at holde AI Traderen aktiv til den næste dag. Hvis botten taber en handel, koster det dig 0 kr. Vores incitament er 100% på linje med dit: <strong className="text-white">Vi SKAL skabe profit for at overleve.</strong>
                  </p>
                </div>
                <div className="flex-1 w-full">
                  <div className="aspect-square sm:aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-[#0a0d14] to-black border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FCD535]/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                     <TrendingUp className="size-48 text-[#FCD535]/5 absolute -bottom-10 -right-10 transform group-hover:scale-110 transition-transform duration-700" />
                     
                     <div className="w-full max-w-sm space-y-6 z-10">
                        {/* Win card */}
                        <div className="bg-[#05070c]/80 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(16,185,129,0.1)] transform group-hover:-translate-y-2 transition-transform duration-500">
                          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-300 font-black uppercase tracking-widest text-sm">Vundet Handel</span>
                            <span className="text-emerald-400 font-black text-xl">+150.00 USDT</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4 mt-2">
                            <span className="text-gray-500 font-bold uppercase tracking-wider">DAVs Fee (1%)</span>
                            <span className="text-[#FCD535] font-black bg-[#FCD535]/10 px-2 py-1 rounded">-1.50 USDT</span>
                          </div>
                        </div>
                        
                        {/* Loss card */}
                        <div className="bg-[#05070c]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-lg transform group-hover:translate-y-2 transition-transform duration-500">
                          <div className="absolute top-0 left-0 w-2 h-full bg-gray-600"></div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400 font-black uppercase tracking-widest text-sm">Tabt Handel</span>
                            <span className="text-gray-400 font-black text-xl">-20.00 USDT</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-white/5 pt-4 mt-2">
                            <span className="text-gray-600 font-bold uppercase tracking-wider">DAVs Fee</span>
                            <span className="text-gray-400 font-black">0.00 USDT</span>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* AGGRESSIVE CTA BANNER */}
        <section className="py-32 px-6 sm:px-12 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/40"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h2 className="text-5xl sm:text-7xl font-black text-black mb-8 uppercase tracking-tighter leading-[1.05] drop-shadow-sm">
              Mens du læser dette, tjener algoritmen penge.
            </h2>
            <p className="text-2xl sm:text-3xl text-amber-900 font-black mb-12 uppercase tracking-wide">
              Markedet venter ikke på dig.
            </p>
            <button
              onClick={onGoToPlatform}
              className="px-12 py-6 bg-black hover:bg-gray-900 text-white font-black rounded-full transition-all inline-flex items-center justify-center gap-4 text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:scale-105 uppercase tracking-widest border-4 border-black group"
            >
              Start Autopilot Nu
              <Rocket className="size-8 group-hover:translate-x-2 transition-transform" />
            </button>
            <p className="mt-8 text-black/60 font-bold uppercase tracking-widest text-sm">Opret gratis konto. Ingen binding.</p>
          </div>
        </section>

        {/* SETUP INSTRUCTIONS - Visually stunning */}
        <section className="py-32 px-6 sm:px-12 bg-[#02040a] relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-5xl sm:text-7xl font-black mb-6 uppercase tracking-tighter">
                I gang på <span className="text-amber-500">3 minutter</span>
              </h2>
              <p className="text-2xl text-gray-400 font-medium max-w-2xl mx-auto">Ingen teknisk viden påkrævet. Forbind, start, og lad algoritmen arbejde.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-gray-800 via-amber-500/50 to-gray-800 z-0 rounded-full"></div>

              {/* Step 1 */}
              <div className="relative z-10 bg-[#07090e] border border-white/5 rounded-[2rem] p-10 text-center shadow-2xl hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2rem] pointer-events-none"></div>
                <div className="w-28 h-28 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-gray-800 relative">
                  <div className="absolute inset-2 rounded-full border border-gray-700 border-dashed"></div>
                  <span className="text-5xl font-black text-white">1</span>
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-wide">Opret Konto</h3>
                <p className="text-gray-400 font-medium leading-relaxed">Log ind med ét klik via din Google konto. Ingen lange kedelige formularer.</p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 bg-[#07090e] border border-white/5 rounded-[2rem] p-10 text-center shadow-2xl hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-[2rem] pointer-events-none"></div>
                <div className="w-28 h-28 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(245,158,11,0.4)] border-4 border-[#02040a] relative">
                  <span className="text-5xl font-black text-black">2</span>
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-wide">Forbind Binance</h3>
                <p className="text-gray-400 font-medium leading-relaxed">Opret en API-nøgle i Binance med 'Spot Trading' aktiveret, og indsæt den i systemet.</p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 bg-[#07090e] border border-white/5 rounded-[2rem] p-10 text-center shadow-2xl hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-[2rem] pointer-events-none"></div>
                <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.4)] border-4 border-[#02040a] relative">
                  <span className="text-5xl font-black text-black">3</span>
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-wide">Tænd Botten</h3>
                <p className="text-gray-400 font-medium leading-relaxed">Tryk start, luk din computer, og se DAVs eksekvere handler 24/7 på dine vegne.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - High Contrast */}
        <section className="py-32 px-6 sm:px-12 bg-[#05070c] border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-6xl font-black text-center mb-16 uppercase tracking-tighter">
              Klar Tale. <br/> <span className="text-gray-600">Ingen Bullshit.</span>
            </h2>
            
            <div className="space-y-4">
              {[
                { q: "Kan I hæve eller stjæle mine penge?", a: "NEJ! Absolut ikke. Din API-nøgle hos Binance konfigureres til KUN at tillade 'Spot Trading'. Det er teknisk umuligt for os at hæve ('withdraw') dine midler. Dine penge er låst sikkert fast på din egen Binance konto, beskyttet af Binances sikkerhed." },
                { q: "Hvad koster det helt præcist?", a: "Du betaler ingen faste gebyrer eller abonnementer. Vores prismodel er 100% resultatbaseret: Vi tager 1% i profitshare af dine GEVINSTER. Dette opgøres og afregnes dagligt for at holde botten kørende. Taber botten en handel, betaler du intet. Vi tjener kun, når du gør." },
                { q: "Skal jeg have min computer tændt?", a: "Nej. DAVs er cloud-baseret og kører på vores lynhurtige servere. Du kan slukke computeren, slette appen, eller tage til Maldiverne – botten arbejder ufortrødent i baggrunden." },
                { q: "Er det garanteret profit?", a: "Nej, og alle der påstår det, lyver. Krypto er volatilt. DAVs bruger avanceret risikostyring til at skære tab hurtigt og lade vinderne løbe, men der VIL være tabende handler. Du bør kun handle med kapital, du har råd til at miste." }
              ].map((faq, i) => (
                <div key={i} className="bg-[#0a0d14] border border-white/5 hover:border-amber-500/30 transition-colors rounded-2xl overflow-hidden shadow-lg">
                  <button 
                    onClick={() => toggleFaq(i)}
                    className="w-full px-6 py-6 flex items-center justify-between text-left font-black text-lg sm:text-xl uppercase tracking-wide focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${activeFaq === i ? 'bg-amber-500 text-black' : 'bg-white/5 text-amber-500'}`}>
                      <ChevronDown className={`size-5 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <div 
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === i ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-gray-400 font-medium leading-relaxed sm:text-lg border-t border-white/5 pt-4">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA FOOTER */}
        <section className="py-32 px-6 sm:px-12 bg-black border-t border-white/10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-5xl sm:text-[5rem] leading-none font-black mb-8 uppercase tracking-tighter">
              Tiden er inde.
            </h2>
            <p className="text-2xl text-gray-400 mb-12 font-medium">Slut med emotionel trading. Start din algoritmiske rejse i dag.</p>
            
            <button
              onClick={onGoToPlatform}
              className="px-12 py-6 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black rounded-full transition-all inline-flex items-center justify-center gap-4 text-2xl shadow-[0_0_50px_rgba(245,158,11,0.4)] hover:-translate-y-1 hover:shadow-[0_0_80px_rgba(245,158,11,0.6)] uppercase tracking-widest border border-amber-300 group"
            >
              Få Adgang Til DAVs 
              <ArrowRight className="size-8 group-hover:translate-x-2 transition-transform" />
            </button>
            
            <div className="mt-32 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6 text-gray-600 text-xs sm:text-sm font-bold uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Activity className="size-4 text-amber-500" />
                </div> 
                DAVs Algorithmic Trading Systems
              </div>
              <div className="flex gap-6">
                <span className="hover:text-amber-500 cursor-pointer transition-colors">Vilkår</span>
                <span className="hover:text-amber-500 cursor-pointer transition-colors">Privatliv</span>
                <span>© {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
