## 2024-05-18 - Language Consistency in Accessibility
**Learning:** Even though component logic and variable names are often in English (e.g., `TradeHistory`, `page`, `showSettings`), the user-facing UI language of this app is primarily Danish. Adding English `aria-label`s to Danish interfaces disrupts screen reader accessibility.
**Action:** Always inspect surrounding user-facing text (e.g., span or button text content) in a component to determine the correct language for `aria-label` additions.
