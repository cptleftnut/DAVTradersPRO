const fs = require('fs');
let code = fs.readFileSync('src/components/TradeConfirmationModal.tsx', 'utf8');

code = code.replace(
  "interface TradeDetails {",
  "interface TradeDetails {\n  estimatedPrice: number;"
);

const expectedImpactBlock = `
            <div className="bg-gray-900/60 rounded-xl p-4 mb-6 border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">Forventet Effekt (Værdi)</div>
              <div className="text-2xl font-mono text-white mb-2">
                {tradeDetails.side === 'BUY' ? '-' : '+'}\${(tradeDetails.quantity * tradeDetails.estimatedPrice).toFixed(2)}
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Dette er en estimeret værdi baseret på nuværende markedspris (\\\${tradeDetails.estimatedPrice.toFixed(2)}). Den endelige afviklingspris kan variere grundet slippage og markedsudsving under eksekvering.
              </p>
            </div>
`;

code = code.replace(
  `<h3 className="text-lg font-bold text-white uppercase tracking-widest">Bekræft Ordre</h3>\n              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">\n                <X size={20} />\n              </button>\n            </div>`,
  `<h3 className="text-lg font-bold text-white uppercase tracking-widest">Bekræft Ordre</h3>\n              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">\n                <X size={20} />\n              </button>\n            </div>\n\n${expectedImpactBlock}`
);

code = code.replace(
  `<div className="flex justify-between border-b border-gray-800 pb-2">\n                <span className="text-gray-500">Mængde (Allocation)</span>\n                <span className="font-mono text-white">{tradeDetails.quantity}</span>\n              </div>`,
  `<div className="flex justify-between border-b border-gray-800 pb-2">\n                <span className="text-gray-500">Mængde (Allocation)</span>\n                <span className="font-mono text-white">{tradeDetails.quantity}</span>\n              </div>\n              <div className="flex justify-between border-b border-gray-800 pb-2">\n                <span className="text-gray-500">Estimeret Pris</span>\n                <span className="font-mono text-white">\\\${tradeDetails.estimatedPrice.toFixed(2)}</span>\n              </div>`
);

fs.writeFileSync('src/components/TradeConfirmationModal.tsx', code);
