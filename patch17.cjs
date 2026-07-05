const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `<motion.div ref={setNodeRef} style={style} className="relative transition-all duration-300 hover:scale-[1.01] hover:z-10" layout>`,
  `<motion.div ref={setNodeRef} style={style} className="relative transition-all duration-300" layout>`
);

fs.writeFileSync('src/App.tsx', code);

let tht = fs.readFileSync('src/components/TradeHistoryTable.tsx', 'utf8');
tht = tht.replace(
  `className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg"`,
  `className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] hover:z-10 relative"`
);
fs.writeFileSync('src/components/TradeHistoryTable.tsx', tht);

