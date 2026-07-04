const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/botStateSaveTimeout = setTimeout\(\(\) => \{[\s\S]*?\}, 10000\); \/\/ 10 second debounce/g, 
`botStateSaveTimeout = setTimeout(() => {
    botStateSaveTimeout = null;
    try {
      setDoc(doc(db, 'systemState', 'botConfig'), botState).catch(err => {
        console.error("[Firebase] Error saving bot state async:", err);
      });
    } catch (err) {
      console.error("[Firebase] Error saving bot state:", err);
    }
  }, 30000); // 30 second debounce`);

code = code.replace(/walletSaveTimeout = setTimeout\(\(\) => \{[\s\S]*?\}, 10000\); \/\/ 10 second debounce/g,
`walletSaveTimeout = setTimeout(() => {
    walletSaveTimeout = null;
    try {
      setDoc(doc(db, 'wallet', 'simulated'), simulatedWallet).catch(err => {
          console.error("[Firebase] Error saving wallet state async:", err);
      });
    } catch (err) {
      console.error("[Firebase] Error saving wallet state:", err);
    }
  }, 30000); // 30 second debounce`);

fs.writeFileSync('server.ts', code);
