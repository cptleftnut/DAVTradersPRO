const fs = require('fs');
let code = fs.readFileSync('src/lib/persistence.ts', 'utf8');

code = code.replace(
`      if (snapshot.exists()) {
        setData(snapshot.data() as T);
      } else {`,
`      if (snapshot.exists()) {
        const docData = snapshot.data();
        setData({ ...defaultValue, ...docData } as T);
      } else {`
);

fs.writeFileSync('src/lib/persistence.ts', code);
