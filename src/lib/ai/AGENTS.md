# AI helpers
- AI calls try the owner's OpenAI-compatible AI STAR key first (star.server.ts) and fall back to the built-in gateway model when the key is missing or fails before any text is shown — the owner's provider is preferred without AI going down when its tokens run out.
