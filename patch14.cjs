const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `<motion.div ref={setNodeRef} style={style} className="relative" layout>`,
  `<motion.div ref={setNodeRef} style={style} className="relative transition-all duration-300 hover:scale-[1.01] hover:z-10" layout>`
);

fs.writeFileSync('src/App.tsx', code);
