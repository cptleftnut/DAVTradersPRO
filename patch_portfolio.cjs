const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioSummary.tsx', 'utf8');

if (!code.includes('LineChart')) {
  code = code.replace("import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';", "import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, YAxis } from 'recharts';");
}

const tableHeader = `
                         <tr>
                             <th scope="col" className="px-4 py-3 font-semibold rounded-tl-lg">Asset</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-center">Trend (24h)</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-right">Balance</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-right">Value (USD)</th>
                             <th scope="col" className="px-4 py-3 font-semibold text-right rounded-tr-lg">Allocation</th>
                         </tr>
`;

code = code.replace(/<tr>\s*<th scope="col" className="px-4 py-3 font-semibold rounded-tl-lg">Asset<\/th>\s*<th scope="col" className="px-4 py-3 font-semibold text-right">Balance<\/th>\s*<th scope="col" className="px-4 py-3 font-semibold text-right">Value \(USD\)<\/th>\s*<th scope="col" className="px-4 py-3 font-semibold text-right rounded-tr-lg">Allocation<\/th>\s*<\/tr>/, tableHeader);

const helperFunc = `
const generateSparklineData = (seedStr: string) => {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const data = [];
    let currentPrice = 100 + (Math.abs(hash) % 20);
    const isPositive = hash % 2 === 0;
    
    for (let i = 0; i < 15; i++) {
        const change = (Math.sin(hash + i) * 3) + (isPositive ? i * 0.5 : -i * 0.5);
        currentPrice += change;
        data.push({ val: currentPrice });
    }
    return { data, isPositive: data[data.length - 1].val >= data[0].val };
}
`;

if (!code.includes('generateSparklineData')) {
    code = code.replace("export const PortfolioSummary", helperFunc + "\nexport const PortfolioSummary");
}

const tableRowTarget = `
                                 <tr key={asset.asset} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                     <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-gray-700">
                                            {asset.asset.substring(0, 3)}
                                        </div>
                                        {asset.asset}
                                     </td>`;

const tableRowReplacement = `
                                 <tr key={asset.asset} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                     <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-gray-700">
                                            {asset.asset.substring(0, 3)}
                                        </div>
                                        {asset.asset}
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                         <div className="w-16 h-8 mx-auto">
                                            {(() => {
                                                const spark = generateSparklineData(asset.asset);
                                                return (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={spark.data}>
                                                            <YAxis domain={['dataMin', 'dataMax']} hide />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="val" 
                                                                stroke={spark.isPositive ? "#10b981" : "#f43f5e"} 
                                                                strokeWidth={2} 
                                                                dot={false} 
                                                                isAnimationActive={false}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                );
                                            })()}
                                         </div>
                                     </td>`;

code = code.replace(tableRowTarget, tableRowReplacement);

fs.writeFileSync('src/components/PortfolioSummary.tsx', code);
