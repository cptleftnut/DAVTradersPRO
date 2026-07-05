import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileSpreadsheet, History, Download, Search, Filter, 
  Clock, AlertTriangle, CheckCircle, XCircle, Info, Lock, RefreshCw, Trash2, ShieldAlert
} from 'lucide-react';
import { 
  getAuditLogs, logAuditEvent, verifyAuditTrailIntegrity, 
  exportAuditLogsToCSV, clearAuditLogs, AuditLogEntry, IntegrityResult 
} from '../lib/auditLogger';
import { toast } from 'sonner';

export function AuditTrail() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Integrity check states
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load audit logs initially and bind custom event listener
  const fetchLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    fetchLogs();
    
    // Seed an initial genesis block log if none exist
    const initialLogs = getAuditLogs();
    if (initialLogs.length === 0) {
      logAuditEvent({
        type: 'system',
        action: 'AUDIT_TRAIL_INITIALIZED',
        details: 'Det sikre overvågningssystem er aktiveret. Integritetsovervågning og hash-sammenkædning er startet.',
        status: 'success',
        user: 'System Kernel'
      });
      fetchLogs();
    }

    const handleUpdate = () => {
      fetchLogs();
    };

    window.addEventListener('audit_trail_updated', handleUpdate);
    return () => {
      window.removeEventListener('audit_trail_updated', handleUpdate);
    };
  }, []);

  const handleIntegrityCheck = () => {
    setIsVerifying(true);
    setIntegrityResult(null);
    
    setTimeout(() => {
      const result = verifyAuditTrailIntegrity();
      setIntegrityResult(result);
      setIsVerifying(false);
      
      if (result.isValid) {
        toast.success('Integritet bekræftet!', {
          description: 'Alle kryptografiske hash-links i logkæden er intakte og uændrede.'
        });
      } else {
        toast.error('Advarsel: Datamanipulation detekteret!', {
          description: `Log-kæden er brudt ved indeks ${result.tamperedIndex}. Forventet hash matcher ikke den faktiske.`
        });
      }
    }, 800);
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error('Ingen logdata at eksportere');
      return;
    }
    try {
      exportAuditLogsToCSV(logs);
      toast.success('Rapport eksporteret', {
        description: `${logs.length} loglinjer er downloadet som CSV.`
      });
      
      logAuditEvent({
        type: 'system',
        action: 'AUDIT_LOG_EXPORTED',
        details: `Revisionsrapport med ${logs.length} loghændelser blev eksporteret til CSV til skatte- og overholdelsesrapportering.`,
        status: 'info',
        user: 'System Admin'
      });
    } catch (err) {
      toast.error('Eksport mislykkedes');
    }
  };

  const handleClear = () => {
    if (window.confirm('Er du sikker på, at du vil slette systemets revisionsspor? Dette vil bryde den nuværende kryptografiske kæde og oprette en ny start-blok.')) {
      clearAuditLogs('System Admin');
      setIntegrityResult(null);
      fetchLogs();
      toast.warning('Systemlogge nulstillet', {
        description: 'En sikkerhedshændelse er blevet logget om denne handling.'
      });
    }
  };

  // Filter logs based on filters and search
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());
      
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <FileSpreadsheet className="size-4 text-emerald-400" />;
      case 'config':
        return <RefreshCw className="size-4 text-cyan-400" />;
      case 'error':
        return <AlertTriangle className="size-4 text-rose-400" />;
      case 'system':
        return <Lock className="size-4 text-purple-400" />;
      default:
        return <Info className="size-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
            <CheckCircle className="size-2.5" /> OK
          </span>
        );
      case 'failure':
        return (
          <span className="px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 shrink-0">
            <XCircle className="size-2.5" /> FEJL
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
            <AlertTriangle className="size-2.5" /> OBS
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 shrink-0">
            <Info className="size-2.5" /> INFO
          </span>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + d.toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-gray-950 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-xl">
      {/* Dynamic top gradient background */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <History className="size-4.5 text-cyan-400 animate-pulse" />
            AuditTrail & Revisionsspor
          </h2>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Sikkerhedskontrolleret revisionsspor med hash-sammenkædning til skat, overholdelse og risikokontrol.
          </p>
        </div>
        
        {/* Core Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* Integrity Shield Trigger */}
          <button
            onClick={handleIntegrityCheck}
            disabled={isVerifying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              integrityResult === null
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/25'
                : integrityResult.isValid
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-shake'
            }`}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="size-3 text-cyan-400 animate-spin" />
                Validerer...
              </>
            ) : integrityResult === null ? (
              <>
                <ShieldCheck className="size-3 text-cyan-400" />
                Tjek Kæde
              </>
            ) : integrityResult.isValid ? (
              <>
                <ShieldCheck className="size-3 text-emerald-400" />
                Intakt Kæde
              </>
            ) : (
              <>
                <ShieldAlert className="size-3 text-rose-400" />
                Brud Detekteret!
              </>
            )}
          </button>

          {/* Export CSV Trigger */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-gray-900 border border-white/5 hover:border-white/15 text-gray-300 hover:text-white transition-all cursor-pointer font-sans"
          >
            <Download className="size-3" />
            Eksporter CSV
          </button>

          {/* Wipe Logger */}
          <button
            onClick={handleClear}
            title="Nulstil alle logge"
            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Integrity failure banner */}
      {integrityResult && !integrityResult.isValid && (
        <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex gap-3 text-left">
          <ShieldAlert className="size-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="min-w-0">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Integritets-brud Detekteret!</h4>
            <p className="text-[9px] text-rose-300/85 mt-0.5 leading-normal">
              Revisionssporet er blevet manipuleret udefra! Den kryptografiske kæde fejlede ved elementet med ID <code className="bg-black/50 px-1 py-0.5 rounded text-rose-400 font-mono text-[8px]">{logs[integrityResult.tamperedIndex || 0]?.id}</code>. Kontroller dine lokale storage eller re-initialiser.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filtering Workspace */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 size-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Søg i hændelser, detaljer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="size-3 text-gray-500 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-black/40 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500/30 outline-none transition-all cursor-pointer"
          >
            <option value="all">Alle Kasser</option>
            <option value="trade">Handelsrobotter (Trade)</option>
            <option value="config">Indstillinger (Config)</option>
            <option value="error">Fejlrapporter (Error)</option>
            <option value="system">Sikkerhed (System)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Clock className="size-3 text-gray-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-black/40 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500/30 outline-none transition-all cursor-pointer"
          >
            <option value="all">Alle Statusser</option>
            <option value="success">Vellykkede (Success)</option>
            <option value="info">Informationer (Info)</option>
            <option value="warning">Advarsler (Warning)</option>
            <option value="failure">Kritiske fejl (Failure)</option>
          </select>
        </div>
      </div>

      {/* Log list / buffer table */}
      <div className="max-h-[350px] overflow-y-auto rounded-2xl border border-white/5 bg-black/20 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <History className="size-8 text-gray-700 stroke-[1.5]" />
            <p className="text-xs">Ingen revisionslogs fundet</p>
            <p className="text-[10px] text-gray-600">Prøv at justere dine søgefiltre.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-3.5 hover:bg-white/[0.015] transition-all flex flex-col gap-2 relative group ${
                  log.status === 'failure' ? 'bg-rose-500/[0.005]' : ''
                }`}
              >
                {/* Horizontal left border accent on hover */}
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-all ${
                  log.status === 'success' ? 'bg-emerald-500' :
                  log.status === 'failure' ? 'bg-rose-500' :
                  log.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`}></div>

                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg shrink-0">
                      {getCategoryIcon(log.type)}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-mono font-black text-white tracking-tight break-all">
                          {log.action}
                        </span>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1 leading-normal break-words">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 text-right mt-1 sm:mt-0">
                    <span className="text-[8.5px] text-gray-500 font-mono flex items-center gap-1.5">
                      <Clock className="size-2.5 text-gray-600" />
                      {formatDate(log.timestamp)}
                    </span>
                    <span className="text-[7.5px] text-gray-600 font-mono mt-0.5">
                      Bruger: <strong className="text-gray-400">{log.user}</strong>
                    </span>
                  </div>
                </div>

                {/* Secure rolling hash metadata expandable footer */}
                <div className="pt-2 border-t border-dashed border-white/[0.03] flex justify-between items-center text-[7px] font-mono text-gray-600">
                  <span>ID: <strong className="text-gray-500">{log.id}</strong></span>
                  <span className="truncate max-w-[200px]" title={`Hængsel-signatur: ${log.hash}`}>
                    Signaturnøgle: <strong className="text-gray-500">{log.hash}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Panel Footer */}
      <div className="mt-4 flex items-center gap-2 p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
        <ShieldCheck className="size-3.5 text-cyan-500/80 shrink-0" />
        <p className="text-[8.5px] text-gray-500 leading-normal">
          Dette revisionsspor er udelukkende klientside-beskyttet og låst ved hjælp af en tidsbaseret kryptografisk hash-kæde (hash chaining). Eventuel direkte manipulation af localStorage vil øjeblikkeligt udløse integritetsfejl ved næste revisionskontrol.
        </p>
      </div>
    </div>
  );
}
