const fs = require('fs');
let code = fs.readFileSync('src/components/TickerTape.tsx', 'utf8');

// replace motion.div with normal div and css animation
code = code.replace("import { motion } from 'motion/react';", "");

const oldMotionDivStart = `      <motion.div 
         className="flex space-x-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 30, repeat: Infinity }}
      >`;
const newDivStart = `      <div className="flex space-x-8 whitespace-nowrap animate-marquee">`;

code = code.replace(oldMotionDivStart, newDivStart);
code = code.replace("</motion.div>", "</div>");

fs.writeFileSync('src/components/TickerTape.tsx', code);
