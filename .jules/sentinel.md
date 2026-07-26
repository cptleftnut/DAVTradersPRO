## 2025-02-26 - Prevent Bot State Credentials Leak
**Vulnerability:** The application was globally returning the raw `botState` object in numerous API endpoints (`/api/bot/state`, `/api/bot/start`, etc.), which inadvertently exposed sensitive `userApiKey` and `userApiSecret` credentials directly to the client.
**Learning:** Global state objects serialized directly in Express endpoints can easily leak critical information if they lack explicit sanitization patterns before serialization.
**Prevention:** Always use a dedicated sanitization function (e.g., `sanitizeBotState(state: BotState)`) when serializing internal state objects for external API consumers to actively strip out sensitive credentials.
