import { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { SalesPage } from "./components/SalesPage";
import { BinanceTradingPanel } from "./components/BinanceTradingPanel";
import { initAuth } from "./lib/auth";
import { User } from "firebase/auth";
import { Toaster, toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setAuthLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    if (type === 'error') toast.error(msg);
    else if (type === 'warn') toast.warning(msg);
    else toast.info(msg);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <Loader2 className="size-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthScreen onLogin={setUser} />;
    }
    return <SalesPage onGoToPlatform={() => setShowAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] font-sans text-gray-100">
      <Toaster 
        position="top-right" 
        theme="dark" 
        visibleToasts={1} 
        duration={1000}
        toastOptions={{
          style: {
            background: 'rgba(5, 5, 5, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#e5e7eb',
            fontSize: '10px',
            fontFamily: 'monospace',
            borderRadius: '9999px',
            padding: '5px 12px',
            minHeight: '24px',
            height: 'auto',
            maxWidth: '240px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }
        }}
      />
      <BinanceTradingPanel addLog={addLog} />
    </div>
  );
}
