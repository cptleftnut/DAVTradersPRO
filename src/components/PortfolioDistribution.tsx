import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PortfolioDistributionProps {
  walletData: { spot: any[], earn: any[] } | null;
  currentPrice: string;
  activeSymbol: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];

export function PortfolioDistribution({ walletData, currentPrice = "1.0", activeSymbol = "BTCUSDT" }: Partial<PortfolioDistributionProps>) {
  const chartData = useMemo(() => {
    if (!walletData || (!walletData.spot && !walletData.earn)) return [];
    
    const activeAsset = activeSymbol.replace(/USDT|USDC|BTC|ETH|BNB|EUR/g, '');
    
    const getAssetUsdPriceLocal = (asset: string) => {
      if (asset === 'USDT' || asset === 'USDC') return 1.0;
      if (asset === activeAsset) return parseFloat(currentPrice) || 1.0;
      const defaults: Record<string, number> = {
        BTC: 68350.20, ETH: 3490.15, SOL: 156.70, BNB: 585.30, XRP: 0.52, ADA: 0.45, DOGE: 0.165, AVAX: 45.30, SPY: 510.50, QQQ: 440.20, VOO: 460.10, ARKK: 50.30, TLT: 90.50, BND: 72.10, AGG: 97.40, LQD: 105.20
      };
      return defaults[asset] || 1.0;
    };

    const assetMap = new Map<string, number>();

    // Process spot balances
    if (walletData.spot) {
        walletData.spot.forEach(b => {
            const amount = parseFloat(b.free) + parseFloat(b.locked || '0');
            const usdValue = amount * getAssetUsdPriceLocal(b.asset);
            if (usdValue > 1) { // Only show assets with value > $1
                assetMap.set(b.asset, (assetMap.get(b.asset) || 0) + usdValue);
            }
        });
    }

    // Process earn balances
    if (walletData.earn) {
        walletData.earn.forEach(e => {
            const amount = parseFloat(e.totalAmount);
            const usdValue = amount * getAssetUsdPriceLocal(e.asset);
            if (usdValue > 1) {
                assetMap.set(e.asset, (assetMap.get(e.asset) || 0) + usdValue);
            }
        });
    }

    const data = Array.from(assetMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [walletData, currentPrice, activeSymbol]);

  if (!walletData || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
        Ingen data
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold">{payload[0].name}</p>
          <p className="text-emerald-400 font-mono">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="85%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                 verticalAlign="bottom" 
                 height={36}
                 formatter={(value, entry, index) => <span className="text-xs text-gray-400 font-mono">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
