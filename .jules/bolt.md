## 2024-05-18 - Avoid toLocaleString in 60fps render loops
**Learning:** Calling `Number.prototype.toLocaleString()` inside a high-frequency render loop, such as a Framer Motion `useTransform` callback that runs at 60fps, creates a massive CPU bottleneck because it repeatedly instantiates formatting objects under the hood.
**Action:** Always cache an `Intl.NumberFormat` instance outside the component and reuse its `.format()` method to prevent UI rendering bottlenecks when formatting numbers dynamically in animations or frequent WebSocket updaters.
