const fs = require('fs');
let content = fs.readFileSync('src/components/MarketSummary.tsx', 'utf8');

content = content.replace(
  `import React, { useState, useEffect } from 'react';`,
  `import React, { useState, useEffect } from 'react';\nimport { Activity } from 'lucide-react';`
);

content = content.replace(
  `    const [tickers, setTickers] = useState<Ticker[]>([]);`,
  `    const [tickers, setTickers] = useState<Ticker[]>([]);\n    const [apiHealth, setApiHealth] = useState<{status: 'loading' | 'ok' | 'invalid' | 'missing'}>({status: 'loading'});`
);

content = content.replace(
  `        const fetchTickers = async () => {`,
  `        const fetchApiHealth = async () => {\n            try {\n                const userApiKey = localStorage.getItem('user_binance_api_key');\n                const userApiSecret = localStorage.getItem('user_binance_api_secret');\n                const headers: any = {};\n                if (userApiKey) headers['x-binance-api-key'] = userApiKey;\n                if (userApiSecret) headers['x-binance-api-secret'] = userApiSecret;\n                const res = await fetch('/api/binance/health', { headers });\n                const data = await res.json();\n                setApiHealth({ status: data.status });\n            } catch (e) {\n                setApiHealth({ status: 'invalid' });\n            }\n        };\n        fetchApiHealth();\n        const fetchTickers = async () => {`
);

const healthIndicator = `
            <div className="ml-auto flex items-center gap-2 pr-4">
               <div className={\`flex items-center gap-1.5 px-2.5 py-1 rounded-md border \${apiHealth.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}\`}>
                  <Activity className="size-3" />
                  <span className="font-bold uppercase tracking-widest text-[9px]">
                    {apiHealth.status === 'ok' ? 'Binance API: Connected' : 'Binance API: Disconnected'}
                  </span>
               </div>
            </div>
`;

content = content.replace(
  `            ))}
        </div>`,
  `            ))}
${healthIndicator}        </div>`
);

fs.writeFileSync('src/components/MarketSummary.tsx', content);
