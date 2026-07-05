import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Save, FolderOpen, Trash2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface TradingPreset {
  id?: string;
  userId: string;
  name: string;
  allocation: number;
  takeProfit: number;
  stopLoss: number;
  stopLossType: 'percentage' | 'fixed';
  strategy: string;
  useTrailingStop: boolean;
  dynamicSizing: boolean;
  maxRiskPerTrade: number;
  diversifySectors: boolean;
  autoAdjustVolatility: boolean;
  useNewsSentiment: boolean;
  circuitBreakerLimit: number;
  enableDCA: boolean;
  dcaIntervalHours: number;
  dcaAllocation: number;
}

export function TradingPresetsManager({ 
  currentConfig, 
  onLoadPreset 
}: { 
  currentConfig: Omit<TradingPreset, 'id' | 'userId' | 'name'>;
  onLoadPreset: (preset: TradingPreset) => void;
}) {
  const [presets, setPresets] = useState<TradingPreset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'tradingPresets'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingPreset));
      setPresets(fetched);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const savePreset = async () => {
    if (!auth.currentUser) {
      toast.error('Du skal være logget ind for at gemme presets');
      return;
    }
    if (!newPresetName.trim()) {
      toast.error('Giv profilen et navn');
      return;
    }
    
    setLoading(true);
    try {
      const preset: TradingPreset = {
        userId: auth.currentUser.uid,
        name: newPresetName.trim(),
        ...currentConfig
      };
      await addDoc(collection(db, 'tradingPresets'), preset);
      toast.success(`Profil "${preset.name}" gemt!`);
      setNewPresetName('');
      setIsOpen(false);
    } catch (e: any) {
      toast.error(`Kunne ikke gemme: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'tradingPresets', id));
      toast.success('Profil slettet');
    } catch (e: any) {
      toast.error(`Kunne ikke slette: ${e.message}`);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 hover:border-amber-500/30 transition-all text-xs font-bold text-gray-300 uppercase tracking-widest"
      >
        <FolderOpen className="size-3.5 text-amber-500" />
        Trading Presets
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
              <Save className="size-3.5 text-amber-500" /> 
              Gemte Profiler
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
             {presets.length === 0 ? (
               <p className="text-gray-500 text-xs italic text-center py-4">Ingen gemte profiler endnu.</p>
             ) : (
               <div className="space-y-2">
                 {presets.map(preset => (
                   <div 
                     key={preset.id}
                     onClick={() => {
                       onLoadPreset(preset);
                       setIsOpen(false);
                       toast.success(`Indlæste "${preset.name}"`);
                     }}
                     className="group flex items-center justify-between p-2.5 bg-gray-900 border border-gray-800 rounded-lg hover:border-amber-500/50 cursor-pointer transition-colors"
                   >
                     <div>
                       <p className="text-xs font-bold text-gray-200">{preset.name}</p>
                       <p className="text-[10px] text-gray-500">{preset.strategy} • ${preset.allocation}</p>
                     </div>
                     <button 
                       onClick={(e) => preset.id && deletePreset(preset.id, e)}
                       className="p-1.5 text-gray-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                       title="Slet Preset"
                     >
                       <Trash2 className="size-3.5" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>

          <div className="p-3 bg-gray-900/50 border-t border-gray-800 flex gap-2">
            <input 
              type="text" 
              placeholder="Giv ny profil et navn..." 
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
            />
            <button 
              onClick={savePreset}
              disabled={loading || !newPresetName.trim()}
              className="bg-amber-600 hover:bg-amber-500 text-black p-1.5 rounded-lg transition-colors disabled:opacity-50"
              title="Gem nuværende indstillinger"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
