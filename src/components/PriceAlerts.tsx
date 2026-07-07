import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, X, Plus, Activity } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface Alert {
  id: string;
  symbol: string;
  price: number;
  type: 'above' | 'below';
  triggered: boolean;
  userId?: string;
}

export const PriceAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newSymbol, setNewSymbol] = useState('BTCUSDT');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState<'above' | 'below'>('above');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Fetch alerts from Firestore or LocalStorage
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      try {
        const stored = localStorage.getItem('binance_price_alerts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setAlerts(parsed);
        }
      } catch (e) {}
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'priceAlerts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Alert[];
      setAlerts(fetchedAlerts);
      setLoading(false);
    }, (error) => {
      console.error("Price alerts sync failed", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Polling prices for active alerts
  useEffect(() => {
    if (alerts.length === 0) return;

    const activeAlerts = alerts.filter(a => !a.triggered);
    if (activeAlerts.length === 0) return;

    const symbols: string[] = Array.from(new Set(activeAlerts.map(a => a.symbol)));

    const fetchPrices = async () => {
      const newPrices: Record<string, number> = {};
      for (const sym of symbols) {
        try {
          const res = await fetch(`/api/binance-proxy/ticker/price?symbol=${sym.toUpperCase()}`);
          if (res.ok) {
            const data = await res.json();
            newPrices[sym.toUpperCase()] = parseFloat(data.price);
          }
        } catch (e) {}
      }
      setPrices(prev => ({ ...prev, ...newPrices }));
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [alerts]);

  // Check for triggered alerts
  useEffect(() => {
    const activeAlerts = alerts.filter(a => !a.triggered);
    activeAlerts.forEach(async (alert) => {
      const currentPrice = prices[alert.symbol.toUpperCase()];
      if (!currentPrice) return;

      const isTriggered = alert.type === 'above' 
        ? currentPrice >= alert.price 
        : currentPrice <= alert.price;

      if (isTriggered) {
        // Trigger browser notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Crypto Price Alert 🚨', {
            body: `${alert.symbol} just crossed ${alert.type === 'above' ? 'above' : 'below'} ${alert.price}! Current price: $${currentPrice}`,
            icon: '/favicon.ico'
          });
        }

        // Update state
        if (auth.currentUser) {
          try {
            await updateDoc(doc(db, 'priceAlerts', alert.id), { triggered: true });
          } catch (e) {}
        } else {
          const newAlerts = alerts.map(a => a.id === alert.id ? { ...a, triggered: true } : a);
          setAlerts(newAlerts);
          localStorage.setItem('binance_price_alerts', JSON.stringify(newAlerts));
        }
      }
    });
  }, [prices, alerts]);

  const handleAddAlert = async () => {
    if (!newPrice || isNaN(Number(newPrice)) || !newSymbol) return;
    
    const alertData = {
      symbol: newSymbol.toUpperCase(),
      price: parseFloat(newPrice),
      type: newType,
      triggered: false
    };

    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'priceAlerts'), {
          ...alertData,
          userId: auth.currentUser.uid,
          createdAt: new Date()
        });
      } catch (e) {
        console.error('Error adding alert', e);
      }
    } else {
      const newAlert = { id: Date.now().toString(), ...alertData };
      const newAlerts = [newAlert, ...alerts];
      setAlerts(newAlerts);
      localStorage.setItem('binance_price_alerts', JSON.stringify(newAlerts));
    }
    setNewPrice('');
  };

  const handleDelete = async (id: string) => {
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'priceAlerts', id));
      } catch (e) {
        console.error('Error deleting alert', e);
      }
    } else {
      const newAlerts = alerts.filter(a => a.id !== id);
      setAlerts(newAlerts);
      localStorage.setItem('binance_price_alerts', JSON.stringify(newAlerts));
    }
  };

  return (
    <div className="bg-gray-900/20 backdrop-blur-md border-white/5 rounded-2xl overflow-hidden p-4 transition-all duration-300 hover:scale-[1.01] hover:z-10 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="size-4 text-amber-500" /> Price Alerts
        </h3>
        <span className="text-[10px] text-amber-500 font-mono border border-amber-500/30 px-2 py-1 rounded bg-amber-500/10 uppercase tracking-widest font-bold">
          {alerts.filter(a => !a.triggered).length} Active
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          placeholder="BTCUSDT"
          className="w-24 bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
        />
        <select 
          value={newType}
          onChange={(e: any) => setNewType(e.target.value)}
          className="bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg px-2 py-2 text-xs text-gray-400 font-bold uppercase outline-none focus:border-amber-500"
        >
          <option value="above">≥</option>
          <option value="below">≤</option>
        </select>
        <input 
          type="number" 
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="Price..."
          className="flex-1 bg-gray-900/40 backdrop-blur-md border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
        />
        <button 
          onClick={handleAddAlert}
          disabled={!newPrice}
          className="bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500/30 px-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center">
          <BellRing className="size-8 text-gray-800 mb-2" />
          <p className="text-xs text-gray-500 font-mono">No alerts configured</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-center justify-between p-3 rounded-xl border ${alert.triggered ? 'bg-amber-900/10 border-amber-900/30' : 'bg-gray-900/50 border-gray-800/80'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${alert.triggered ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-800 text-gray-400'}`}>
                  <Activity className={`size-3 ${alert.triggered ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{alert.symbol}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${alert.type === 'above' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {alert.type === 'above' ? '≥' : '≤'} {alert.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {alert.triggered ? 'TRIGGERED' : `Current: ${prices[alert.symbol] ? '$'+prices[alert.symbol] : 'Loading...'}`}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(alert.id)}
                className="text-gray-600 hover:text-rose-400 p-1.5 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
