## 2024-10-27 - Added security middlewares
**Vulnerability:** Missing rate limiting, CORS configuration, and secure HTTP headers in Express.
**Learning:** By default, Express applications are susceptible to DoS attacks via brute force due to a lack of rate limiting. Furthermore, default settings without CORS configuration can open endpoints to unauthorized cross-origin access. Missing basic HTTP security headers also exposes the application to various injection and misconfiguration vulnerabilities.
**Prevention:** Use established middleware such as `express-rate-limit`, `cors` with strict origins, and `helmet` for basic header protection in all Express endpoints.

## 2026-07-23 - Secure Serialization of Global State
**Vulnerability:** Global server state (`botState`) containing sensitive fields like API keys was being serialized and returned verbatim in API responses (`res.json(botState)`).
**Learning:** Due to how Express serializes objects, directly returning a global state object will unintentionally leak all added properties, including sensitive credentials added for internal usage.
**Prevention:** Always use a sanitizer function to explicitly omit sensitive credentials (e.g. `userApiKey` and `userApiSecret`) when returning server state from API endpoints.
