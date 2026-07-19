## 2024-10-27 - Added security middlewares
**Vulnerability:** Missing rate limiting, CORS configuration, and secure HTTP headers in Express.
**Learning:** By default, Express applications are susceptible to DoS attacks via brute force due to a lack of rate limiting. Furthermore, default settings without CORS configuration can open endpoints to unauthorized cross-origin access. Missing basic HTTP security headers also exposes the application to various injection and misconfiguration vulnerabilities.
**Prevention:** Use established middleware such as `express-rate-limit`, `cors` with strict origins, and `helmet` for basic header protection in all Express endpoints.
## 2025-02-14 - Prevented API Key Exposure in BotState Payload
**Vulnerability:** The `botState` object containing sensitive `userApiKey` and `userApiSecret` credentials was being directly returned in multiple API responses (e.g., `/api/bot/state`, `/api/bot/start`).
**Learning:** Returning large, unstructured global state objects directly in HTTP responses is a common pattern that risks inadvertent information disclosure, especially when new sensitive fields are added to the state object over time.
**Prevention:** Implement an explicit sanitizer function (`sanitizeBotState`) using object rest destructuring to selectively omit sensitive properties from global objects before serializing them for client consumption.
