## 2024-03-24 - QuickActionsMenu Accessibility

**Learning:** Ensure that Floating Action Buttons (FABs) and their dynamically rendered sub-items receive explicit `focus-visible` styling (e.g., `focus-visible:ring-2 focus-visible:ring-offset-2`) and dynamically updated `aria-expanded` attributes to properly convey their state and remain navigable to keyboard users, especially when placed over complex backgrounds with varying contrast.
**Action:** Always verify `focus-visible` states for interactive elements rendered via AnimatePresence or other dynamic UI patterns, as default browser outlines often fail or provide insufficient contrast in dark-themed backdrops.
