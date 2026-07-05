const fs = require('fs');
let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

const loadPresetCode = `
  const handleLoadPreset = (preset: TradingPreset) => {
    if (preset.allocation !== undefined) setAllocation(preset.allocation);
    if (preset.takeProfit !== undefined) setTakeProfit(preset.takeProfit);
    if (preset.stopLoss !== undefined) setStopLoss(preset.stopLoss);
    if (preset.stopLossType !== undefined) setStopLossType(preset.stopLossType);
    if (preset.strategy !== undefined) setStrategy(preset.strategy);
    if (preset.useTrailingStop !== undefined) setUseTrailingStop(preset.useTrailingStop);
    if (preset.dynamicSizing !== undefined) setDynamicSizing(preset.dynamicSizing);
    if (preset.maxRiskPerTrade !== undefined) setMaxRiskPerTrade(preset.maxRiskPerTrade);
    if (preset.diversifySectors !== undefined) setDiversifySectors(preset.diversifySectors);
    if (preset.autoAdjustVolatility !== undefined) setAutoAdjustVolatility(preset.autoAdjustVolatility);
    if (preset.useNewsSentiment !== undefined) setUseNewsSentiment(preset.useNewsSentiment);
    if (preset.circuitBreakerLimit !== undefined) setCircuitBreakerLimit(preset.circuitBreakerLimit);
    if (preset.enableDCA !== undefined) setEnableDCA(preset.enableDCA);
    if (preset.dcaIntervalHours !== undefined) setDcaIntervalHours(preset.dcaIntervalHours);
    if (preset.dcaAllocation !== undefined) setDcaAllocation(preset.dcaAllocation);
  };
`;

if (!content.includes('handleLoadPreset')) {
  content = content.replace(
    "const handleDeploy = async () => {",
    loadPresetCode + "\n  const handleDeploy = async () => {"
  );
}

const presetManagerUI = `
             <div className="flex items-center justify-between mb-3">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Vælg din risikoprofil</label>
               <TradingPresetsManager 
                 currentConfig={{
                   allocation,
                   takeProfit,
                   stopLoss,
                   stopLossType,
                   strategy,
                   useTrailingStop,
                   dynamicSizing,
                   maxRiskPerTrade,
                   diversifySectors,
                   autoAdjustVolatility,
                   useNewsSentiment,
                   circuitBreakerLimit,
                   enableDCA,
                   dcaIntervalHours,
                   dcaAllocation
                 }}
                 onLoadPreset={handleLoadPreset}
               />
             </div>
`;

content = content.replace(
  '<label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vælg din risikoprofil</label>',
  presetManagerUI
);

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', content);
