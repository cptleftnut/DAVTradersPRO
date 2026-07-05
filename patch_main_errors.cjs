const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

code = code.replace(
`  if (typeof msg === 'string' && (msg.includes('Script error') || msg.includes('ResizeObserver'))) {`,
`  if (typeof msg === 'string' && (msg.includes('Script error') || msg.includes('ResizeObserver') || msg.includes('Failed to fetch'))) {`
);

code = code.replace(
`    if (msg.includes('Unexpected token') || msg.includes('RESOURCE_EXHAUSTED')) {`,
`    if (msg.includes('Unexpected token') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Failed to fetch')) {`
);

fs.writeFileSync('src/main.tsx', code);
