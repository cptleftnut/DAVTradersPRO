const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{src,server.ts}/**/*.{ts,tsx,js,jsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/\/USDT\|USDC\/g/g, '/USDT|USDC|BTC|ETH|BNB|EUR/g');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Patched ${file}`);
  }
});
