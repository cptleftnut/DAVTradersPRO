import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
setLogLevel('silent');

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, (firebaseConfig as any).firestoreDatabaseId || '(default)');
} catch (e) {
  // If already initialized (e.g., during hot reload)
  dbInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
}

export const db = dbInstance;
