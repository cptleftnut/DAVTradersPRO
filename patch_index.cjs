const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/msg\.includes\('ResizeObserver'\)/g, "msg.includes('ResizeObserver') || msg.includes('Failed to fetch')");
code = code.replace(/args\[0\]\.includes\('ResizeObserver'\)/g, "args[0].includes('ResizeObserver') || args[0].includes('Failed to fetch')");

fs.writeFileSync('index.html', code);
