const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("setLogLevel('silent');")) {
  code = code.replace("import firebaseConfig from './firebase-applet-config.json';", "import firebaseConfig from './firebase-applet-config.json';\n\nsetLogLevel('silent');\n");
  fs.writeFileSync('server.ts', code);
}
