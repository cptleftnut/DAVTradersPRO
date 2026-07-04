import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/components/UserManual.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('getAdvancedSections')) {
  content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport { getAdvancedSections } from './AdvancedManualRenderer';");
}

// 2. Modify tabs state
content = content.replace("useState<'all' | 'intro' | 'trading' | 'ai' | 'alerts' | 'journal' | 'sync'>('all')", "useState<'all' | 'intro' | 'trading' | 'ai' | 'alerts' | 'journal' | 'sync' | 'test'>('all')");

// 3. Replace sections array
const sectionsRegex = /const sections = \[\s*\{\s*id: 'intro',[\s\S]*?\n\s*\];/m;
if (sectionsRegex.test(content)) {
  content = content.replace(sectionsRegex, "const sections = getAdvancedSections();");
  console.log('Replaced sections array!');
} else {
  console.log('Could not find sections array.');
}

// 4. Update the tabs UI array
const tabsRegex = /\{ id: 'sync', label: '6\. Kalender & Synk' \},/g;
if (tabsRegex.test(content)) {
  content = content.replace(tabsRegex, "{ id: 'sync', label: '6. Kalender & Synk' },\n              { id: 'test', label: '7. Gennemtest Status' },");
  console.log('Added test tab to UI!');
}

// 5. Update renderOnScreenIllustration switch with 'test'
const testImageCase = `      case 'test':
        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3 text-left relative overflow-hidden select-none shadow-xl min-h-[300px]">
            <img 
               src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" 
               alt="Test Matrix" 
               className="absolute inset-0 w-full h-full object-cover opacity-30 select-none pointer-events-none mix-blend-luminosity" 
               draggable="false"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            <div className="absolute inset-0 bg-emerald-500/5"></div>
            <div className="relative z-10 p-5 flex flex-col h-full justify-end">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-slate-400">TEST MATRIX</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-full"></div></div>
                  <div className="flex justify-between text-[9px] text-emerald-400 font-mono"><span>SUCCESS RATE</span><span>100%</span></div>
                </div>
              </div>
            </div>
          </div>
        );`;
const syncCaseEndRegex = /case 'sync':[\s\S]*?case 'test'/;
if (!syncCaseEndRegex.test(content)) {
  const replacementTarget = "      default:\n        return null;\n    }\n  };\n\n  const renderOnScreenIllustration";
  content = content.replace("      default:\n        return null;\n    }\n  };", testImageCase + "\n      default:\n        return null;\n    }\n  };");
  console.log('Added test illustration override.');
}

// 6. Change the mapping of sections to render `section.renderContent()` instead of `section.content.split`
const renderMapRegex = /\{\s*section\.content\.split\('###'\)\.map\(\(part, pIdx\) => \{[\s\S]*?\}\)\n\s*\}/m;
if (renderMapRegex.test(content)) {
  content = content.replace(renderMapRegex, "{ (section as any).renderContent ? (section as any).renderContent() : <div>{(section as any).content}</div> }");
  console.log('Updated mapping to use renderContent!');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Modification complete!');
