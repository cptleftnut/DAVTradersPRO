const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/import \{ initializeApp, getApps \} from 'firebase-admin\/app';\nimport \{ getFirestore as getAdminFirestore \} from 'firebase-admin\/firestore';/g, '');
code = code.replace(/import \{ initializeApp, getApps \} from 'firebase-admin\/app';/g, '');
code = code.replace(/import \{ getFirestore \} from 'firebase-admin\/firestore';/g, '');

code = code.replace(/import \{ initializeApp \} from 'firebase\/app';/, "import { initializeApp, getApps } from 'firebase/app';");

code = code.replace(/\/\/ Initialize firebase admin SDK for the server[\s\S]*?if \(\(firebaseConfig as any\)\.firestoreDatabaseId !== '\(default\)'\) \{\n  db\.settings\(\{ databaseId: \(firebaseConfig as any\)\.firestoreDatabaseId \}\);\n\}/, '');

code = code.replace(/\/\/ Initialize firebase admin SDK for the server[\s\S]*?if \(\(firebaseConfig as any\)\.firestoreDatabaseId && \(firebaseConfig as any\)\.firestoreDatabaseId !== '\(default\)'\) \{\n  db\.settings\(\{ databaseId: \(firebaseConfig as any\)\.firestoreDatabaseId \}\);\n\}/, '');


const newInit = `
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}
const db = getFirestore(firebaseApp, (firebaseConfig as any).firestoreDatabaseId !== '(default)' ? (firebaseConfig as any).firestoreDatabaseId : undefined);
`;

code = code.replace(/async function getBinanceCredentials/, newInit + '\nasync function getBinanceCredentials');

// Now replace db.collection('...').doc('...') with doc(db, '...', '...') and .get() with getDoc(), .set() with setDoc()
code = code.replace(/const docRef = db\.collection\('systemState'\)\.doc\('botConfig'\);/g, "const docRef = doc(db, 'systemState', 'botConfig');");
code = code.replace(/const docSnap = await docRef\.get\(\);/g, "const docSnap = await getDoc(docRef);");
code = code.replace(/await docRef\.set\(botState\);/g, "await setDoc(docRef, botState);");

code = code.replace(/db\.collection\('systemState'\)\.doc\('botConfig'\)\.set\(botState\)/g, "setDoc(doc(db, 'systemState', 'botConfig'), botState)");
code = code.replace(/db\.collection\('wallet'\)\.doc\('simulated'\)\.set\(simulatedWallet\)/g, "setDoc(doc(db, 'wallet', 'simulated'), simulatedWallet)");

code = code.replace(/const docRef = db\.collection\('wallet'\)\.doc\('simulated'\);/g, "const docRef = doc(db, 'wallet', 'simulated');");

code = code.replace(/const prefDoc = await db\.collection\("userSettings"\)\.doc\(uid\)\.get\(\);/g, "const prefDoc = await getDoc(doc(db, 'userSettings', uid));");

fs.writeFileSync('server.ts', code);
