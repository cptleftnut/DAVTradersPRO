const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountStr) {
  console.log("No FIREBASE_SERVICE_ACCOUNT_KEY env var found.");
  process.exit(0);
}

const serviceAccount = JSON.parse(serviceAccountStr);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const docRef = db.collection('wallet').doc('simulated');
  const snap = await docRef.get();
  console.log("Current wallet:", JSON.stringify(snap.data(), null, 2));
  process.exit(0);
}

run();
