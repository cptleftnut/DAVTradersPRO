import fs from 'fs';

let content = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');
// Replace any occurrence of "})}" followed by white spaces and some ")}"
content = content.replace(/\}\)\}\s*\}\)/g, '})}');
content = content.replace(/\s*\}\)\}\s*\)\}/g, '                  })}');
content = content.replace(/\s*\}\)\}\s*\}\)/g, '                  })}');
content = content.replace(/\s*\}\)\}\s*\}\s*\)/g, '                  })}');
content = content.replace(/\}\)\}\s*\)\s*\}/g, '})}');
// Let's print out lines around the error
const lines = content.split(/\r?\n/);
console.log("Lines 2258 to 2264:");
for (let i = 2257; i <= 2264; i++) {
  console.log(`${i}: ${JSON.stringify(lines[i])}`);
}

// Let's do a direct replacement by index/splitting if we want to be absolutely sure
if (lines[2261] && lines[2261].trim() === ')}' && lines[2260] && lines[2260].includes('})}')) {
  console.log("Found line 2261 to be direct ')}', removing it!");
  lines.splice(2261, 1);
} else if (lines[2260] && lines[2260].includes('})}') && lines[2260].includes(')}')) {
  console.log("Found combined double brace line!");
  lines[2260] = lines[2260].replace('})}                </motion.div>', '})}');
}

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', lines.join('\n'), 'utf8');
console.log("Written file successfully");
