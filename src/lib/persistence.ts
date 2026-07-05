import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export function useFirestorePersistence<T>(collectionName: string, docId: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, collectionName, docId);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const docData = snapshot.data();
        setData({ ...defaultValue, ...docData } as T);
      } else {
        // Initialize if not exists
        setDoc(docRef, defaultValue as any);
        setData(defaultValue);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore persistence error", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, docId]);

  const update = async (newData: Partial<T>) => {
    const docRef = doc(db, collectionName, docId);
    const cleanData: any = {};
    Object.entries(newData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    if (Object.keys(cleanData).length > 0) {
      await updateDoc(docRef, cleanData);
    }
  };

  return { data, update, loading };
}
