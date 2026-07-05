import React, { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { SalesPage } from "./components/SalesPage";
import { BinanceTradingPanel } from "./components/BinanceTradingPanel";
import { OrderBook } from "./components/OrderBook";
import { PortfolioDistribution } from "./components/PortfolioDistribution";
import { PerformanceTrend } from "./components/PerformanceTrend";
import { MarketOverview } from "./components/MarketOverview";
import { MarketSummary } from "./components/MarketSummary";
import { DailyPerformanceMetric } from "./components/DailyPerformanceMetric";
import { CumulativeProfitChart } from "./components/CumulativeProfitChart";
import { TradeHistoryTable } from "./components/TradeHistoryTable";
import { GeminiChat } from "./components/GeminiChat";
import { initAuth } from "./lib/auth";
import { User } from "firebase/auth";
import { Toaster, toast } from "sonner";
import { Loader2, Palette, GripVertical, RotateCcw } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from "motion/react";

function SortableItem({ id, children, ...props }: { id: string, children: React.ReactNode, [key: string]: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div ref={setNodeRef} style={style} className="relative transition-all duration-300" layout>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 cursor-grab p-1 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
      >
        <GripVertical className="size-4 text-gray-400" />
      </div>
      {children}
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const DEFAULT_ITEMS = ['BinanceTradingPanel', 'PerformanceTrend', 'PortfolioDistribution', 'OrderBook', 'TradeHistoryTable'];
  const [items, setItems] = useState(DEFAULT_ITEMS);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    if (String(msg).includes('Failed to fetch')) return;
    if (type === 'error') toast.error(msg);
    else if (type === 'warn') toast.warning(msg);
    else toast.info(msg);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
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

  const componentsMap: Record<string, React.ReactNode> = {
    DailyPerformanceMetric: <DailyPerformanceMetric />,
    CumulativeProfitChart: <CumulativeProfitChart />,
    MarketOverview: <MarketOverview />,
    BinanceTradingPanel: <BinanceTradingPanel addLog={addLog} />,
    PerformanceTrend: <PerformanceTrend />,
    PortfolioDistribution: <PortfolioDistribution />,
    OrderBook: <OrderBook />,
    TradeHistoryTable: <TradeHistoryTable />
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100">
      <button 
        onClick={() => setItems(DEFAULT_ITEMS)}
        className="fixed top-4 right-28 z-[100] p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white"
        title="Reset Layout"
      >
        <RotateCcw className="size-5" />
      </button>
      <button 
        onClick={() => document.documentElement.classList.toggle('light-mode')}
        className="fixed top-4 right-4 z-[100] p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white"
        title="Toggle Theme"
      >
        <Palette className="size-5" />
      </button>
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
      <MarketSummary />
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {items.map(id => (
              <SortableItem key={id} id={id}>
                {componentsMap[id]}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <GeminiChat />
    </div>
  );
}
