const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('useTheme')) {
  content = content.replace(
    'import { User } from "firebase/auth";',
    'import { User } from "firebase/auth";\nimport { useTheme } from "./lib/ThemeContext";'
  );
  
  content = content.replace(
    'const [showAuth, setShowAuth] = useState(false);',
    'const [showAuth, setShowAuth] = useState(false);\n  const { theme, toggleTheme } = useTheme();'
  );
  
  content = content.replace(
    "document.documentElement.classList.toggle('light-mode')",
    "toggleTheme()"
  );
  
  // Also we want to change Toaster theme to match!
  content = content.replace(
    'theme="dark"',
    'theme={theme === "light" ? "light" : "dark"}'
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
