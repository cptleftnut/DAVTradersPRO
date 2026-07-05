const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/App.tsx',
`  const addLog = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    if (type === 'error') toast.error(msg);`,
`  const addLog = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    if (String(msg).includes('Failed to fetch')) return;
    if (type === 'error') toast.error(msg);`
);

