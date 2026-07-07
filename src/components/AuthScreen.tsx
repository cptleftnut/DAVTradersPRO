import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Sparkles, Bot, ShieldCheck, ArrowRight, Loader2, LogIn, UserPlus } from 'lucide-react';
import { loginWithEmail, registerWithEmail, googleSignIn } from '../lib/auth';
import { toast } from 'sonner';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (res) onLogin(res.user);
        toast.success('Velkommen tilbage!');
      } else {
        const res = await registerWithEmail(email, password);
        if (res) onLogin(res.user);
        toast.success('Konto oprettet!');
      }
    } catch (error: any) {
      if (!String(error).includes('Failed to fetch')) toast.error(error.message || 'Der opstod en fejl');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await googleSignIn();
      if (res) onLogin(res.user);
      toast.success('Logget ind med Google');
    } catch (error: any) {
      if (!String(error).includes('Failed to fetch')) toast.error(error.message || 'Google login fejlede');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-gray-800 rounded-2xl mb-4 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Bot className="text-amber-500 size-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white uppercase italic">
            DAVInvest Trading AI
          </h1>
          <p className="text-xs tracking-widest text-gray-500 uppercase mt-2 font-medium">
            Din guide til kloge investeringsvalg
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-amber-500 outline-none transition-all placeholder:text-gray-700"
                placeholder="din@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-amber-500 outline-none transition-all placeholder:text-gray-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="size-5" />
                Log ind
              </>
            ) : (
              <>
                <UserPlus className="size-5" />
                Opret konto
              </>
            )}
            {!loading && <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-950 px-4 text-gray-600 font-bold tracking-widest">Eller</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-black border border-gray-200 font-bold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-3 shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Log ind med Google
        </button>

        <p className="text-center mt-8 text-gray-500 text-sm">
          {mode === 'login' ? 'Har du ikke en konto?' : 'Har du allerede en konto?'}
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="ml-2 text-amber-500 font-bold hover:text-amber-400 transition-colors"
          >
            {mode === 'login' ? 'Opret konto' : 'Log ind'}
          </button>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
          <ShieldCheck className="size-3 text-emerald-500" />
          <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">
            Sikker krypteret adgang
          </span>
        </div>
      </motion.div>
    </div>
  );
}
