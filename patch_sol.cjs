const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{src,server.ts}/**/*.{ts,tsx,js,jsx}');
if (fs.existsSync('server.ts')) files.push('server.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/SOLUSDT/g, 'SOLUSDC').replace(/SOL\/USDT/g, 'SOL/USDC');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Patched ${file}`);
  }
});
