## 2024-07-09 - Accessible Close Buttons
**Learning:** Raw clickable icons (e.g., `<X onClick={...} />`) are not keyboard-focusable or screen-reader friendly by default.
**Action:** Always wrap interactive icons in a `<button>` element with an appropriate `aria-label` and `focus-visible` styling for accessible navigation and screen reader support.

## 2026-07-23 - Form Label Accessibility in Modals
**Learning:** In custom modal implementations (like `AiProModal.tsx`), input labels without `htmlFor` mappings break standard click-to-focus behavior and leave screen reader users without proper context for the inputs.
**Action:** Always map `label` elements to their respective `input` elements using matching `htmlFor` and `id` attributes, especially in high-friction areas like API key configuration forms.
