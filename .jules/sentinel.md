## 2024-10-27 - Added security middlewares
**Vulnerability:** Missing rate limiting, CORS configuration, and secure HTTP headers in Express.
**Learning:** By default, Express applications are susceptible to DoS attacks via brute force due to a lack of rate limiting. Furthermore, default settings without CORS configuration can open endpoints to unauthorized cross-origin access. Missing basic HTTP security headers also exposes the application to various injection and misconfiguration vulnerabilities.
**Prevention:** Use established middleware such as `express-rate-limit`, `cors` with strict origins, and `helmet` for basic header protection in all Express endpoints.
## 2024-10-24 - API Key and Secret Leakage in Bot State API
**Vulnerability:** The API endpoint `/api/bot/state` (and other endpoints returning `botState`) was exposing `userApiKey` and `userApiSecret` in the response to authenticated users. These values should be server-side secrets and not exposed to the client to mitigate the risk of them being accessed via an XSS attack or seen by an unauthorized user if the device is unlocked.
**Learning:** Returning a global object directly in an API response without picking/omitting fields causes unintentional data exposure if that object gets extended with secret fields over time.
**Prevention:** Implement a DTO (Data Transfer Object) or a sanitizer function that explicitly strips secret fields before returning the object to the client.
