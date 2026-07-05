const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const colorMap = {
  '#030712': 'var(--color-gray-950)',
  '#111827': 'var(--color-gray-900)',
  '#1f2937': 'var(--color-gray-800)',
  '#374151': 'var(--color-gray-700)',
  '#4b5563': 'var(--color-gray-600)',
  '#6b7280': 'var(--color-gray-500)',
  '#9ca3af': 'var(--color-gray-400)',
  '#d1d5db': 'var(--color-gray-300)',
  '#e5e7eb': 'var(--color-gray-200)',
  '#f3f4f6': 'var(--color-gray-100)',
  '#f9fafb': 'var(--color-gray-50)',
  '#ffffff': 'var(--color-white)',
  '#000000': 'var(--color-black)'
};

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [hex, cssVar] of Object.entries(colorMap)) {
    // We only want to replace it inside styles, fills, strokes, etc. 
    // But since these exact hexes are rarely used elsewhere, a global replace is safe.
    // Let's do a case-insensitive regex replace.
    const regex = new RegExp(hex, 'gi');
    if (regex.test(content)) {
      content = content.replace(regex, cssVar);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', file);
  }
}
