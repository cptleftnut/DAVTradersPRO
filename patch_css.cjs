const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css += `
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
  will-change: transform;
}
`;

fs.writeFileSync('src/index.css', css);
