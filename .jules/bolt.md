## 2023-10-27 - Caching Intl.NumberFormat
**Learning:** Re-creating `Intl.NumberFormat` instances and calling `.toLocaleString()` inside high-frequency WebSocket handlers or animation frames (e.g., `useTransform`) causes unnecessary CPU overhead.
**Action:** Always instantiate `Intl.NumberFormat` outside the component and reuse it for frequent formatting tasks.
