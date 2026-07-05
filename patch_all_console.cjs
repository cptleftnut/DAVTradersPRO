const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/components/RiskManagementModule.tsx',
`.catch(err => console.error('Fejl ved indlæsning af bot-risiko:', err));`,
`.catch(err => { if (!String(err).includes('Failed to fetch')) console.error('Fejl ved indlæsning af bot-risiko:', err); });`
);

patchFile('src/components/TickerCompare.tsx',
`toast.error("Prediction failed");`,
`if (!String(e).includes('Failed to fetch')) toast.error("Prediction failed");`
);

patchFile('src/components/BinanceTradingPanel.tsx',
`.catch(err => console.error('Fejl ved load af state:', err));`,
`.catch(err => { if(!String(err).includes('Failed to fetch')) console.error('Fejl ved load af state:', err); });`
);

