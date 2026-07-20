## 2024-10-27 - Added security middlewares
**Vulnerability:** Missing rate limiting, CORS configuration, and secure HTTP headers in Express.
**Learning:** By default, Express applications are susceptible to DoS attacks via brute force due to a lack of rate limiting. Furthermore, default settings without CORS configuration can open endpoints to unauthorized cross-origin access. Missing basic HTTP security headers also exposes the application to various injection and misconfiguration vulnerabilities.
**Prevention:** Use established middleware such as `express-rate-limit`, `cors` with strict origins, and `helmet` for basic header protection in all Express endpoints.
## 2024-10-28 - Preventing API Key Leakage in server.ts
**Vulnerability:** The application's `/api/bot/*` endpoints leaked the user's `botState.userApiKey` and `botState.userApiSecret` inside plain `res.json(botState)` responses.
**Learning:** Sending entire state objects indiscriminately in APIs can easily expose sensitive credentials to the frontend/clients.
**Prevention:** Always use a specific sanitizer function (e.g. `getSafeBotState`) to filter out secrets before serialization in Express routes.
