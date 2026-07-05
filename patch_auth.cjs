const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/components/AuthScreen.tsx',
`toast.error(error.message || 'Der opstod en fejl');`,
`if (!String(error).includes('Failed to fetch')) toast.error(error.message || 'Der opstod en fejl');`
);

patchFile('src/components/AuthScreen.tsx',
`toast.error(error.message || 'Google login fejlede');`,
`if (!String(error).includes('Failed to fetch')) toast.error(error.message || 'Google login fejlede');`
);

