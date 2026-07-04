import { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function RsiChart({ data }: { data?: { name: string, rsi: number }[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  
  const [zoomRange, setZoomRange] = useState<{start: number, end: number} | null>(null);
  const zoomRangeRef = useRef<{start: number, end: number} | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; startZoom: { start: number; end: number } } | null>(null);

  useEffect(() => {
    zoomRangeRef.current = zoomRange;
  }, [zoomRange]);

  useEffect(() => {
    if (data && data.length > 0) {
      setZoomRange({ start: 0, end: data.length - 1 });
    }
  }, [data]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
        if (!data || data.length === 0) return;
        
        setZoomRange(prev => {
            if (!prev) return null;
            
            // Allow panning if shift key is pressed
            if (e.shiftKey) {
                e.preventDefault();
                const panAdjustment = Math.max(1, Math.floor(data.length * 0.02));
                let newStart = prev.start + (e.deltaY > 0 ? panAdjustment : -panAdjustment);
                let newEnd = prev.end + (e.deltaY > 0 ? panAdjustment : -panAdjustment);
                
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
            const adjustment = Math.max(1, Math.floor((prev.end - prev.start) * 0.1));
            
            let newStart = prev.start - delta * adjustment;
            let newEnd = prev.end + delta * adjustment;

            if (newStart < 0) newStart = 0;
            if (newEnd >= data.length) newEnd = data.length - 1;

            if (newEnd - newStart < Math.min(5, data.length)) {
                return prev;
            };

            return { start: newStart, end: newEnd };
        });
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && zoomRangeRef.current) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          startZoom: { ...zoomRangeRef.current }
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && touchStartRef.current && data && data.length > 0) {
        const deltaX = touchStartRef.current.x - e.touches[0].clientX;
        const deltaY = Math.abs(touchStartRef.current.y - e.touches[0].clientY);
        
        // If swiping horizontally primarily, prevent default scrolling
        if (Math.abs(deltaX) > deltaY) {
          e.preventDefault();
        }

        const el = scrollWrapperRef.current;
        const chartWidth = el?.clientWidth || 300;
        const pointsInView = touchStartRef.current.startZoom.end - touchStartRef.current.startZoom.start + 1;
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
        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
        if (el) {
          el.removeEventListener('wheel', handleWheel);
          el.removeEventListener('touchstart', handleTouchStart);
          el.removeEventListener('touchmove', handleTouchMove);
          el.removeEventListener('touchend', handleTouchEnd);
        }
    };
  }, [data]);

  const resetZoom = () => {
      if (data && data.length > 0) {
        setZoomRange({ start: 0, end: data.length - 1 });
      }
  };

  const chartData = useMemo(() => {
     if (!data || data.length === 0) return [];
     if (!zoomRange) return data;
     return data.slice(zoomRange.start, zoomRange.end + 1);
  }, [data, zoomRange]);

  if (!data || data.length === 0) {
     return null;
  }

  const isZoomed = zoomRange && data && (zoomRange.start > 0 || zoomRange.end < data.length - 1);

  return (
    <div ref={chartRef} className="h-64 sm:h-80 md:h-96 w-full bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.5)] mt-4 flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-lg font-semibold text-white uppercase tracking-widest text-xs flex items-center gap-2">
            RSI Indikator
            <span className="text-[10px] text-gray-500 hidden sm:inline-block font-normal normal-case">(Scroll for zoom, Shift+Scroll for pan)</span>
        </h3>
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
      </div>
      <div className="flex-1 min-h-0 w-full relative" ref={scrollWrapperRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={data[0]?.name + '-' + data[data.length-1]?.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickMargin={10} minTickGap={30} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} tickMargin={10} ticks={[0, 30, 50, 70, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', color: '#f3f4f6', borderRadius: '12px', fontSize: '14px' }} 
                  itemStyle={{ color: '#22d3ee' }}
                />
                {/* Overbought Region (>70) */}
                {/* @ts-ignore */}
                <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.15} />
                {/* Oversold Region (<30) */}
                {/* @ts-ignore */}
                <ReferenceArea y1={0} y2={30} fill="#10b981" fillOpacity={0.15} />
                
                <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#030712', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} isAnimationActive={!isZoomed} animationDuration={600} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
