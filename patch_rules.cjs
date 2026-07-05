const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');
content = content.replace(
  "match /orderHistory/{orderId} {",
  "match /tradingPresets/{presetId} {\n      allow read, update, delete: if isOwnerByUserId();\n      allow create: if isRequestingAsSelf();\n    }\n\n    match /orderHistory/{orderId} {"
);
fs.writeFileSync('firestore.rules', content);
