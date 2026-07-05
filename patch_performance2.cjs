const fs = require('fs');
let content = fs.readFileSync('src/components/PerformanceTrend.tsx', 'utf8');

content = content.replace(
  "className={\\`text-sm font-mono font-bold flex items-center gap-1 \\${isPortfolioUp ? 'text-emerald-400' : 'text-rose-400'}\\`}",
  "className={`text-sm font-mono font-bold flex items-center gap-1 ${isPortfolioUp ? 'text-emerald-400' : 'text-rose-400'}`}"
);

content = content.replace(
  "className={\\`text-sm font-mono font-bold flex items-center gap-1 \\${isAssetUp ? 'text-indigo-400' : 'text-rose-400'}\\`}",
  "className={`text-sm font-mono font-bold flex items-center gap-1 ${isAssetUp ? 'text-indigo-400' : 'text-rose-400'}`}"
);

fs.writeFileSync('src/components/PerformanceTrend.tsx', content);
