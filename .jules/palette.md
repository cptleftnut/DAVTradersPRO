## 2024-07-09 - Accessible Close Buttons
**Learning:** Raw clickable icons (e.g., `<X onClick={...} />`) are not keyboard-focusable or screen-reader friendly by default.
**Action:** Always wrap interactive icons in a `<button>` element with an appropriate `aria-label` and `focus-visible` styling for accessible navigation and screen reader support.
