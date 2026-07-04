const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newErrorHandler = `const originalConsoleError = console.error;
console.error = (...args) => {
  try {
    const errorString = args.map(a => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.message + ' ' + (a.stack || '');
      try { return JSON.stringify(a); } catch(e) { return String(a); }
    }).join(' ');
    
    if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('resource-exhausted') || errorString.includes('429') || errorString.includes('too_many_requests') || errorString.includes('depleted') || errorString.includes('Function.generate') || errorString.includes('makeStatusError')) {
      return; // Suppress quota errors
    }
  } catch(e) {}
  originalConsoleError(...args);
};

process.on('unhandledRejection', (reason, promise) => {
  const msg = String(reason);
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('resource-exhausted') || msg.includes('429') || msg.includes('too_many_requests') || msg.includes('depleted') || msg.includes('Function.generate') || msg.includes('makeStatusError')) {
    return; // Ignore
  }
  originalConsoleError('Unhandled Rejection at:', promise, 'reason:', reason);
});`;

code = code.replace(/const originalConsoleError = console\.error;[\s\S]*?originalConsoleError\('Unhandled Rejection at:', promise, 'reason:', reason\);\n\}\);/, newErrorHandler);

fs.writeFileSync('server.ts', code);
