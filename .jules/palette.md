## 2024-07-09 - Accessible Close Buttons
**Learning:** Raw clickable icons (e.g., `<X onClick={...} />`) are not keyboard-focusable or screen-reader friendly by default.
**Action:** Always wrap interactive icons in a `<button>` element with an appropriate `aria-label` and `focus-visible` styling for accessible navigation and screen reader support.

## 2024-07-26 - Accessible Input Placeholders
**Learning:** Inputs relying solely on `placeholder` attributes lack context for some screen readers when filled or navigated to, which can degrade accessibility.
**Action:** Always ensure input fields are accompanied by a `<label>` element matching their `id`. Use a `.sr-only` class on the label if visual design requires the label to be hidden but still screen reader accessible.
