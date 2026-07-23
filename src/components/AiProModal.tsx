import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Sparkles, CheckSquare, Settings2, ShieldCheck, Send, ChevronDown, ChevronRight, X, Bot, BrainCircuit, CreditCard, Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function AiProModal({ onClose, userUid, userEmail }: { onClose: () => void, userUid?: string, userEmail?: string }) {
  const [agreed, setAgreed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('user_binance_api_key') || '');
  const [apiSecret, setApiSecret] = useState(localStorage.getItem('user_binance_api_secret') || '');
  const [isProcessingBinance, setIsProcessingBinance] = useState(false);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const isFreeUser = userEmail === 'djminirocker@gmail.com';

  const handleActivateClick = async () => {
    if (isFreeUser) {
      const mockKey = 'demo_key_djminirocker_free';
      const mockSecret = 'demo_secret_djminirocker_free';
      localStorage.setItem('user_binance_api_key', mockKey);
      localStorage.setItem('user_binance_api_secret', mockSecret);
      
      if (userUid) {
         try {
            await setDoc(doc(db, "userSettings", userUid), {
               binanceApiKey: mockKey,
               binanceApiSecret: mockSecret
            }, { merge: true });
         } catch (e) {
            console.error("Failed to save credentials to Firestore", e);
         }
      }
      
      toast.success('AI Pro aktiveret gratis!');
      window.dispatchEvent(new Event('api_keys_updated'));
      onClose();
      return;
    }
    setShowConfig(true);
  };

  const handleSaveAndPurchase = async () => {
    if (apiKey && apiSecret) {
      localStorage.setItem('user_binance_api_key', apiKey);
      localStorage.setItem('user_binance_api_secret', apiSecret);
      
      if (userUid) {
         try {
            await setDoc(doc(db, "userSettings", userUid), {
               binanceApiKey: apiKey,
               binanceApiSecret: apiSecret
            }, { merge: true });
         } catch (e) {
            console.error("Failed to save credentials to Firestore", e);
         }
      }
    }
    
    setIsProcessingBinance(true);
    // Simulate Binance Pay Redirect
    setTimeout(() => {
      setIsProcessingBinance(false);
      alert("Betaling godkendt via Binance. Dine API-nøgler er gemt lokalt og du har nu fuld adgang.");
      onClose();
      // Reload page or force a check of health
      window.dispatchEvent(new Event('api_keys_updated'));
    }, 2000);
  };

  const steps = [
    { num: 1, title: 'Registrer signaler', desc: 'Overvåg UM evige kontrakter, og identificer divergens mellem åben rente og pris for at finde potentielle opsætninger af prisudbrud.' },
    { num: 2, title: 'Backtest-strategi', desc: 'Valider den historiske præstation for divergenssignaler og resultater af prisudbrud på tværs af forskellige markedsregimer.' },
    { num: 3, title: 'Udfør handler', desc: 'Gå lang i de højest rangerede symboler med stærk divergens, før bruddet bekræftes.' },
    { num: 4, title: 'Gennemgå præstation', desc: 'Evaluer gevinst og tab, vinderrate, Sharpe-ratio og maksimal reduktion, og finjuster strategien iterativt.' }
  ];

  const faqs = [
    { q: '1. Skal jeg have kodningsfærdigheder?', a: 'Der kræves ingen kodning. Du kan blot chatte med AI Pro i naturligt sprog – som at tale med en handelskyndig assistent.' },
    { q: '2. Hvad er belønningen med gratis kredit?', a: 'Udvalgte brugere kan gøre krav på 5 millioner gratis kreditter for at låse op for AI Pro-funktioner. Når der er gjort krav på dem, vil kreditterne være tilgængelige i 30 dage.' },
    { q: '3. Hvordan kan jeg bruge AI-kreditter?', a: 'Kreditter forbruges, når AI Pro behandler dine anmodninger. Når dine kreditter er brugt op, kan du vælge at købe flere kreditter på siden Indstillinger.' },
    { q: '4. Hvad er AI-kontoen?', a: 'AI-kontoen er en dedikeret virtuel underkonto, der er oprettet specifikt til AI-administreret handel. Den er fuldstændigt isoleret fra din primære konto, hvilket hjælper med at sikre, at midlerne på din primære konto ikke påvirkes direkte af AI-handelsaktivitet.' },
    { q: '5. Er mine midler sikre?', a: 'Ja. Vi bruger et isolationssystem med flere lag – herunder adskillelse af identitet, hukommelse, tilladelser og legitimationsoplysninger – sammen med sandboxing af virtuelle underkonti og indbyggede grænser for midler. Det sikrer, at AI\'en arbejder strengt inden for de sikkerhedsgrænser, du definerer.' },
    { q: '6. Hvilke AI-modeller kan jeg bruge?', a: 'Du kan skifte mellem Standard- og Advanced-AI-modellerne når som helst. Begge modeller bruger kreditter, men Standard-modellen bruger færre kreditter pr. anmodning end Advanced-modellen. Du kan skifte mellem modellerne ud fra dine behov direkte på platformen.' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-gray-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="bg-[#181a20] sm:border border-gray-800 sm:rounded-3xl rounded-t-3xl w-full max-w-xl h-[90vh] sm:h-[85vh] flex flex-col relative shadow-2xl overflow-hidden font-sans text-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/60 sticky top-0 bg-[#181a20] z-10">
          <button
            onClick={onClose}
            aria-label="Luk"
            className="p-2 hover:bg-gray-800 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <X className="size-5 text-gray-400" />
          </button>
          <div className="font-bold flex items-center justify-center gap-2">
            <BrainCircuit className="size-5 text-indigo-400" />
            <span className="text-white">DAVInvest Trading AI</span>
            <span className="border border-indigo-500/50 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded ml-1 bg-indigo-500/10">Pro</span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32 custom-scrollbar">
          {showConfig ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-bold text-white mb-2">Konfigurer din adgang</h2>
              <p className="text-sm text-gray-400 mb-6">Indtast dine egne Binance API-nøgler for at lade AI-agenten handle direkte på din Binance-konto. Dine nøgler gemmes kun lokalt i din browser.</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="binance-api-key" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Binance API Nøgle</label>
                  <input
                    id="binance-api-key"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:border-amber-500 outline-none transition-all placeholder:text-gray-700"
                    placeholder="Din API nøgle..."
                  />
                </div>
                <div>
                  <label htmlFor="binance-api-secret" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Binance API Secret</label>
                  <input
                    id="binance-api-secret"
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:border-amber-500 outline-none transition-all placeholder:text-gray-700"
                    placeholder="Din API secret..."
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button 
                  onClick={handleSaveAndPurchase}
                  disabled={isProcessingBinance}
                  className="w-full py-4 rounded-xl font-bold bg-[#fcd535] hover:bg-[#e6c12d] text-gray-900 text-base transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingBinance ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Omdirigerer til Binance...
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-5" />
                      Gennemfør køb & Gem Nøgler
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="w-full py-4 rounded-xl font-bold border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                >
                  Tilbage
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Hero Card */}
              <div className="bg-gradient-to-br from-indigo-900/40 via-[#181a20] to-amber-900/20 p-6 rounded-2xl border border-gray-800/80 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
                <p className="text-sm text-gray-400 mb-2">Fortæl om dine handelsidéer</p>
                <p className="text-white font-medium text-lg leading-snug">
                  Overvåg UM evige kontrakter for stigende åben interesse og forsinket prisudvikling, og gå langt, når prisen bryder ud.
                </p>
              </div>

              {/* Workflow Section */}
              <h3 className="text-lg font-bold text-white mb-6">Agenten begynder at arbejde ...</h3>
              <div className="space-y-0 pl-2 mb-10">
                {steps.map((step, index) => (
                  <div key={index} className="flex relative">
                    {/* Line connector */}
                    {index !== steps.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-[-16px] w-[2px] bg-gray-800 z-0"></div>
                    )}
                    <div className="relative z-10 flex flex-col items-center mr-4">
                      <div className="w-6 h-6 bg-[#2b3139] border-2 border-gray-700 rounded text-[10px] font-bold flex items-center justify-center rotate-45 mt-1">
                        <span className="-rotate-45 text-white">{step.num}</span>
                      </div>
                    </div>
                    <div className="pb-8">
                      <h4 className="text-white font-bold text-[15px] mb-2">{step.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Features Section */}
              <h3 className="text-lg font-bold text-white mb-4">Mere end bare standard AI</h3>
              <div className="space-y-3 mb-10">
                <div className="bg-[#1e2329] p-5 rounded-2xl relative overflow-hidden flex items-start gap-4">
                   <div>
                     <h4 className="text-white font-bold mb-2">Specialiseret agentframework</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Selvudviklet AI-agentframework, fuldt optimeret fra bunden til kryptohandel, med over 80 % lavere omkostninger end AI-agenter til generelle formål.</p>
                   </div>
                   <Sparkles className="size-16 text-indigo-500/10 absolute right-4 top-4" />
                </div>
                <div className="bg-[#1e2329] p-5 rounded-2xl relative overflow-hidden flex items-start gap-4">
                   <div>
                     <h4 className="text-white font-bold mb-2">Kompetencer i konstant udvikling</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Agenten lærer løbende af brugerpræferencer, markedsændringer, strategiudførelse og feedback fra handel, forbedrer sin beslutningstagning og udvikler sig gennem iterative cyklusser.</p>
                   </div>
                   <Settings2 className="size-16 text-emerald-500/10 absolute right-4 top-4" />
                </div>
                <div className="bg-[#1e2329] p-5 rounded-2xl relative overflow-hidden flex items-start gap-4">
                   <div>
                     <h4 className="text-white font-bold mb-2">Sikre og garanterede handler</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Handelssikkerhed fra ende til anden med isoleret udførelse, tilladelseskontrol og beskyttelse af legitimationsoplysninger, som sikrer, at hver handling kan verificeres og styres af brugeren.</p>
                   </div>
                   <CheckSquare className="size-16 text-blue-500/10 absolute right-4 top-4" />
                </div>
                <div className="bg-[#1e2329] p-5 rounded-2xl relative overflow-hidden flex items-start gap-4">
                   <div>
                     <h4 className="text-white font-bold mb-2">Cloud-miljø uden opsætning</h4>
                     <p className="text-gray-400 text-sm leading-relaxed">Fuldt cloud-integreret miljø uden behov for installation eller konfiguration — klar til at blive implementeret og handle med det samme, lige ud af boksen.</p>
                   </div>
                   <Send className="size-16 text-indigo-500/10 absolute right-4 top-4" />
                </div>
              </div>

              {/* FAQ Section */}
              <h3 className="text-lg font-bold text-white mb-4">Du vil måske gerne spørge</h3>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-[#1e2329] rounded-2xl overflow-hidden transition-all duration-200">
                    <button 
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center p-5 text-left"
                    >
                      <span className="font-bold text-[15px] text-white">{faq.q}</span>
                      {openFaq === idx ? (
                        <span className="text-gray-500 text-2xl font-light leading-none">−</span>
                      ) : (
                        <span className="text-gray-500 text-2xl font-light leading-none">+</span>
                      )}
                    </button>
                    <AnimatePresence>
                      {openFaq === idx && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-5 pt-0 text-gray-400 text-sm leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                <div className="text-center pt-4">
                   <button className="text-amber-500 font-medium text-sm">Se flere ofte stillede spørgsmål</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Bottom Action Bar */}
        {!showConfig && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#181a20] border-t border-gray-800 p-4 sm:p-6 pb-safe z-20">
              <label className="flex items-start gap-3 mb-4 cursor-pointer group">
                 <div className="mt-0.5">
                     <div 
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${agreed ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-gray-500 group-hover:border-gray-400'}`}
                     >
                       {agreed && <CheckSquare className="size-3 text-gray-900" />}
                     </div>
                 </div>
                 <input type="checkbox" className="hidden" checked={agreed} onChange={() => setAgreed(!agreed)} />
                 <span className="text-xs text-gray-400 leading-relaxed">
                    Jeg bekræfter, at jeg har læst og accepterer <span className="text-amber-500">ansvarsfraskrivelsen</span>, og at jeg specifikt har læst <span className="text-amber-500">AI-politikken og vilkårene</span>.
                 </span>
              </label>
              <button 
                onClick={handleActivateClick}
                className={`w-full py-4 rounded-xl font-bold text-gray-900 text-base transition-all ${agreed ? 'bg-[#fcd535] hover:bg-[#e6c12d]' : 'bg-[#fcd535]/50 cursor-not-allowed'}`}
                disabled={!agreed}
              >
                {isFreeUser ? 'Aktivér Gratis (PRO)' : 'Aktivér med 9.99 USDC/måned'}
              </button>
          </div>
        )}

      </motion.div>
    </div>
  );
}
