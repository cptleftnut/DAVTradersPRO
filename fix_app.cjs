const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
    /const \[expandedWidgetId, setExpandedWidgetId\] = useState<string \| null>\(null\);/,
    "const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);\n  const [tradeLogs, setTradeLogs] = useState<{time: string, msg: string, type: 'info'|'warn'|'error'}[]>([]);"
);
fs.writeFileSync('src/App.tsx', code);
