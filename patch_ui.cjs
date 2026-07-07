const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const oldBlock = `            {/* Auto-filled demo API fields */}
             <div className="mt-4 space-y-3 p-3 bg-gray-950/50 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest cursor-pointer">API Nøgler (Krypteret)</p>
                <div className="font-mono text-xs text-gray-600 bg-gray-900 p-2 rounded truncate border border-gray-800">PUB: ************************</div>
                <div className="font-mono text-xs text-gray-600 bg-gray-900 p-2 rounded truncate border border-gray-800">SEC: ************************</div>
             </div>`;

const newBlock = `            <div className="mt-4 space-y-3 p-3 bg-gray-950/50 rounded-xl border border-gray-800">
               <p className="text-[10px] text-gray-500 uppercase tracking-widest">API Nøgler</p>
               <input 
                 type="text" 
                 placeholder="API Key"
                 value={apiKey}
                 onChange={e => setApiKey(e.target.value)}
                 className="w-full bg-gray-900 text-xs text-white p-2 rounded border border-gray-800"
               />
               <input 
                 type="password"
                 placeholder="Secret Key"
                 value={apiSecret}
                 onChange={e => setApiSecret(e.target.value)}
                 className="w-full bg-gray-900 text-xs text-white p-2 rounded border border-gray-800"
               />
               <button 
                 onClick={saveKeys}
                 className="w-full text-xs font-bold bg-amber-500 text-gray-950 py-2 rounded-lg"
               >
                 GEM NØGLER
               </button>
            </div>`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code, 'utf8');
  console.log('Successfully patched UI!');
} else {
  // try without whitespace
  const oldBlockNoWS = oldBlock.replace(/\s+/g, ' ');
  if (code.replace(/\s+/g, ' ').includes(oldBlockNoWS)) {
    console.log('Found with no whitespace matching (cannot easily replace)');
  } else {
    console.log('Target string not found');
  }
}
