import { useState, useEffect, useRef } from 'react';
import { FileText, Save, Check, Mic, MicOff, BookOpen } from 'lucide-react';
import { db, auth } from '../lib/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface TradingNotesProps {
  ticker: string;
  onAutoFillJournal?: () => void;
}

export function TradingNotes({ ticker, onAutoFillJournal }: TradingNotesProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, 'tradingNotes', `${user.uid}_${ticker}`);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setNotes(docSnap.data().content || '');
            return;
          }
        } catch (e: any) {
          if (e.message?.includes('offline')) {
             // Silently fallback to local storage if offline
          } else {
             console.error("Cloud notes fetch failed", e);
          }
        }
      }
      
      // Fallback or if logged out
      const savedNotes = localStorage.getItem(`trading_notes_${ticker}`);
      setNotes(savedNotes || '');
    };

    fetchNotes();
    setIsSaved(false);
  }, [ticker]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setNotes((prev) => {
             const newText = prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript.trim();
             return newText;
          });
        }
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Could not start recognition:", e);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setIsSaved(false);
    
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'tradingNotes', `${user.uid}_${ticker}`);
        await setDoc(docRef, {
          content: notes,
          symbol: ticker,
          updatedAt: serverTimestamp(),
          userId: user.uid
        });
        toast.success(`Notes for ${ticker} saved to Cloud`);
      } catch (e: any) {
        console.error("Failed to save to cloud", e);
        if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota limit')) {
           toast.error('Kan ikke gemme note: Database kvote er opbrugt for i dag.');
        } else {
           toast.error("Failed to save to Cloud");
        }
      }
    } else {
      localStorage.setItem(`trading_notes_${ticker}`, notes);
      toast.info(`Notes for ${ticker} saved locally`);
    }

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-amber-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            Trading Notes: {ticker}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {recognitionRef.current && (
            <button
              onClick={toggleListening}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-colors border ${
                isListening 
                  ? 'bg-rose-900/30 text-rose-500 border-rose-900/50 hover:bg-rose-900/50' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-300 border-gray-700'
              }`}
            >
              {isListening ? (
                <><Mic className="size-3 animate-pulse" /> Dictating...</>
              ) : (
                <><MicOff className="size-3" /> Dictate</>
              )}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-800 hover:bg-gray-700 text-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-colors border border-gray-700 disabled:opacity-50"
          >
            {isSaved ? (
              <><Check className="size-3 text-emerald-500" /> <span className="text-emerald-500">Saved</span></>
            ) : isSaving ? (
              <><div className="animate-spin size-3 border-2 border-amber-500 border-t-transparent rounded-full" /> Saving...</>
            ) : (
              <><Save className="size-3" /> Save Notes</>
            )}
          </button>
        </div>
      </div>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={isListening ? "Listening... (Speak your notes now)" : `Log personal insights, entry/exit reasons, and thoughts for ${ticker}...`}
        className="w-full h-32 bg-gray-950/50 border border-gray-800 rounded-xl p-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none transition-all"
      />
    </div>
  );
}
