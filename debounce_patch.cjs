const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find saveBotState
const saveBotStateOriginal = `async function saveBotState() {
  try {
    // Fire and forget to prevent hanging the API if Firebase connection drops
    setDoc(doc(db, 'systemState', 'botConfig'), botState).catch(err => {
      console.error("[Firebase] Error saving bot state async:", err);
    });
  } catch (err) {
    console.error("[Firebase] Error saving bot state:", err);
  }
}`;

const saveBotStateDebounced = `let botStateSaveTimeout: NodeJS.Timeout | null = null;
async function saveBotState() {
  if (botStateSaveTimeout) return;
  botStateSaveTimeout = setTimeout(() => {
    botStateSaveTimeout = null;
    try {
      setDoc(doc(db, 'systemState', 'botConfig'), botState).catch(err => {
        console.error("[Firebase] Error saving bot state async:", err);
      });
    } catch (err) {
      console.error("[Firebase] Error saving bot state:", err);
    }
  }, 10000); // 10 second debounce
}`;

code = code.replace(saveBotStateOriginal, saveBotStateDebounced);

const saveWalletOriginal = `async function saveWallet() {
  try {
    setDoc(doc(db, 'wallet', 'simulated'), simulatedWallet).catch(err => {
        console.error("[Firebase] Error saving wallet state async:", err);
    });
  } catch (err) {
    console.error("[Firebase] Error saving wallet state:", err);
  }
}`;

const saveWalletDebounced = `let walletSaveTimeout: NodeJS.Timeout | null = null;
async function saveWallet() {
  if (walletSaveTimeout) return;
  walletSaveTimeout = setTimeout(() => {
    walletSaveTimeout = null;
    try {
      setDoc(doc(db, 'wallet', 'simulated'), simulatedWallet).catch(err => {
          console.error("[Firebase] Error saving wallet state async:", err);
      });
    } catch (err) {
      console.error("[Firebase] Error saving wallet state:", err);
    }
  }, 10000); // 10 second debounce
}`;

code = code.replace(saveWalletOriginal, saveWalletDebounced);

fs.writeFileSync('server.ts', code);
