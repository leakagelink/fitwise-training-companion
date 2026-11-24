import { createOpenAI } from "@ai-sdk/openai";

/** AI STAR (OpenAI-compatible reseller) is the preferred provider when its key is set. */
export const STAR_BASE_URL = "https://ai.starimg.ru/v1";
/**
 * Cheapest models that reliably return structured JSON and accept photos,
 * cheapest first; AI_STAR_MODEL overrides them without a code change.
 */
export const STAR_DEFAULT_MODELS = ["nemotron-3.5-super-vl", "mimo-v2.6-flash"];
/** Photo requests only go to models verified to read images; others would invent an answer. */
export const STAR_VISION_MODELS = ["nemotron-3.5-super-vl"];
/** Per attempt; leaves time for the built-in fallback inside one request. */
export const STAR_TIMEOUT_MS = 25_000;
/** A full streamed answer needs longer than the non-stream request timeout. */
export const STAR_STREAM_TIMEOUT_MS = 90_000;

/** AI_STAR_API_KEY, then AI_STAR_API_KEY_2 … _9: the next key takes over when one runs out of tokens. */
export function starKeys(): string[] {
  const names = ["AI_STAR_API_KEY", ...Array.from({ length: 8 }, (_, i) => `AI_STAR_API_KEY_${i + 2}`)];
  const keys = names.map((name) => process.env[name]?.trim()).filter((key): key is string => !!key);
  return [...new Set(keys)];
}

export function starModels(kind: "text" | "vision" = "text"): string[] {
  const override = process.env["AI_STAR_MODEL"]?.trim();
  if (override) return [override];
  return kind === "vision" ? STAR_VISION_MODELS : STAR_DEFAULT_MODELS;
}

export function starProvider(apiKey: string) {
  return createOpenAI({ baseURL: STAR_BASE_URL, apiKey, name: "ai-star" });
}

export function logStarFailure(operation: string, error: unknown) {
  const status = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
  console.warn("AI STAR attempt failed", { operation, status: status ?? null });
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Streams text deltas from AI STAR chat completions. Throws before the first
 * delta when the key is exhausted or the service is down, so callers can fall back.
 */
export async function* streamStarChat(messages: ChatMessage[], signal: AbortSignal, apiKey: string, model: string): AsyncGenerator<string> {
  const timeout = AbortSignal.timeout(STAR_STREAM_TIMEOUT_MS);
  const response = await fetch(`${STAR_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: AbortSignal.any([signal, timeout]),
  });
  if (!response.ok || !response.body) {
    throw Object.assign(new Error("AI STAR request failed"), { status: response.status });
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let finished = false;
  while (!finished) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") { finished = true; break; }
      const event = JSON.parse(data) as { error?: { message?: string }; choices?: { delta?: { content?: string | null } }[] };
      if (event.error) throw new Error(event.error.message ?? "AI STAR stream error");
      const delta = event.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
  if (!finished) throw new Error("AI STAR answer stream ended before completion");
}
