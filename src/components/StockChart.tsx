import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Bar,
  Cell,
} from "recharts";
import {
  Download,
  Loader2,
  SlidersHorizontal,
  SearchX,
  MessageSquareText,
  Check,
  X as XIcon,
  Trash2,
  StickyNote,
  Maximize2,
  Minimize2,
  Columns,
  Copy,
  PenLine,
  Eraser,
  Link2,
  Camera,
} from "lucide-react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "motion/react";
import { JournalEntry } from "./TradeJournal";
import { toast } from "sonner";

const CustomChartTooltip = ({
  active,
  payload,
  label,
  secondaryTicker,
}: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const pctChange = dataPoint.pctChange;
    const pctStr =
      pctChange != null
        ? `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(2)}%`
        : "";

    return (
      <div className="bg-gray-950 border border-gray-700 p-3 rounded-xl shadow-xl space-y-1.5 text-sm min-w-[200px]">
        <div className="text-gray-400 text-xs mb-2 pb-2 border-b border-gray-800 font-mono">
          {label}
        </div>
        <div>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;

            let name = entry.name;
            let value =
              typeof entry.value === "number"
                ? entry.value.toFixed(2)
                : entry.value;
            let valueColor = entry.color || "#f3f4f6";
            let pctSuffix = "";

            if (entry.dataKey === "value") {
              name = "Kurs ($)";
              if (pctChange != null) {
                const isPositive = pctChange >= 0;
                pctSuffix = ` (${pctStr})`;
              }
            } else if (entry.dataKey === "volume") {
              name = "Volumen";
              value = Number(entry.value).toLocaleString();
            } else if (entry.dataKey === "secondaryNormalized") {
              name = secondaryTicker
                ? secondaryTicker.toUpperCase()
                : "Sammenlign";
            } else if (entry.dataKey === "sma") name = "SMA";
            else if (entry.dataKey === "ema") name = "EMA";
            else if (entry.dataKey === "bbUpper") name = "BB Upper";
            else if (entry.dataKey === "bbLower") name = "BB Lower";
            else if (entry.dataKey === "rsiOverboughtMarker") {
              name = "RSI Overbought";
              value = "(>70)";
              valueColor = "#ef4444";
            } else if (entry.dataKey === "rsiOversoldMarker") {
              name = "RSI Oversold";
              value = "(<30)";
              valueColor = "#10b981";
            } else if (entry.dataKey === "rsi") name = "RSI";
            else if (entry.dataKey === "forecast") name = "AI Forecast";
            else if (entry.dataKey === "volatility") {
              name = "30d Volatility";
              value = `${parseFloat(value).toFixed(1)}%`;
            }

            return (
              <div
                key={index}
                className="flex justify-between items-center gap-4 py-0.5"
              >
                <span className="text-gray-400 text-xs">{name}</span>
                <div
                  className="font-mono text-sm"
                  style={{ color: valueColor }}
                >
                  {value}
                  {pctSuffix && (
                    <span
                      className={
                        pctChange >= 0
                          ? "text-emerald-400 text-xs ml-1"
                          : "text-rose-400 text-xs ml-1"
                      }
                    >
                      {pctSuffix}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export interface ChartMarker {
  id: string;
  symbol: string;
  name: string;
  value: number;
  text: string;
  x?: number;
  y?: number;
}

export const StockChart = React.memo(function StockChart({
  data,
  ticker,
  timeframe,
  onTimeframeChange,
  alertThreshold,
  baseAlertPrice,
  showForecast,
  journalEntries,
  signal,
  marketCorrelation,
}: {
  data: { name: string; value: number; volume?: number; forecast?: number }[];
  ticker?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  alertThreshold?: number;
  baseAlertPrice?: number | null;
  showForecast?: boolean;
  journalEntries?: JournalEntry[];
  signal?: 'BUY' | 'SELL' | 'HOLD';
  marketCorrelation?: number;
}) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<{ BTC: number; GOLD: number; SPX: number } | null>(null);
  const [isLoadingCorrelations, setIsLoadingCorrelations] = useState<boolean>(false);

  useEffect(() => {
    if (!ticker) return;
    let isMounted = true;
    const loadCorrelations = async () => {
      setIsLoadingCorrelations(true);
      try {
        const res = await fetch(`/api/market-correlation?symbol=${ticker}`);
        if (res.ok) {
          const result = await res.json();
          if (isMounted && result.correlations) {
            setCorrelations(result.correlations);
          }
        }
      } catch (err) {
        console.error("Failed to load correlations in StockChart:", err);
      } finally {
        if (isMounted) setIsLoadingCorrelations(false);
      }
    };
    
    loadCorrelations();
    return () => {
      isMounted = false;
    };
  }, [ticker]);

  const chartRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showVolatility, setShowVolatility] = useState(false);
  const [zoomRange, setZoomRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const zoomRangeRef = useRef<{ start: number; end: number } | null>(null);
  const [crosshair, setCrosshair] = useState<any>(null);

  const [isDrawingTrendline, setIsDrawingTrendline] = useState(false);
  const [trendlines, setTrendlines] = useState<{ id: string, start: { x: string, y: number }, end: { x: string, y: number } }[]>([]);
  const [currentTrendline, setCurrentTrendline] = useState<{ start: { x: string, y: number }, end: { x: string, y: number } } | null>(null);

  const crosshairRef = useRef<HTMLDivElement>(null);
  const xLineRef = useRef<HTMLDivElement>(null);
  const yLineRef = useRef<HTMLDivElement>(null);
  const xLabelRef = useRef<HTMLDivElement>(null);
  const yLabelRef = useRef<HTMLDivElement>(null);

  const touchStartRef = useRef<{
    x: number;
    y: number;
    startZoom: { start: number; end: number };
  } | null>(null);
  const [chartMarkers, setChartMarkers] = useState<ChartMarker[]>(() => {
    try {
      const saved = localStorage.getItem("chart_markers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("chart_markers", JSON.stringify(chartMarkers));
  }, [chartMarkers]);
  const [addingMarker, setAddingMarker] = useState<{
    name: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);
  const [markerInput, setMarkerInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Request browser notification permissions
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    zoomRangeRef.current = zoomRange;
  }, [zoomRange]);

  useEffect(() => {
    if (data && data.length > 0) {
      setZoomRange({ start: 0, end: data.length - 1 });
    }
  }, [data, timeframe]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!data || data.length === 0) return;

      setZoomRange((prev) => {
        if (!prev) return null;

        // Allow panning if shift key is pressed
        if (e.shiftKey) {
          e.preventDefault();
          const panAdjustment = Math.max(1, Math.floor(data.length * 0.02));
          let newStart =
            prev.start + (e.deltaY > 0 ? panAdjustment : -panAdjustment);
          let newEnd =
            prev.end + (e.deltaY > 0 ? panAdjustment : -panAdjustment);

          if (newStart < 0) {
            newEnd = newEnd - newStart;
            newStart = 0;
          }
          if (newEnd >= data.length) {
            newStart = newStart - (newEnd - (data.length - 1));
            newEnd = data.length - 1;
          }
          if (newStart < 0) newStart = 0;

          return { start: newStart, end: newEnd };
        }

        // Normal zoom (ctrl/cmd or just scroll)
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1; // 1 zoom out, -1 zoom in
        const adjustment = Math.max(
          1,
          Math.floor((prev.end - prev.start) * 0.1),
        );

        let newStart = prev.start - delta * adjustment;
        let newEnd = prev.end + delta * adjustment;

        if (newStart < 0) newStart = 0;
        if (newEnd >= data.length) newEnd = data.length - 1;

        if (newEnd - newStart < Math.min(5, data.length)) {
          return prev;
        }

        return { start: newStart, end: newEnd };
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && zoomRangeRef.current) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          startZoom: { ...zoomRangeRef.current },
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        e.touches.length === 1 &&
        touchStartRef.current &&
        data &&
        data.length > 0
      ) {
        const deltaX = touchStartRef.current.x - e.touches[0].clientX;
        const deltaY = Math.abs(touchStartRef.current.y - e.touches[0].clientY);

        // If swiping horizontally primarily, prevent default scrolling
        if (Math.abs(deltaX) > deltaY) {
          e.preventDefault();
        }

        const el = scrollWrapperRef.current;
        const chartWidth = el?.clientWidth || 300;
        const pointsInView =
          touchStartRef.current.startZoom.end -
          touchStartRef.current.startZoom.start +
          1;
        const pointsPerPixel = pointsInView / chartWidth;

        // Multiplier to increase pan speed on mobile
        const pointDelta = Math.round(deltaX * pointsPerPixel * 1.5);

        let newStart = touchStartRef.current.startZoom.start + pointDelta;
        let newEnd = touchStartRef.current.startZoom.end + pointDelta;

        if (newStart < 0) {
          newEnd -= newStart;
          newStart = 0;
        }
        if (newEnd >= data.length) {
          const overflow = newEnd - (data.length - 1);
          newStart -= overflow;
          newEnd = data.length - 1;
        }
        if (newStart < 0) newStart = 0;
        if (newEnd >= data.length) newEnd = data.length - 1;

        setZoomRange({ start: newStart, end: newEnd });
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    const el = scrollWrapperRef.current;
    if (el) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      el.addEventListener("touchstart", handleTouchStart, { passive: true });
      el.addEventListener("touchmove", handleTouchMove, { passive: false });
      el.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      if (el) {
        el.removeEventListener("wheel", handleWheel);
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchmove", handleTouchMove);
        el.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [data]);

  const resetZoom = () => {
    if (data && data.length > 0) {
      setZoomRange({ start: 0, end: data.length - 1 });
    }
  };

  const handleChartClick = (e: any) => {
    if (isDrawingTrendline) return;
    if (
      e &&
      e.activePayload &&
      e.activePayload.length > 0 &&
      e.activeCoordinate
    ) {
      const dataPoint = e.activePayload[0].payload;
      setAddingMarker({
        name: dataPoint.name,
        value: dataPoint.value,
        x: e.activeCoordinate.x,
        y: e.activeCoordinate.y,
      });
      setMarkerInput("");
    }
  };

  const saveMarker = () => {
    if (addingMarker && markerInput.trim()) {
      setChartMarkers((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          symbol: ticker || "UNKNOWN",
          name: addingMarker.name,
          value: addingMarker.value,
          text: markerInput.trim(),
        },
      ]);
    }
    setAddingMarker(null);
    setMarkerInput("");
  };

  const deleteMarker = (id: string, e: any) => {
    e.stopPropagation();
    setChartMarkers((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    const loadAlerts = () => {
      try {
        const stored = localStorage.getItem("binance_price_alerts");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setAlerts(parsed);
            return;
          }
        }
        setAlerts([]);
      } catch (e) {
        console.error("Failed to parse price alerts in StockChart:", e);
      }
    };

    loadAlerts();

    const handleUpdate = () => {
      loadAlerts();
    };

    window.addEventListener("binance_price_alerts_changed", handleUpdate);
    return () => {
      window.removeEventListener("binance_price_alerts_changed", handleUpdate);
    };
  }, []);

  // Filter alerts that match the current ticker / asset
  const filteredAlerts = alerts.filter((alert) => {
    if (!ticker) return false;
    const cleanAlertSym = (alert.symbol || "")
      .toUpperCase()
      .replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, "");
    const cleanChartTick = (ticker || "")
      .toUpperCase()
      .replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, "");
    return cleanAlertSym === cleanChartTick;
  });

  const fullChartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Determine period for SMA/BB (max 20, min 2)
    const period = Math.min(20, Math.max(2, Math.floor(data.length / 4)));
    const k = 2 / (period + 1);

    // RSI configuration
    const rsiPeriod = 14;
    let avgGain = 0;
    let avgLoss = 0;

    let prevEMA: number | null = null;

    let enrichedData = data.map((point, index, arr) => {
      let sma = null;
      let ema = null;
      let bbUpper = null;
      let bbLower = null;
      let rsi = null;
      let rsiOverboughtMarker = null;
      let rsiOversoldMarker = null;
      let pctChange = null;

      // RSI Calculation
      if (index > 0) {
        const change = point.value - arr[index - 1].value;
        pctChange = (change / arr[index - 1].value) * 100;

        const gain = Math.max(0, change);
        const loss = Math.max(0, -change);

        if (index < rsiPeriod) {
          avgGain += gain;
          avgLoss += loss;
          if (index === rsiPeriod - 1) {
            avgGain /= rsiPeriod;
            avgLoss /= rsiPeriod;
          }
        } else {
          avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
          avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;

          if (avgLoss === 0) {
            rsi = 100;
          } else {
            const rs = avgGain / avgLoss;
            rsi = 100 - 100 / (1 + rs);
          }
        }

        if (rsi !== null && arr.length > rsiPeriod) {
          // We'll mark the specific price points where RSI crossed into these zones
          if (rsi >= 70) rsiOverboughtMarker = point.value + point.value * 0.02; // Just above
          if (rsi <= 30) rsiOversoldMarker = point.value - point.value * 0.02; // Just below
        }
      }

      if (index >= period - 1) {
        const slice = arr.slice(index - period + 1, index + 1);
        const sum = slice.reduce((acc, val) => acc + val.value, 0);
        sma = sum / period;

        const variance =
          slice.reduce((acc, val) => acc + Math.pow(val.value - sma, 2), 0) /
          period;
        const stdDev = Math.sqrt(variance);

        bbUpper = sma + 2 * stdDev;
        bbLower = sma - 2 * stdDev;

        if (index === period - 1) {
          ema = sma;
          prevEMA = ema;
        } else if (prevEMA !== null) {
          ema = point.value * k + prevEMA * (1 - k);
          prevEMA = ema;
        }
      }

      let calculatedVolume = point.volume;
      if (calculatedVolume == null) {
          if (index > 0) {
             const change = point.value - arr[index - 1].value;
             const absPctChange = Math.abs(change / arr[index - 1].value);
             calculatedVolume = Math.floor(1000 + (absPctChange * 100000));
          } else {
             calculatedVolume = 1000;
          }
      }

      let volatility = null;
      const volPeriod = 30; // Using 30 periods
      if (index >= volPeriod - 1 && arr.length >= volPeriod) {
        let sliceReturns = [];
        for (let i = index - volPeriod + 1; i <= index; i++) {
           const prevVal = arr[i - 1]?.value || 1; 
           const ret = (arr[i].value - prevVal) / prevVal;
           sliceReturns.push(ret);
        }
        const mean = sliceReturns.reduce((a, b) => a + b, 0) / volPeriod;
        const variance = sliceReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (volPeriod - 1);
        const annualizedVol = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized assuming daily
        volatility = annualizedVol;
      }

      return {
        ...point,
        volume: calculatedVolume,
        sma,
        ema,
        bbUpper,
        bbLower,
        rsi,
        rsiOverboughtMarker,
        rsiOversoldMarker,
        pctChange,
        volatility,
        forecast: null as number | null,
      };
    });

    if (showForecast && enrichedData.length > 5) {
      const lastPoint = enrichedData[enrichedData.length - 1];
      lastPoint.forecast = lastPoint.value;

      const trend =
        (lastPoint.value - enrichedData[enrichedData.length - 5].value) / 5;
      for (let i = 1; i <= 5; i++) {
        enrichedData.push({
          name: `FCST ${i}`,
          value: null as any,
          forecast:
            lastPoint.value +
            trend * i +
            (Math.random() - 0.5) * Math.abs(trend),
          volume: null as any,
          sma: null,
          ema: null,
          bbUpper: null,
          bbLower: null,
          rsi: null,
          rsiOverboughtMarker: null,
          rsiOversoldMarker: null,
        } as any);
      }
    }

    return enrichedData;
  }, [data, showForecast]);

  const [isSplitView, setIsSplitView] = useState(false);
  const [secondaryTimeframe, setSecondaryTimeframe] = useState("1D");
  const [splitViewData, setSplitViewData] = useState<any[]>([]);
  const [isLoadingSplitView, setIsLoadingSplitView] = useState(false);

  const splitFullChartData = useMemo(() => {
    if (!splitViewData || splitViewData.length === 0) return [];

    const period = Math.min(
      20,
      Math.max(2, Math.floor(splitViewData.length / 4)),
    );
    const k = 2 / (period + 1);
    const rsiPeriod = 14;
    let avgGain = 0;
    let avgLoss = 0;
    let prevEMA: number | null = null;

    let enrichedData = splitViewData.map((point, index, arr) => {
      let sma = null,
        ema = null,
        bbUpper = null,
        bbLower = null,
        rsi = null,
        rsiOverboughtMarker = null,
        rsiOversoldMarker = null,
        pctChange = null;

      if (index > 0) {
        const change = point.value - arr[index - 1].value;
        pctChange = (change / arr[index - 1].value) * 100;
        const gain = Math.max(0, change);
        const loss = Math.max(0, -change);

        if (index < rsiPeriod) {
          avgGain += gain;
          avgLoss += loss;
          if (index === rsiPeriod - 1) {
            avgGain /= rsiPeriod;
            avgLoss /= rsiPeriod;
          }
        } else {
          avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
          avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
          if (avgLoss === 0) rsi = 100;
          else rsi = 100 - 100 / (1 + avgGain / avgLoss);
        }

        if (rsi !== null && arr.length > rsiPeriod) {
          if (rsi >= 70) rsiOverboughtMarker = point.value + point.value * 0.02;
          if (rsi <= 30) rsiOversoldMarker = point.value - point.value * 0.02;
        }
      }

      if (index >= period - 1) {
        const slice = arr.slice(index - period + 1, index + 1);
        const sum = slice.reduce((acc, val) => acc + val.value, 0);
        sma = sum / period;
        const variance =
          slice.reduce((acc, val) => acc + Math.pow(val.value - sma, 2), 0) /
          period;
        const stdDev = Math.sqrt(variance);
        bbUpper = sma + 2 * stdDev;
        bbLower = sma - 2 * stdDev;

        if (index === period - 1) {
          ema = sma;
          prevEMA = ema;
        } else if (prevEMA !== null) {
          ema = point.value * k + prevEMA * (1 - k);
          prevEMA = ema;
        }
      }

      let calculatedVolume = point.volume;
      if (calculatedVolume == null) {
          if (index > 0) {
             const change = point.value - arr[index - 1].value;
             const absPctChange = Math.abs(change / arr[index - 1].value);
             calculatedVolume = Math.floor(1000 + (absPctChange * 100000));
          } else {
             calculatedVolume = 1000;
          }
      }

      let volatility = null;
      const volPeriod = 30; // Using 30 periods
      if (index >= volPeriod - 1 && arr.length >= volPeriod) {
        let sliceReturns = [];
        for (let i = index - volPeriod + 1; i <= index; i++) {
           const prevVal = arr[i - 1]?.value || 1; 
           const ret = (arr[i].value - prevVal) / prevVal;
           sliceReturns.push(ret);
        }
        const mean = sliceReturns.reduce((a, b) => a + b, 0) / volPeriod;
        const variance = sliceReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (volPeriod - 1);
        const annualizedVol = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized assuming daily
        volatility = annualizedVol;
      }

      return {
        ...point,
        volume: calculatedVolume,
        sma,
        ema,
        bbUpper,
        bbLower,
        rsi,
        rsiOverboughtMarker,
        rsiOversoldMarker,
        pctChange,
        volatility,
        forecast: null as number | null,
      };
    });

    if (showForecast && enrichedData.length > 5) {
      const lastPoint = enrichedData[enrichedData.length - 1];
      lastPoint.forecast = lastPoint.value;
      const trend =
        (lastPoint.value - enrichedData[enrichedData.length - 5].value) / 5;
      for (let i = 1; i <= 5; i++) {
        enrichedData.push({
          name: `FCST ${i}`,
          value: null as any,
          forecast:
            lastPoint.value +
            trend * i +
            (Math.random() - 0.5) * Math.abs(trend),
          volume: null as any,
          sma: null,
          ema: null,
          bbUpper: null,
          bbLower: null,
          rsi: null,
          rsiOverboughtMarker: null,
          rsiOversoldMarker: null,
          pctChange: null,
        } as any);
      }
    }
    return enrichedData;
  }, [splitViewData, showForecast]);

  // Handle Notifications for RSI Crossing
  useEffect(() => {
    if (!fullChartData || fullChartData.length < 2) return;
    // Look at the last actual data point (skip forecasts)
    const validData = fullChartData.filter(
      (d) => d.value !== null && d.rsi !== null,
    );
    if (validData.length < 2) return;

    const current = validData[validData.length - 1];
    const prev = validData[validData.length - 2];

    const prevRsi = prev.rsi;
    const currentRsi = current.rsi;
    
    if (typeof prevRsi !== 'number' || typeof currentRsi !== 'number' || isNaN(prevRsi) || isNaN(currentRsi)) return;

    let triggerTitle = null;
    let triggerBody = null;

    if (prevRsi < 70 && currentRsi >= 70) {
      triggerTitle = `⚠️ Overbought Alert: ${ticker || "Asset"}`;
      triggerBody = `RSI has crossed above 70 (Current RSI: ${currentRsi.toFixed(1)}). Consider taking profits.`;
    } else if (prevRsi > 30 && currentRsi <= 30) {
      triggerTitle = `🔔 Oversold Alert: ${ticker || "Asset"}`;
      triggerBody = `RSI has crossed below 30 (Current RSI: ${currentRsi.toFixed(1)}). Potential buying opportunity.`;
    }

    if (triggerTitle && triggerBody) {
      toast.warning(triggerTitle, { description: triggerBody });
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(triggerTitle, { body: triggerBody });
        }
      }
    }
  }, [fullChartData, ticker]);

  const [secondaryTicker, setSecondaryTicker] = useState("");
  const [secondaryData, setSecondaryData] = useState<
    { name: string; value: number }[]
  >([]);
  const [isLoadingSecondary, setIsLoadingSecondary] = useState(false);

  useEffect(() => {
    if (isSplitView && ticker) {
      let isMounted = true;
      const fetchSplitData = async () => {
        setIsLoadingSplitView(true);
        try {
          let formattedTicker = ticker.toUpperCase();
          if (
            formattedTicker.length >= 2 &&
            !formattedTicker.endsWith("USDT") &&
            !formattedTicker.endsWith("USDC") &&
            !formattedTicker.endsWith("BTC") &&
            !formattedTicker.endsWith("ETH")
          ) {
            formattedTicker += "USDT";
          }
          const response = await fetch(
            `/api/binance-proxy/klines?symbol=${formattedTicker}&interval=${secondaryTimeframe}&limit=100`,
          );
          if (!response.ok) throw new Error("Could not fetch split view data");
          const rawData = await response.json();
          const formatted = rawData.map((d: any) => ({
            name: new Date(d[0]).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            value: parseFloat(d[4]),
            volume: parseFloat(d[5]),
          }));
          if (isMounted) setSplitViewData(formatted);
        } catch (e) {
          console.error(e);
        } finally {
          if (isMounted) setIsLoadingSplitView(false);
        }
      };
      fetchSplitData();
      return () => {
        isMounted = false;
      };
    }
  }, [isSplitView, secondaryTimeframe, ticker]);

  const fetchSecondaryData = async (symbol: string) => {
    setIsLoadingSecondary(true);
    try {
      const response = await fetch(
        `/api/binance-proxy/klines?symbol=${symbol.toUpperCase()}USDT&interval=${timeframe}&limit=50`,
      );
      if (!response.ok) throw new Error("Could not fetch secondary data");
      const data = await response.json();
      const formatted = data.map((d: any) => ({
        name: new Date(d[0]).toLocaleTimeString(),
        value: parseFloat(d[4]),
      }));
      setSecondaryData(formatted);
    } catch (err) {
      console.error("Error fetching secondary data:", err);
    } finally {
      setIsLoadingSecondary(false);
    }
  };

  const chartData = useMemo(() => {
    if (!zoomRange || !fullChartData) return fullChartData;
    let base = fullChartData.slice(zoomRange.start, zoomRange.end + 1);

    // Note: fullChartData might have forecast added at the end, so its length might be > data.length
    // If user is scrolled all the way to the right or past data.length-1, extend zoomRange's end
    // so we can see the forecast points!
    if (showForecast && fullChartData.length > (data?.length || 0)) {
      const overflow = fullChartData.length - (data?.length || 0);
      if (zoomRange.end >= (data?.length || 0) - 1 - overflow) {
        base = fullChartData.slice(zoomRange.start, fullChartData.length);
      }
    }

    if (secondaryData.length === 0 || base.length === 0) return base;

    // Normalize secondary data to the base's first value
    const baseFirstValue = base[0].value;
    const secondaryFirstValue = secondaryData[0].value;
    const multiplier = baseFirstValue / secondaryFirstValue;

    return base.map((d, i) => {
      const secPoint = secondaryData[i];
      return {
        ...d,
        secondaryNormalized: secPoint ? secPoint.value * multiplier : null,
      };
    });
  }, [fullChartData, zoomRange, secondaryData, showForecast, data]);

  const handleMouseMove = (state: any) => {
    if (state && state.isTooltipActive && state.activeCoordinate && state.activePayload && state.activePayload.length > 0) {
      const x = state.activeCoordinate.x;
      const y = state.activeCoordinate.y;
      const payloadObj = state.activePayload.find((p: any) => p.dataKey === 'value') || state.activePayload[0];
      const payload = payloadObj.payload;
      
      if (isDrawingTrendline && currentTrendline) {
        setCurrentTrendline({
          ...currentTrendline,
          end: { x: payload.name, y: payload.value }
        });
      }

      if (crosshairRef.current) crosshairRef.current.style.display = 'block';
      if (xLineRef.current) {
        xLineRef.current.style.left = `${x}px`;
        // Extend slightly to not overlap text
      }
      if (yLineRef.current) {
        yLineRef.current.style.top = `${y}px`;
      }
      if (xLabelRef.current) {
        xLabelRef.current.style.left = `${x}px`;
        const volStr = payload.volume ? `Vol: ${Number(payload.volume).toLocaleString()}` : '';
        xLabelRef.current.innerText = `${payload.name} ${volStr ? '| ' + volStr : ''}`;
      }
      if (yLabelRef.current) {
        yLabelRef.current.style.top = `${y}px`;
        yLabelRef.current.innerText = `$${payload.value?.toFixed(2)}`;
      }
    } else {
      if (crosshairRef.current) crosshairRef.current.style.display = 'none';
    }
  };

  const handleMouseLeave = () => {
    if (crosshairRef.current) crosshairRef.current.style.display = 'none';
  };

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#030712",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `chart-${ticker || "export"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export chart:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const [isCopying, setIsCopying] = useState(false);

  const handleCopyCSV = async () => {
    try {
      setIsCopying(true);
      const csvHeader = ["Date", "Price", "Volume", "Forecast"].join(",");
      const csvRows = fullChartData.map((d) => 
        [d.name, d.value, d.volume || "", d.forecast || ""].join(",")
      );
      const csvContent = [csvHeader, ...csvRows].join("\n");
      await navigator.clipboard.writeText(csvContent);
      toast.success("Data kopieret til udklipsholder (CSV)");
    } catch (err) {
      console.error("Failed to copy CSV:", err);
      toast.error("Kunne ikke kopiere data");
    } finally {
      setIsCopying(false);
    }
  };

  const isZoomed =
    zoomRange &&
    data &&
    (zoomRange.start > 0 || zoomRange.end < data.length - 1);

  const renderChartContent = (
    displayData: any[],
    displayTimeframe: string,
    isSecondaryChart: boolean = false,
  ) => (
    <div
      className="w-full h-full relative border border-gray-800 rounded-xl bg-gray-900/20"
      style={{ minWidth: 0 }}
    >
      {isSecondaryChart && (
        <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">
            Timeframe:
          </span>
          {["5m", "1h", "4h", "1D", "1W"].map((tf) => (
            <button
              key={tf}
              onClick={() => setSecondaryTimeframe(tf)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${secondaryTimeframe === tf ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "border border-gray-800 text-gray-500 hover:text-gray-300"}`}
            >
              {tf}
            </button>
          ))}
          {isLoadingSplitView && (
            <Loader2 className="size-3 animate-spin text-cyan-400 ml-2 mt-0.5" />
          )}
        </div>
      )}
      {!isSecondaryChart && isSplitView && (
        <div className="absolute top-2 left-4 z-10 flex gap-2">
          <span className="text-[10px] text-gray-500 font-mono">
            Primary: {timeframe}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={displayData}
          onMouseDown={(e: any) => {
            if (isDrawingTrendline && e && e.activePayload && e.activePayload.length > 0) {
              const dataPoint = e.activePayload[0].payload;
              setCurrentTrendline({
                start: { x: dataPoint.name, y: dataPoint.value },
                end: { x: dataPoint.name, y: dataPoint.value }
              });
            }
          }}
          onMouseUp={() => {
            if (isDrawingTrendline && currentTrendline) {
              if (currentTrendline.start.x !== currentTrendline.end.x || currentTrendline.start.y !== currentTrendline.end.y) {
                setTrendlines(prev => [...prev, { ...currentTrendline, id: Date.now().toString() }]);
              }
              setCurrentTrendline(null);
            }
          }}
          onClick={isSecondaryChart ? undefined : handleChartClick}
          onMouseMove={isSecondaryChart ? undefined : handleMouseMove}
          onMouseLeave={isSecondaryChart ? undefined : handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            fontSize={10}
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis
            yAxisId="left"
            domain={["auto", "auto"]}
            stroke="#9ca3af"
            fontSize={10}
            tickMargin={10}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            hide
            domain={[0, "dataMax * 4"]}
          />
          {showVolatility && (
            <YAxis
              yAxisId="volatility"
              orientation="right"
              stroke="#fb923c"
              fontSize={10}
              tickMargin={10}
              tickFormatter={(val) => `${val.toFixed(1)}%`}
            />
          )}
          <Tooltip
            content={<CustomChartTooltip secondaryTicker={secondaryTicker} />}
            cursor={isSecondaryChart ? { stroke: "#4b5563", strokeWidth: 1, strokeDasharray: "4 4" } : false}
          />

          <Bar
            yAxisId="right"
            dataKey="volume"
            barSize={isSecondaryChart ? 15 : 30}
            fillOpacity={0.4}
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(entry.pctChange || 0) >= 0 ? "#10b981" : "#ef4444"} />
            ))}
          </Bar>

          {showVolatility && (
            <Line
              yAxisId="volatility"
              type="monotone"
              dataKey="volatility"
              stroke="#fb923c"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
          )}

          {showBB && (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="bbUpper"
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="bbLower"
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </>
          )}

          {showSMA && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sma"
              stroke="#d946ef"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}

          {showEMA && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="ema"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: "#030712", strokeWidth: 1, r: 2 }}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#f59e0b" }}
            isAnimationActive={false}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rsiOverboughtMarker"
            stroke="transparent"
            connectNulls={false}
            dot={{ fill: "#ef4444", r: 3, strokeWidth: 1, stroke: "#7f1d1d" }}
            activeDot={false}
            isAnimationActive={false}
            name="RSI Overbought (>70)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rsiOversoldMarker"
            stroke="transparent"
            connectNulls={false}
            dot={{ fill: "#10b981", r: 3, strokeWidth: 1, stroke: "#064e3b" }}
            activeDot={false}
            isAnimationActive={false}
            name="RSI Oversold (<30)"
          />

          {showForecast && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="forecast"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#10b981", r: 2 }}
              isAnimationActive={false}
              name="AI Forecast"
            />
          )}

          {secondaryTicker && secondaryData.length > 0 && !isSecondaryChart && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="secondaryNormalized"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              name={secondaryTicker.toUpperCase()}
              isAnimationActive={false}
            />
          )}

          {!isSecondaryChart &&
            chartMarkers
              .filter((m) => m.symbol === (ticker || "UNKNOWN"))
              .map((marker, idx) => (
                <ReferenceDot
                  key={`${marker.id}-${idx}`}
                  x={marker.name}
                  y={marker.value}
                  r={6}
                  fill="#f59e0b"
                  stroke="#78350f"
                  strokeWidth={2}
                  isFront={true}
                  label={(props: any) => {
                    const { cx, cy } = props;
                    if (cx === undefined || cy === undefined) return null;
                    return (
                      <g
                        transform={`translate(${cx}, ${cy})`}
                        onClick={(e) => deleteMarker(marker.id, e)}
                        className="cursor-pointer"
                        style={{ pointerEvents: "all" }}
                      >
                        <rect
                          x={-30}
                          y={-35}
                          width={60}
                          height={20}
                          fill="#f59e0b"
                          rx={4}
                        />
                        <text
                          x={0}
                          y={-21}
                          fill="#fff"
                          fontSize={10}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {marker.text}
                        </text>
                      </g>
                    );
                  }}
                />
              ))}

          {!isSecondaryChart &&
            journalEntries?.map((entry, idx) => {
              if (ticker && entry.ticker !== ticker) return null;

              let tfScale = 24 * 60 * 60 * 1000;
              if (timeframe === "1W") tfScale *= 7;
              else if (timeframe === "1M") tfScale *= 30;
              else if (timeframe === "3M") tfScale *= 90;
              else if (timeframe === "6M") tfScale *= 180;
              else if (timeframe === "1Y") tfScale *= 365;
              else if (timeframe === "5Y" || timeframe === "ALL") tfScale *= 365 * 5;

              const now = Date.now();
              const entryTime = new Date(entry.time).getTime();
              const diff = now - entryTime;

              let match = null;
              if (diff >= 0 && diff <= tfScale && displayData.length > 0) {
                  const percent = 1 - (diff / tfScale);
                  const index = Math.floor(percent * (displayData.length - 1));
                  if (index >= 0 && index < displayData.length) {
                      match = displayData[index];
                  }
              }

              return match ? (
                <ReferenceDot
                  key={`trade-${entry.id}-${idx}`}
                  x={match.name}
                  y={entry.price}
                  r={5}
                  fill={entry.side === "BUY" ? "#10b981" : "#ef4444"}
                  stroke="#030712"
                  strokeWidth={2}
                  isFront={true}
                  label={(props: any) => {
                    const { cx, cy } = props;
                    if (cx === undefined || cy === undefined) return null;
                    return (
                      <g transform={`translate(${cx}, ${cy})`}>
                        <rect
                          x={-20}
                          y={-22}
                          width={40}
                          height={14}
                          fill={entry.side === "BUY" ? "#064e3b" : "#7f1d1d"}
                          rx={3}
                          opacity={0.8}
                        />
                        <text
                          x={0}
                          y={-12}
                          fill={entry.side === "BUY" ? "#34d399" : "#f87171"}
                          fontSize={9}
                          fontWeight="bold"
                          textAnchor="middle"
                          opacity={1}
                        >
                          {entry.side}
                        </text>
                      </g>
                    );
                  }}
                />
              ) : null;
            })}

          {!isSecondaryChart &&
            filteredAlerts.map((alert) => (
              <ReferenceLine
                key={alert.id}
                y={alert.price}
                stroke={alert.triggered ? "#ef4444" : "#eab308"}
                strokeDasharray="4 4"
                strokeOpacity={alert.triggered ? 0.3 : 0.8}
                strokeWidth={alert.triggered ? 1.5 : 2}
                label={{
                  value: `${alert.triggered ? "🔔 TRG" : "🔔 ALRT"}: $${alert.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  fill: alert.triggered ? "#ef4444" : "#eab308",
                  position: "insideTopRight",
                  fontSize: 10,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  offset: 5,
                }}
              />
            ))}

          {!isSecondaryChart &&
            baseAlertPrice &&
            alertThreshold &&
            alertThreshold > 0 && (
              <>
                <ReferenceLine
                  y={baseAlertPrice * (1 + alertThreshold / 100)}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                  strokeWidth={1}
                  label={{
                    value: `+${alertThreshold}% Threshold`,
                    fill: "#10b981",
                    position: "insideBottomRight",
                    fontSize: 10,
                    offset: 5,
                  }}
                />
                <ReferenceLine
                  y={baseAlertPrice * (1 - alertThreshold / 100)}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                  strokeWidth={1}
                  label={{
                    value: `-${alertThreshold}% Threshold`,
                    fill: "#ef4444",
                    position: "insideBottomRight",
                    fontSize: 10,
                    offset: 5,
                  }}
                />
              </>
            )}

          {/* Render Trendlines */}
          {trendlines.map((line) => (
            <ReferenceLine
              key={line.id}
              segment={[{ x: line.start.x, y: line.start.y }, { x: line.end.x, y: line.end.y }]}
              isFront={true}
              shape={(props: any) => {
                const x1 = props.endpoints?.[0]?.x;
                const y1 = props.endpoints?.[0]?.y;
                const x2 = props.endpoints?.[1]?.x;
                const y2 = props.endpoints?.[1]?.y;
                
                if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
                  return null;
                }

                // Calculate center point for transform origin
                const cx = (x1 + x2) / 2;
                const cy = (y1 + y2) / 2;

                return (
                  <motion.line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    style={{ originX: `${cx}px`, originY: `${cy}px` }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut", type: "spring", bounce: 0.4 }}
                  />
                );
              }}
            />
          ))}

          {isDrawingTrendline && currentTrendline && (
            <ReferenceLine
              segment={[{ x: currentTrendline.start.x, y: currentTrendline.start.y }, { x: currentTrendline.end.x, y: currentTrendline.end.y }]}
              stroke="#60a5fa"
              strokeWidth={2}
              strokeDasharray="4 4"
              isFront={true}
            />
          )}

        </ComposedChart>
      </ResponsiveContainer>
      
      {!isSecondaryChart && (
        <div ref={crosshairRef} className="absolute inset-0 pointer-events-none z-30 hidden overflow-hidden">
          {/* Horizontal Line */}
          <div ref={yLineRef} className="absolute left-[40px] right-[40px] border-t border-dashed border-gray-400" />
          
          {/* Vertical Line */}
          <div ref={xLineRef} className="absolute top-[10px] bottom-[30px] border-l border-dashed border-gray-400" />
          
          {/* Y-axis label */}
          <div ref={yLabelRef} className="absolute left-0 bg-gray-800 text-white text-[10px] px-1 py-0.5 rounded border border-gray-700 whitespace-nowrap transform -translate-y-1/2 min-w-[36px] text-center" />
          
          {/* X-axis label */}
          <div ref={xLabelRef} className="absolute bottom-2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded border border-gray-700 whitespace-nowrap transform -translate-x-1/2" />
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={chartRef}
      className={`${isFullscreen ? "fixed inset-0 z-[100] bg-gray-950 p-8" : "h-64 sm:h-80 md:h-96 w-full bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)]"} flex flex-col transition-all duration-300 relative overflow-hidden`}
    >
      {/* Background Animated Gradient Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute w-[150%] h-[150%] blur-[100px] rounded-full opacity-[0.08]"
          animate={{
            background: signal === 'BUY'
              ? 'radial-gradient(circle, #10b981 0%, transparent 60%)'
              : signal === 'SELL'
              ? 'radial-gradient(circle, #ef4444 0%, transparent 60%)'
              : 'radial-gradient(circle, #3b82f6 0%, transparent 60%)',
            x: ['-25%', '10%', '-25%'],
            y: ['-25%', '10%', '-25%'],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute w-[120%] h-[120%] blur-[80px] rounded-full opacity-[0.05]"
          animate={{
            background: signal === 'BUY'
              ? 'radial-gradient(circle, #059669 0%, transparent 60%)'
              : signal === 'SELL'
              ? 'radial-gradient(circle, #b91c1c 0%, transparent 60%)'
              : 'radial-gradient(circle, #1d4ed8 0%, transparent 60%)',
            x: ['10%', '-30%', '10%'],
            y: ['10%', '-20%', '10%'],
            scale: [1.1, 0.9, 1.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white uppercase tracking-widest text-xs flex items-center gap-2">
            Kursudvikling
            <span className="text-[10px] text-gray-500 hidden sm:inline-block font-normal normal-case">
              (Scroll for zoom, Shift+Scroll for pan)
            </span>
          </h3>
          {signal && (
            <div className="relative group flex items-center">
              <motion.span
                key={`${ticker}-${timeframe}`}
                initial={{ scale: 1.1, filter: "brightness(1.5)" }}
                animate={{ 
                  scale: [1.1, 1, 1.02, 1],
                  filter: ["brightness(1.5)", "brightness(1)", "brightness(1.2)", "brightness(1)"]
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border relative overflow-hidden cursor-help ${
                  signal === "BUY"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                    : signal === "SELL"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/50"
                }`}
              >
                <motion.span
                  className="absolute inset-0 bg-current opacity-20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {signal}
              </motion.span>
              
              {marketCorrelation !== undefined && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="bg-gray-800 border border-gray-700 text-gray-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    Market Correlation: { marketCorrelation > 0 ? '+' : ''}{marketCorrelation.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isZoomed && (
            <button
              onClick={resetZoom}
              className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors bg-gray-800 px-2 py-1 rounded text-xs"
              title="Reset Zoom"
            >
              <SearchX className="size-3" />
              Reset
            </button>
          )}

          {onTimeframeChange && (
            <div className="flex bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              {["5m", "1h", "4h", "1D", "1W", "1M"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1 text-xs font-mono transition-colors ${timeframe === tf ? "bg-cyan-900/50 text-cyan-400" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
          {filteredAlerts.length > 0 && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
              {filteredAlerts.length}{" "}
              {filteredAlerts.length === 1 ? "alarm" : "alarmer"} aktiv
            </span>
          )}

          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`transition-colors ${isSplitView ? "text-cyan-400" : "text-gray-400 hover:text-white"}`}
            title="Split View Mode"
          >
            <Columns className="size-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Chart Overlays"
            >
              <SlidersHorizontal className="size-4" />
            </button>
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-800">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Tekniske Indikatorer
                    </span>
                  </div>
                  <div className="p-2 border-b border-gray-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Sekundær Ticker (f.eks. BTC)"
                      className="bg-gray-950 border border-gray-700 text-white text-xs p-2 rounded-lg w-full focus:border-cyan-500/50 outline-none"
                      value={secondaryTicker}
                      onChange={(e) => setSecondaryTicker(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          fetchSecondaryData(e.currentTarget.value);
                      }}
                    />
                    {isLoadingSecondary && (
                      <span className="text-[9px] text-cyan-400 flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" /> Henter...
                      </span>
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg cursor-pointer transition-colors group">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showSMA ? "bg-fuchsia-500 border-fuchsia-500" : "bg-gray-900 border-gray-700 group-hover:border-gray-600"}`}
                      >
                        {showSMA && (
                          <span className="w-2 h-2 bg-white rounded-sm"></span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showSMA}
                        onChange={() => setShowSMA(!showSMA)}
                      />
                      <span
                        className={`text-xs font-mono transition-colors ${showSMA ? "text-fuchsia-400" : "text-gray-400"}`}
                      >
                        SMA (Simple Moving Avg)
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg cursor-pointer transition-colors group">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showEMA ? "bg-amber-500 border-amber-500" : "bg-gray-900 border-gray-700 group-hover:border-gray-600"}`}
                      >
                        {showEMA && (
                          <span className="w-2 h-2 bg-white rounded-sm"></span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showEMA}
                        onChange={() => setShowEMA(!showEMA)}
                      />
                      <span
                        className={`text-xs font-mono transition-colors ${showEMA ? "text-amber-400" : "text-gray-400"}`}
                      >
                        EMA (Exp. Moving Avg)
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg cursor-pointer transition-colors group">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showBB ? "bg-indigo-500 border-indigo-500" : "bg-gray-900 border-gray-700 group-hover:border-gray-600"}`}
                      >
                        {showBB && (
                          <span className="w-2 h-2 bg-white rounded-sm"></span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showBB}
                        onChange={() => setShowBB(!showBB)}
                      />
                      <span
                        className={`text-xs font-mono transition-colors ${showBB ? "text-indigo-400" : "text-gray-400"}`}
                      >
                        Bollinger Bands
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg cursor-pointer transition-colors group">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showVolatility ? "bg-orange-500 border-orange-500" : "bg-gray-900 border-gray-700 group-hover:border-gray-600"}`}
                      >
                        {showVolatility && (
                          <span className="w-2 h-2 bg-white rounded-sm"></span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showVolatility}
                        onChange={() => setShowVolatility(!showVolatility)}
                      />
                      <span
                        className={`text-xs font-mono transition-colors ${showVolatility ? "text-orange-400" : "text-gray-400"}`}
                      >
                        30-Day Volatility
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1 border-r border-gray-700 pr-3 mr-1">
             <button
                onClick={() => setIsDrawingTrendline(!isDrawingTrendline)}
                className={`transition-colors ${isDrawingTrendline ? "text-blue-400" : "text-gray-400 hover:text-white"}`}
                title="Tegn Trendlinje"
             >
                <PenLine className="size-4" />
             </button>
             {trendlines.length > 0 && (
                <button
                   onClick={() => setTrendlines([])}
                   className="text-gray-400 hover:text-red-400 transition-colors"
                   title="Ryd Trendlinjer"
                >
                   <Eraser className="size-4" />
                </button>
             )}
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? "Afslut Fuldskærm" : "Fuldskærm"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>

          <button
            onClick={handleCopyCSV}
            disabled={isCopying}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Kopier Data (CSV)"
          >
            {isCopying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50 ml-2 shadow-sm"
            title="Download Chart (PNG)"
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin shrink-0" />
            ) : (
              <Camera className="size-4 shrink-0" />
            )}
            <span className="hidden sm:inline">Capture Chart</span>
          </button>
        </div>
      </div>

      {/* Real-time Pearson Correlation Coefficients */}
      <div className="flex flex-wrap items-center gap-2 mb-3 bg-gray-950/20 px-3 py-1.5 rounded-xl border border-gray-800/40 relative z-10 font-mono text-[11px] shrink-0">
        <span className="text-gray-400 font-bold tracking-wider mr-1 text-[10px] uppercase flex items-center gap-1">
          <Link2 className="size-3 text-cyan-400" />
          Markeds-korrelation:
        </span>
        {isLoadingCorrelations ? (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Loader2 className="size-3 animate-spin text-cyan-450 text-cyan-400" />
            <span className="text-[10px]">Beregner live Pearson r...</span>
          </div>
        ) : correlations ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {Object.entries(correlations).map(([asset, val]) => {
              const r = val as number;
              let badgeColor = "bg-gray-800/30 border-gray-800 text-gray-400";
              let rText = r >= 0 ? `+${r.toFixed(2)}` : r.toFixed(2);
              let correlationType = "Neutral";
              
              if (r > 0.4) {
                badgeColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                correlationType = "Høj Positiv";
              } else if (r > 0.1) {
                badgeColor = "text-emerald-300";
                correlationType = "Svag Positiv";
              } else if (r < -0.4) {
                badgeColor = "bg-rose-500/10 border-rose-500/20 text-rose-400";
                correlationType = "Høj Negativ";
              } else if (r < -0.1) {
                badgeColor = "text-rose-300";
                correlationType = "Svag Negativ";
              }
              
              return (
                <div 
                  key={asset} 
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border border-gray-850 bg-gray-900/30 text-[10px] hover:border-gray-700 transition-colors pointer-events-auto`}
                  title={`${ticker || 'Ticker'} vs ${asset} Pearson korrelationskoefficient: ${rText} (${correlationType})`}
                >
                  <span className="text-gray-500 font-bold">{asset}:</span>
                  <span className={`font-bold ${r > 0 ? 'text-emerald-400' : r < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                    {rText}
                  </span>
                  <span className="text-[9px] opacity-60 font-sans hidden sm:inline">
                    ({correlationType})
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-550 text-[10px]">Utilgængelig</span>
        )}
      </div>

      <div className="flex-1 min-h-0 w-full relative z-10" ref={scrollWrapperRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={
              data && data.length > 0
                ? `${data[0].name}-${data[data.length - 1].name}`
                : "empty-chart"
            }
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {isSplitView ? (
              <div className="flex w-full h-full gap-2">
                <div className="w-1/2 h-full">
                  {renderChartContent(chartData, timeframe || "", false)}
                </div>
                <div className="w-1/2 h-full">
                  {renderChartContent(
                    splitFullChartData,
                    secondaryTimeframe,
                    true,
                  )}
                </div>
              </div>
            ) : (
              renderChartContent(chartData, timeframe || "", false)
            )}
          </motion.div>
        </AnimatePresence>

        {addingMarker && (
          <div
            className="absolute z-10 bg-gray-950 border border-amber-500/50 rounded-xl shadow-2xl p-3 w-52 flex flex-col gap-2 pointer-events-auto"
            style={{
              left: Math.min(
                addingMarker.x,
                scrollWrapperRef.current?.clientWidth
                  ? scrollWrapperRef.current.clientWidth - 220
                  : addingMarker.x,
              ),
              top: Math.max(0, addingMarker.y - 120),
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold uppercase tracking-widest border-b border-gray-800 pb-2">
              <StickyNote className="size-3" /> Note ved $
              {addingMarker.value.toFixed(2)}
            </div>
            <textarea
              autoFocus
              className="bg-gray-900 text-xs text-white rounded-lg p-2 border border-gray-800 w-full resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="Skriv en note..."
              rows={3}
              value={markerInput}
              onChange={(e) => setMarkerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveMarker();
                }
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[9px] text-gray-500 font-mono">
                Retur for at gemme
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setAddingMarker(null)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <button
                  onClick={saveMarker}
                  className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-md transition-colors"
                >
                  <Check className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

