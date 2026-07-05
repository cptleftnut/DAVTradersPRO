const fs = require('fs');
let code = fs.readFileSync('src/lib/persistence.ts', 'utf8');

code = code.replace(
`  const update = async (newData: Partial<T>) => {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, newData as any);
  };`,
`  const update = async (newData: Partial<T>) => {
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
  };`
);

fs.writeFileSync('src/lib/persistence.ts', code);
