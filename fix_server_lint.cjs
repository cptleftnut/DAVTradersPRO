const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/await docRef\.set\(simulatedWallet\);/g, "await setDoc(docRef, simulatedWallet);");

fs.writeFileSync('server.ts', code);
