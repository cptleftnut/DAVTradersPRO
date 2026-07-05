const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/main.tsx',
`  if (args[0] && typeof args[0] === 'string' && (args[0].includes('Script error.') || args[0].includes('Script error'))) {
    return;
  }`,
`  if (args.some(arg => String(arg).includes('Failed to fetch') || String(arg).includes('Script error'))) {
    return;
  }`
);

