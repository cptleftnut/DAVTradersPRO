const fs = require('fs');
let code = fs.readFileSync('src/components/AiProModal.tsx', 'utf8');

code = code.replace(
  "export function AiProModal({ onClose, userUid }: { onClose: () => void, userUid?: string }) {",
  "export function AiProModal({ onClose, userUid, userEmail }: { onClose: () => void, userUid?: string, userEmail?: string }) {"
);

code = code.replace(
  "const handleActivateClick = () => {",
  "const isFreeUser = userEmail === 'djminirocker@gmail.com';\n\n  const handleActivateClick = () => {\n    if (isFreeUser) {\n      toast.success('AI Pro aktiveret gratis!');\n      onClose();\n      return;\n    }"
);

// We need to import toast if it's not imported.
if (!code.includes("import { toast } from 'sonner';")) {
  code = code.replace(
    "import { Sparkles, CheckSquare",
    "import { toast } from 'sonner';\nimport { Sparkles, CheckSquare"
  );
}

code = code.replace(
  "Aktivér med 9.99 USDC/måned",
  "{isFreeUser ? 'Aktivér Gratis (PRO)' : 'Aktivér med 9.99 USDC/måned'}"
);

fs.writeFileSync('src/components/AiProModal.tsx', code);
