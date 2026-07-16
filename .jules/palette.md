## 2024-07-16 - Dynamic ARIA labels in Quick Actions

**Learning:** When dealing with toggle menus that lack text, providing an `aria-expanded` isn't always enough for screen reader clarity if the label remains static. Dynamic `aria-label`s (e.g. "Open quick actions" vs "Close quick actions") on toggle elements vastly improve clarity.
**Action:** Always verify if stateful toggle elements should update their `aria-label` along with `aria-expanded` to give screen reader users maximum context on what action will occur next.
