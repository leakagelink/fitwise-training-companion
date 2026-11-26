# AI helpers
- AI calls try every configured AI STAR key in order (AI_STAR_API_KEY, then _2…_9; star.server.ts + tryStarKeys in fallback.ts), skipping a key for a cooldown once it reports exhausted tokens, and fall back to the built-in gateway model when no key answers before any text is shown — a new key takes over automatically when an old one runs out, without AI going down.
- Photo requests use only AI STAR models verified to read images — text-only models answer "can't see the image" in valid JSON, which would be saved as a real estimate.
- Every user-facing generation reads the authenticated account language; schemas keep enums/IDs/numbers unchanged. Canonical diet and missed-meal recipe data stay English for dietary checks and are translated only for display.
