const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioSummary.tsx', 'utf8');

if (!code.includes("import { DonutChart }")) {
    code = code.replace("import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';", "import { DonutChart } from './DonutChart';\nimport { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';");
}

const beforeDonut = `
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListIcon className="size-4 text-emerald-500" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Performing Assets</h3>
            </div>
         </div>
`;

const withDonut = `
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListIcon className="size-4 text-emerald-500" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Performing Assets</h3>
            </div>
         </div>
         <div className="flex flex-col md:flex-row gap-6 items-center">
            {topAssets.length > 0 && (
              <div className="w-full md:w-1/3 flex justify-center">
                <DonutChart data={topAssets.map(a => ({ label: a.asset, value: a.value }))} />
              </div>
            )}
            <div className="w-full md:w-2/3">
`;

code = code.replace(beforeDonut, withDonut);

// Add closing div for the table wrapper
const beforeEnd = `             </div>
         )}
      </div>
    </div>`;

const withEnd = `             </div>
         )}
            </div>
         </div>
      </div>
    </div>`;

code = code.replace(beforeEnd, withEnd);

fs.writeFileSync('src/components/PortfolioSummary.tsx', code);
