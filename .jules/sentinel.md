## 2024-05-24 - Leaking Secrets via State Serialization
**Vulnerability:** The Express API implicitly returned the full `botState` object directly to the client in various endpoints. `botState` contained user API credentials (`userApiKey`, `userApiSecret`), which were exposed.
**Learning:** Sending raw server-side state objects to the frontend directly without sanitization creates massive risk.
**Prevention:** Implement explicit serializer functions (`sanitizeBotState`) for all domain objects returned via APIs to filter out sensitive keys.
