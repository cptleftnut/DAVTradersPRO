const fs = require('fs');

let content = fs.readFileSync('src/main.tsx', 'utf8');

if (!content.includes('ThemeProvider')) {
  content = content.replace(
    "import App from './App.tsx';",
    "import App from './App.tsx';\nimport { ThemeProvider } from './lib/ThemeContext';"
  );
  
  content = content.replace(
    '<App />',
    '<ThemeProvider>\n        <App />\n      </ThemeProvider>'
  );
  
  fs.writeFileSync('src/main.tsx', content);
}
