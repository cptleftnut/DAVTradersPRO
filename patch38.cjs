const fs = require('fs');
let code = fs.readFileSync('src/components/DesignCenter.tsx', 'utf8');

code = code.replace(
`      {/* Cognitive Ease Checklist */}`,
`      {/* Layout Presets Selector */}
      {setWidgetOrder && (
        <div className={\`p-5 rounded-3xl border text-left transition-all duration-300 \${
          activeTheme === 'alpine' ? 'bg-white border-slate-200' : activeTheme === 'sage' ? 'bg-[#18201a] border-emerald-900/10' : 'bg-gray-950/40 border-white/5'
        }\`}>
          <h4 className={\`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 \${
            activeTheme === 'alpine' ? 'text-slate-500' : 'text-gray-400'
          }\`}>
            <Grid className="size-4 text-indigo-500" /> 3. Layout Presets (Widget Rækkefølge)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              {
                id: 'default',
                name: 'Standard Dashboard',
                description: 'Balanceret visning',
                order: ['agentControl', 'walletSummary', 'realtimeTabs', 'aiPerformance', 'risikostyring', 'maeglerforbindelse'],
                icon: <Layout className="size-4" />
              },
              {
                id: 'analyst',
                name: 'Analyst View',
                description: 'Grafer og performance i fokus',
                order: ['realtimeTabs', 'aiPerformance', 'walletSummary', 'agentControl', 'risikostyring', 'maeglerforbindelse'],
                icon: <Activity className="size-4" />
              },
              {
                id: 'trading',
                name: 'Trading View',
                description: 'Handel og Wallet øverst',
                order: ['agentControl', 'walletSummary', 'maeglerforbindelse', 'realtimeTabs', 'aiPerformance', 'risikostyring'],
                icon: <Compass className="size-4" />
              }
            ].map(preset => {
              const isActive = JSON.stringify(widgetOrder) === JSON.stringify(preset.order);
              return (
                <div 
                  key={preset.id}
                  onClick={() => {
                    setWidgetOrder(preset.order);
                    toast.success(\`Layout opdateret: \${preset.name}\`);
                  }}
                  className={\`p-4 rounded-2xl border transition-all cursor-pointer relative group flex justify-between items-start \${
                    isActive 
                      ? activeTheme === 'alpine' ? 'bg-indigo-50 border-indigo-300' : activeTheme === 'sage' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-indigo-950/30 border-indigo-500/40'
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }\`}
                >
                  <div className="flex gap-3 items-start w-full">
                    <div className={\`p-2.5 rounded-xl shrink-0 \${
                      activeTheme === 'alpine' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-950 text-indigo-400'
                    }\`}>
                      {preset.icon}
                    </div>
                    <div className="pr-2">
                      <h5 className={\`text-xs font-bold uppercase tracking-wider \${activeTheme === 'alpine' ? 'text-slate-900' : 'text-white'}\`}>{preset.name}</h5>
                      <p className="text-[10px] mt-0.5 opacity-85 leading-tight">{preset.description}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className={\`absolute top-3 right-3 p-1 rounded-full shrink-0 \${activeTheme === 'alpine' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/20 text-indigo-400'}\`}>
                      <Check className="size-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cognitive Ease Checklist */}`
);

// Rename "3 tips" to "4 tips"
code = code.replace(
  `<Eye className="size-4 text-indigo-500 animate-pulse" /> 3 tips til en mere overskuelig trading-hverdag`,
  `<Eye className="size-4 text-indigo-500 animate-pulse" /> 4 tips til en mere overskuelig trading-hverdag`
);

fs.writeFileSync('src/components/DesignCenter.tsx', code);
