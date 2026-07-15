## 2024-07-09 - Accessible Close Buttons
**Learning:** Raw clickable icons (e.g., `<X onClick={...} />`) are not keyboard-focusable or screen-reader friendly by default.
**Action:** Always wrap interactive icons in a `<button>` element with an appropriate `aria-label` and `focus-visible` styling for accessible navigation and screen reader support.
## 2024-07-15 - [Gemini Chat Accessibility]
**Learning:** Found an accessibility issue pattern specific to `GeminiChat.tsx` where toggle, close, and send icon buttons lacked `aria-label` attributes and keyboard focus indicators (`focus-visible`).
**Action:** Always verify icon-only buttons in floating/fixed UI elements have accessible labels and visible focus rings.
