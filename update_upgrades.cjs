const fs = require('fs');
let code = fs.readFileSync('src/components/UpgradesStoreWidget.tsx', 'utf8');

code = code.replace(
  "onOpenProModal\n}: any) => {",
  "onOpenProModal,\n  userEmail\n}: any) => {"
);

code = code.replace(
  "const handleBuy = (item: string) => {",
  "const isFreeUser = userEmail === 'djminirocker@gmail.com';\n\n  const handleBuy = (item: string) => {\n    if (isFreeUser) {\n      toast.success(`${item} aktiveret gratis!`);\n      return;\n    }"
);

// Update button 1
code = code.replace(
  "<div className=\"font-mono text-sm font-bold\">$49<span className=\"text-[10px] text-gray-500 font-normal\">/md</span></div>\n                  <button onClick={() => handleBuy('Quantum Eksekvering')} className=\"px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors\">Opgrader</button>",
  "<div className=\"font-mono text-sm font-bold\">{isFreeUser ? <span className=\"text-emerald-500\">GRATIS</span> : <><strike className=\"text-gray-600\">$49</strike> $49<span className=\"text-[10px] text-gray-500 font-normal\">/md</span></>}</div>\n                  <button onClick={() => handleBuy('Quantum Eksekvering')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${isFreeUser ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>{isFreeUser ? 'Aktivér' : 'Opgrader'}</button>"
);

// Update button 2
code = code.replace(
  "<div className=\"font-mono text-sm font-bold\">$9.99<span className=\"text-[10px] text-gray-500 font-normal\">/md</span></div>\n                  <button onClick={onOpenProModal} className=\"px-4 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-400 transition-colors\">Læs Mere</button>",
  "<div className=\"font-mono text-sm font-bold\">{isFreeUser ? <span className=\"text-emerald-500\">GRATIS</span> : <><strike className=\"text-gray-600\">$9.99</strike> $9.99<span className=\"text-[10px] text-gray-500 font-normal\">/md</span></>}</div>\n                  <button onClick={onOpenProModal} className=\"px-4 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-400 transition-colors\">Læs Mere</button>"
);

// Update button 3
code = code.replace(
  "<div className=\"font-mono text-sm font-bold flex flex-col\">\n                      <span>$19.99<span className=\"text-[10px] text-gray-500 font-normal\">/md</span></span>\n                      <span className=\"text-[9px] text-emerald-500\">+2.5% Profit Share</span>\n                  </div>\n                  <button onClick={() => handleBuy('Whale Copy Trading')} className=\"px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors\">Aktivér</button>",
  "<div className=\"font-mono text-sm font-bold flex flex-col\">\n                      {isFreeUser ? <span className=\"text-emerald-500\">GRATIS</span> : <span>$19.99<span className=\"text-[10px] text-gray-500 font-normal\">/md</span></span>}\n                      <span className=\"text-[9px] text-emerald-500\">+2.5% Profit Share</span>\n                  </div>\n                  <button onClick={() => handleBuy('Whale Copy Trading')} className=\"px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors\">Aktivér</button>"
);

// Update button 4
code = code.replace(
  "<div className=\"font-mono text-sm font-bold\">$29<span className=\"text-[10px] text-gray-500 font-normal\">/år</span></div>\n                  <button onClick={() => handleBuy('Skat & Rapportering')} className=\"px-4 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors border border-gray-700\">Køb Nu</button>",
  "<div className=\"font-mono text-sm font-bold\">{isFreeUser ? <span className=\"text-emerald-500\">GRATIS</span> : <><strike className=\"text-gray-600\">$29</strike> $29<span className=\"text-[10px] text-gray-500 font-normal\">/år</span></>}</div>\n                  <button onClick={() => handleBuy('Skat & Rapportering')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${isFreeUser ? 'bg-emerald-500 text-black border-emerald-500 hover:bg-emerald-400' : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700'}`}>{isFreeUser ? 'Aktivér' : 'Køb Nu'}</button>"
);

fs.writeFileSync('src/components/UpgradesStoreWidget.tsx', code);
