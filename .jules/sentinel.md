## 2024-10-27 - Added security middlewares
**Vulnerability:** Missing rate limiting, CORS configuration, and secure HTTP headers in Express.
**Learning:** By default, Express applications are susceptible to DoS attacks via brute force due to a lack of rate limiting. Furthermore, default settings without CORS configuration can open endpoints to unauthorized cross-origin access. Missing basic HTTP security headers also exposes the application to various injection and misconfiguration vulnerabilities.
**Prevention:** Use established middleware such as `express-rate-limit`, `cors` with strict origins, and `helmet` for basic header protection in all Express endpoints.
## 2025-07-25 - API Key Leakage via Global State Responses
**Vulnerability:** The global `botState` object contained sensitive Binance API keys (`userApiKey` and `userApiSecret`). API endpoints frequently returned `res.json(botState)` or `res.json({ botState })` directly, leaking these secrets to any client requesting bot status.
**Learning:** Returning raw global state objects over the network is inherently risky because newly added internal/sensitive fields to the state model are implicitly exposed by default unless explicitly filtered.
**Prevention:** Always serialize and sanitize state objects intended for API responses through an explicit allow-list or explicit block-list function (like `getSanitizedBotState()`) to ensure internal credentials never leak to the client.
