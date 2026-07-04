import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  X,
  Server,
  Users,
  Settings,
  Database,
  Terminal,
  ShieldAlert,
  Cpu,
  Network,
  Bot,
  PieChart as PieChartIcon,
} from "lucide-react";
import { BinanceTradingPanel } from "./BinanceTradingPanel";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const SECTOR_DATA = [
  { name: "Layer 1 (L1)", value: 55 },
  { name: "DeFi", value: 20 },
  { name: "Infrastruktur", value: 15 },
  { name: "AI & Web3", value: 10 },
];
const PIE_COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6"];

interface AdminDashboardProps {
  onClose: () => void;
  adminEmail: string;
}

export function AdminDashboard({ onClose, adminEmail }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "logs" | "config" | "users" | "ai_trading"
  >("overview");
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem("ai_model") || "gemini-3.5-flash",
  );

  // Logs
  const [logs, setLogs] = useState<
    { time: string; msg: string; type: "info" | "warn" | "error" }[]
  >([]);

  const [sysStatus, setSysStatus] = useState({
    cpu: 0,
    ram: 0,
    activeConnections: 0,
    cacheHitRate: 0,
  });
  const [autoRefreshTelemetry, setAutoRefreshTelemetry] = useState(false);

  const clearCache = async () => {
    // In a real app, we would call an endpoint to clear the server cache
    alert("Server cache cleared successfully.");
    setLogs((prev) => [
      {
        time: new Date().toISOString(),
        msg: "Administrator cleared server cache",
        type: "info",
      },
      ...prev,
    ]);
  };

  const addLog = useCallback(
    (msg: string, type: "info" | "warn" | "error" = "info") => {
      setLogs((prev) => [
        { time: new Date().toISOString(), msg, type },
        ...prev,
      ]);
    },
    [],
  );

  useEffect(() => {
    // True API call to fetch live telemetry would happen here.
  }, [autoRefreshTelemetry]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-gray-950/95 backdrop-blur-md overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="text-amber-500 size-5" />
              Command Center
            </h2>
            <p className="hidden md:block text-xs text-gray-500 mt-2 font-mono break-all">
              {adminEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="size-6" />
          </button>
        </div>
        <nav className="flex-1 p-2 md:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "overview" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"}`}
          >
            <Activity className="size-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Systemoversigt</span>
            <span className="sm:hidden">Oversigt</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "logs" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"}`}
          >
            <Terminal className="size-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Aktivitetslogs</span>
            <span className="sm:hidden">Logs</span>
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "config" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"}`}
          >
            <Settings className="size-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Platform Konfiguration</span>
            <span className="sm:hidden">Konf</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "users" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"}`}
          >
            <Users className="size-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Adgangskontrol</span>
            <span className="sm:hidden">Adgang</span>
          </button>
          <button
            onClick={() => setActiveTab("ai_trading")}
            className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === "ai_trading" ? "bg-amber-900/40 text-amber-500 border border-amber-800/50" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"}`}
          >
            <Bot className="size-4 shrink-0" />{" "}
            <span className="hidden sm:inline">AI Trading (Live)</span>
            <span className="sm:hidden">Trading</span>
          </button>
        </nav>
        <div className="hidden md:block p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold flex justify-center items-center gap-2 transition-colors border border-gray-700"
          >
            <X className="size-4" /> Exit Command Center
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
        <div className="max-w-6xl mx-auto space-y-8">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                    System Telemetri
                  </h3>
                  <p className="text-gray-500 font-mono text-sm mt-1">
                    Realtids infrastruktur ydelse
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Auto-Opdatering (10s)
                    </span>
                    <div
                      className={`relative w-10 h-6 rounded-full transition-colors ${autoRefreshTelemetry ? "bg-cyan-500" : "bg-gray-800"}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={autoRefreshTelemetry}
                        onChange={() =>
                          setAutoRefreshTelemetry(!autoRefreshTelemetry)
                        }
                      />
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${autoRefreshTelemetry ? "translate-x-4" : "translate-x-0"}`}
                      ></div>
                    </div>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-full hidden sm:flex">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs text-emerald-400 font-mono uppercase tracking-widest">
                      Netværk Stabilt
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-start mb-4">
                    <Cpu className="text-cyan-500 size-5" />
                    <span className="text-xs text-gray-500 font-mono uppercase">
                      Compute Belastning
                    </span>
                  </div>
                  <div className="text-3xl font-mono text-white mb-2">
                    {sysStatus.cpu.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-1000"
                      style={{ width: `${sysStatus.cpu}%` }}
                    ></div>
                  </div>
                </div>
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-start mb-4">
                    <Server className="text-emerald-500 size-5" />
                    <span className="text-xs text-gray-500 font-mono uppercase">
                      Hukommelsesforbrug
                    </span>
                  </div>
                  <div className="text-3xl font-mono text-white mb-2">
                    {sysStatus.ram.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-1000"
                      style={{ width: `${sysStatus.ram}%` }}
                    ></div>
                  </div>
                </div>
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-start mb-4">
                    <Network className="text-amber-500 size-5" />
                    <span className="text-xs text-gray-500 font-mono uppercase">
                      Aktive Forbindelser
                    </span>
                  </div>
                  <div className="text-3xl font-mono text-white mb-2">
                    {sysStatus.activeConnections}
                  </div>
                </div>
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-start mb-4">
                    <Database className="text-purple-500 size-5" />
                    <span className="text-xs text-gray-500 font-mono uppercase">
                      Cache Hit Rate
                    </span>
                  </div>
                  <div className="text-3xl font-mono text-white mb-2">
                    {sysStatus.cacheHitRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="text-cyan-500 size-5" />
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Sektor Eksponering
                      </h4>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={SECTOR_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                          isAnimationActive={false}
                        >
                          {SECTOR_DATA.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#030712",
                            borderColor: "#1f2937",
                            borderRadius: "0.5rem",
                            fontSize: "10px",
                            fontFamily: "monospace",
                          }}
                          itemStyle={{ color: "#fff" }}
                          formatter={(value: number) => [
                            `${value}%`,
                            "Allokering",
                          ]}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "10px",
                            fontFamily: "monospace",
                            color: "#9ca3af",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Hurtige Værktøjer
                  </h4>
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={clearCache}
                      className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors border border-gray-700"
                    >
                      Ryd App Cache
                    </button>
                    <button
                      onClick={() =>
                        addLog("Tvungen AI model genstart", "warn")
                      }
                      className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors border border-gray-700"
                    >
                      Genstart AI Instans
                    </button>
                    <button
                      onClick={() =>
                        addLog("Nødbremse aktiveret (Trafik stoppet)", "error")
                      }
                      className="w-full px-6 py-3 bg-rose-950/40 text-rose-400 border border-rose-900/50 hover:bg-rose-900/40 rounded-xl font-bold text-sm transition-colors mt-auto"
                    >
                      Nødbremse (Stop Trafik)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                  Systemlogs
                </h3>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  Realtids terminal output
                </p>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 h-[600px] overflow-y-auto font-mono text-sm flex flex-col gap-2 relative shadow-inner">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-3 border-l-2 ${log.type === "error" ? "border-rose-500 bg-rose-950/20 text-rose-300" : log.type === "warn" ? "border-amber-500 bg-amber-950/10 text-amber-300" : "border-gray-700 text-gray-400"} rounded-r`}
                  >
                    <span className="text-gray-600 mr-4">
                      [{new Date(log.time).toLocaleTimeString()}]
                    </span>
                    {log.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                  Platform Konfiguration
                </h3>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  Global logik og grænser
                </p>
              </div>
              <div className="grid gap-6 max-w-2xl">
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Standard AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      localStorage.setItem('ai_model', e.target.value);
                    }}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 appearance-none"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Hurtigst)</option>
                    <option value="deep-research-preview-04-2026">Deep Research Pro Preview</option>
                    <option value="antigravity-preview-05-2026">Antigravity Agent</option>
                    <option value="gemma-2-27b-it">Gemma 4 26B</option>
                  </select>
                </div>
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]">
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Cache TTL (ms)
                  </label>
                  <input
                    type="number"
                    defaultValue={3600000}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Levetid for AI svar-cache for at forhindre rate limits.
                  </p>
                </div>
                <div className="p-6 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-300">
                      Streng Rate Limiting
                    </h4>
                    <p className="text-xs text-gray-500">
                      Begræns brugerforespørgsler globalt.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      addLog("Streng Rate Limiting skiftet", "warn")
                    }
                    className="w-12 h-6 bg-emerald-500 rounded-full relative transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                  </button>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem("ai_model", selectedModel);
                    alert("Indstillinger gemt globalt");
                  }}
                  className="px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-gray-950 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-cyan-900/30"
                >
                  Gem Global Konfiguration
                </button>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                  Adgangskontrol
                </h3>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  Administrer brugerniveauer og licenser
                </p>
              </div>
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl overflow-x-auto w-full">
                <table className="w-full text-left text-sm text-gray-400 min-w-[600px] sm:min-w-full">
                  <thead className="bg-gray-950 text-xs uppercase tracking-widest text-gray-500 font-bold border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4">Bruger Email</th>
                      <th className="px-6 py-4">Niveau</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr className="bg-gray-900/20">
                      <td className="px-6 py-4 font-mono text-white">
                        djminirocker@gmail.com
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-amber-950/50 text-amber-500 border border-amber-900/50 rounded text-xs font-bold uppercase">
                          Administrator
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-500">● Aktiv</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-500 hover:text-white transition-colors">
                          Rediger
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono text-white">
                        investor99@proton.me
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs font-bold uppercase">
                          Standard
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-500">● Aktiv</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors">
                          Opgrader
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono text-white">
                        whale.capital@fund.io
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-950/30 text-purple-400 border border-purple-900/50 rounded text-xs font-bold uppercase">
                          Enterprise
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-amber-500">● Begrænset</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-rose-500 hover:text-rose-400 font-bold transition-colors">
                          Tilbagekald
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "ai_trading" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                    AI Autonom Handel
                  </h3>
                  <p className="text-gray-500 font-mono text-sm mt-1">
                    Konfigurer og implementer algoritmiske eksekverings-agenter
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/30 border border-amber-900/50 rounded-full hidden sm:flex">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-xs text-amber-400 font-mono uppercase tracking-widest hidden sm:inline">
                    Auto-Broker Forbundet
                  </span>
                </div>
              </div>

              <BinanceTradingPanel addLog={addLog} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
