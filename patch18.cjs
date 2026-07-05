const fs = require('fs');
let tht = fs.readFileSync('src/components/TradeHistoryTable.tsx', 'utf8');

tht = tht.replace(
  `className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden p-4"`,
  `className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden p-4 transition-all duration-300 hover:scale-[1.01] hover:z-10 relative"`
);

fs.writeFileSync('src/components/TradeHistoryTable.tsx', tht);
