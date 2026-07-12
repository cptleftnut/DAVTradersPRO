## 2024-07-12 - Raw Lucide Icons as Buttons
**Learning:** This application sometimes applies `onClick` handlers directly to raw `lucide-react` SVG components (e.g., `<X onClick={...} />`), missing crucial accessibility support for screen readers and keyboard navigation.
**Action:** Always wrap interactive icons in semantic `<button>` elements, moving the `onClick` to the button. Ensure the new button has a descriptive `aria-label` and `focus-visible` styling to maintain keyboard accessibility.
