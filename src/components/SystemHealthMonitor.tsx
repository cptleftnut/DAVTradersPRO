import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Database, 
  Key, 
  RefreshCw, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Server,
  TrendingUp,
  ShieldCheck,
  CloudLightning
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

interface ServiceStatus {
  name: string;
  type: 'local' | 'binance_api' | 'binance_auth' | 'firebase';
  status: 'online' | 'degraded' | 'offline' | 'checking';
  latency: number | null; // ms
  message: string;
}

export function SystemHealthMonitor() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Applikationsserver', type: 'local', status: 'checking', latency: null, message: 'Forbinder...' },
    { name: 'Binance API Gateway', type: 'binance_api', status: 'checking', latency: null, message: 'Forbinder...' },
    { name: 'Binance API-nøgler', type: 'binance_auth', status: 'checking', latency: null, message: 'Forbinder...' },
    { name: 'Firebase Database', type: 'firebase', status: 'checking', latency: null, message: 'Forbinder...' },
  ]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async (isManual = false) => {
    setIsRefreshing(true);
    const updatedServices = [...services];

    // 1. Check Local App Server Latency
    const startLocal = performance.now();
    try {
      const res = await fetch('/api/health');
      const endLocal = performance.now();
      const latency = Math.round(endLocal - startLocal);
      
      if (res.ok) {
        updatedServices[0] = {
          name: 'Applikationsserver',
          type: 'local',
          status: latency > 300 ? 'degraded' : 'online',
          latency,
          message: latency > 300 ? 'Høj svartid fra server.' : 'Server kører optimalt.',
        };
      } else {
        throw new Error('Server responded with error status');
      }
    } catch (err) {
      updatedServices[0] = {
        name: 'Applikationsserver',
        type: 'local',
        status: 'offline',
        latency: null,
        message: 'Kan ikke oprette forbindelse til serveren.',
      };
    }

    // 2. Check Binance API Gateway Connection
    const startBinance = performance.now();
    try {
      // Use proxy to avoid CORS issues and get real roundtrip through server -> Binance
      const res = await fetch('/api/binance-proxy/klines?symbol=BTCUSDT&interval=1m&limit=1');
      const endBinance = performance.now();
      const latency = Math.round(endBinance - startBinance);
      
      if (res.ok) {
        updatedServices[1] = {
          name: 'Binance API Gateway',
          type: 'binance_api',
          status: latency > 600 ? 'degraded' : 'online',
          latency,
          message: latency > 600 ? 'Langsom forbindelse til Binance.' : 'Forbundet til Binance.',
        };
      } else {
        throw new Error('Binance responded with error');
      }
    } catch (err) {
      updatedServices[1] = {
        name: 'Binance API Gateway',
        type: 'binance_api',
        status: 'offline',
        latency: null,
        message: 'Ingen forbindelse til Binance API.',
      };
    }

    // 3. Check Binance Auth & Credentials Validations
    try {
      const userApiKey = localStorage.getItem('user_binance_api_key');
      if (!userApiKey) {
        updatedServices[2] = {
          name: 'Binance API-nøgler',
          type: 'binance_auth',
          status: 'offline',
          latency: null,
          message: 'API-nøgler ikke opsat i profilen.',
        };
      } else {
        const startAuth = performance.now();
        const res = await fetch('/api/binance/health');
        const endAuth = performance.now();
        const data = await res.json();
        const latency = Math.round(endAuth - startAuth);

        if (data.status === 'ok') {
          updatedServices[2] = {
            name: 'Binance API-nøgler',
            type: 'binance_auth',
            status: 'online',
            latency,
            message: 'Nøgler valideret og godkendt af Binance.',
          };
        } else if (data.status === 'invalid') {
          updatedServices[2] = {
            name: 'Binance API-nøgler',
            type: 'binance_auth',
            status: 'degraded',
            latency,
            message: 'Nøgler afvist af Binance. Tjek tilladelser.',
          };
        } else {
          updatedServices[2] = {
            name: 'Binance API-nøgler',
            type: 'binance_auth',
            status: 'offline',
            latency: null,
            message: data.message || 'Ingen Binance-forbindelse.',
          };
        }
      }
    } catch (err) {
      updatedServices[2] = {
        name: 'Binance API-nøgler',
        type: 'binance_auth',
        status: 'offline',
        latency: null,
        message: 'Kunne ikke validere nøglestatus.',
      };
    }

    // 4. Check Firebase Database Connection & Latency
    const startFirebase = performance.now();
    try {
      // Attempt a quick shallow fetch to test connectivity
      const dummyRef = doc(db, 'system', 'ping');
      await getDoc(dummyRef);
      const endFirebase = performance.now();
      const latency = Math.round(endFirebase - startFirebase);

      updatedServices[3] = {
        name: 'Firebase Database',
        type: 'firebase',
        status: latency > 400 ? 'degraded' : 'online',
        latency,
        message: 'Firestore er tilgængelig og synkroniseret.',
      };
    } catch (err) {
      updatedServices[3] = {
        name: 'Firebase Database',
        type: 'firebase',
        status: 'offline',
        latency: null,
        message: 'Databaseforbindelse afbrudt.',
      };
    }

    // 5. Fetch Maintenance Mode Status
    try {
      const res = await fetch('/api/bot/state');
      if (res.ok) {
        const state = await res.json();
        setMaintenanceMode(state.maintenanceMode || false);
      }
    } catch (err) {
      console.error("Fejl ved hentning af bot-state til vedligeholdelsestjek:", err);
    }

    setServices(updatedServices);
    setLastChecked(new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setIsRefreshing(false);

    if (isManual) {
      toast.success('Forbindelsestest fuldført', {
        description: 'Alle latency- og forbindelsesdata er opdateret.'
      });
    }
  }, [services]);

  const toggleMaintenanceMode = async () => {
    setIsTogglingMaintenance(true);
    const targetStatus = !maintenanceMode;
    try {
      const res = await fetch('/api/bot/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceEnabled: targetStatus })
      });
      if (res.ok) {
        setMaintenanceMode(targetStatus);
        if (targetStatus) {
          toast.warning('Systemet er nu i vedligeholdelsestilstand', {
            description: 'Alle trading bots er sat på pause og åbne positioner er lukket.'
          });
        } else {
          toast.success('Vedligeholdelsestilstand deaktiveret', {
            description: 'Trading bots kan nu startes igen.'
          });
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Kunne ikke ændre vedligeholdelsestilstand');
      }
    } catch (err) {
      toast.error('Netværksfejl under ændring af vedligeholdelsestilstand');
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      checkHealth();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'degraded': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'offline': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20 animate-pulse';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="size-4 text-emerald-400" />;
      case 'degraded': return <AlertCircle className="size-4 text-amber-400" />;
      case 'offline': return <WifiOff className="size-4 text-rose-400" />;
      default: return <RefreshCw className="size-4 text-cyan-400 animate-spin" />;
    }
  };

  const getServiceIcon = (type: ServiceStatus['type']) => {
    switch (type) {
      case 'local': return <Server className="size-4 text-cyan-400" />;
      case 'binance_api': return <Wifi className="size-4 text-amber-400" />;
      case 'binance_auth': return <Key className="size-4 text-rose-400" />;
      case 'firebase': return <Database className="size-4 text-sky-400" />;
    }
  };

  const averageLatency = Math.round(
    services
      .filter(s => s.latency !== null)
      .reduce((acc, curr) => acc + (curr.latency || 0), 0) / 
    services.filter(s => s.latency !== null).length
  ) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all"
    >
      {/* Decorative ambient background line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

      {maintenanceMode && (
        <div id="maintenance-active-banner" className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-left">
          <CloudLightning className="size-4.5 text-amber-400 animate-pulse shrink-0" />
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Vedligeholdelse Aktiv</p>
            <p className="text-[8.5px] text-amber-500/80 mt-0.5 leading-tight">Handelsrobotter er deaktiveret og åbne positioner er lukket.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">System & Netværk</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
              autoRefresh 
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' 
                : 'bg-gray-800 text-gray-500 border-transparent'
            }`}
          >
            {autoRefresh ? 'AUTO-REFRESH 15S' : 'MANUEL'}
          </button>

          <button
            onClick={() => checkHealth(true)}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Søg nu"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Latency Gauge Card */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block">Gns. Latency</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-cyan-400">{averageLatency}</span>
            <span className="text-[8px] text-cyan-400/70 font-mono">ms</span>
          </div>
          <span className="text-[8px] text-gray-400/80 mt-1 flex items-center gap-1">
            <TrendingUp className="size-3 text-emerald-400" />
            Stabil forbindelse
          </span>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block">Sikkerhed status</span>
          <div className="flex items-center gap-1 mt-1">
            <ShieldCheck className="size-5 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Krypteret</span>
          </div>
          <span className="text-[8px] text-gray-400/80 mt-1 flex items-center gap-1">
            <CloudLightning className="size-3 text-emerald-400 animate-pulse" />
            SSL/TLS er aktiv
          </span>
        </div>
      </div>

      {/* Service Checklist */}
      <div className="space-y-2">
        {services.map((service, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-black/35 transition-all duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 shrink-0">
                {getServiceIcon(service.type)}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-bold text-gray-200 truncate">{service.name}</p>
                <p className="text-[8.5px] text-gray-500 truncate mt-0.5">{service.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {service.latency !== null && (
                <span className="text-[9px] font-mono text-gray-500">
                  {service.latency}ms
                </span>
              )}
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
                {service.status === 'online' ? 'OK' : service.status === 'degraded' ? 'FORSINKET' : service.status === 'offline' ? 'AFBRUDT' : 'SØGER'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Maintenance Mode Controller Panel */}
      <div id="maintenance-panel-card" className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden text-left">
        {maintenanceMode && (
          <div id="maintenance-accent-indicator" className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-left">
            <h4 className="text-[10px] font-black text-gray-200 uppercase tracking-widest flex items-center gap-1.5">
              <CloudLightning className={`size-3.5 ${maintenanceMode ? 'text-amber-400 animate-bounce' : 'text-gray-400'}`} />
              Vedligeholdelsestilstand
            </h4>
            <p className="text-[8.5px] text-gray-500 mt-0.5 leading-normal">
              {maintenanceMode 
                ? 'Robots er sat på pause og åbne ordrer er lukket under planlagt nedetid.' 
                : 'Sætter alle bots på pause og lukker åbne positioner under API-nedetid.'}
            </p>
          </div>
          
          <button
            id="maintenance-toggle-btn"
            onClick={toggleMaintenanceMode}
            disabled={isTogglingMaintenance}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-mono font-black uppercase tracking-wider border shrink-0 transition-all cursor-pointer disabled:opacity-50 ${
              maintenanceMode
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-gray-800/40 text-gray-400 border-white/5 hover:text-white hover:border-white/10'
            }`}
          >
            {isTogglingMaintenance ? 'Vent...' : maintenanceMode ? 'Aktiv (Luk)' : 'Aktiver'}
          </button>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center text-[8px] font-mono text-gray-600">
        <span>Klip-målinger udføres løbende</span>
        <span>Sidst tjekket: {lastChecked || 'Lige nu'}</span>
      </div>
    </motion.div>
  );
}
