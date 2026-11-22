import { createOpenAI } from "@ai-sdk/openai";

/** AI STAR (OpenAI-compatible reseller) is the preferred provider when its key is set. */
export const STAR_BASE_URL = "https://ai.starimg.ru/v1";
/** Cheapest low-token model by default; AI_STAR_MODEL overrides it without a code change. */
export const STAR_DEFAULT_MODEL = "gemini-2.5-flash-lite";
/** Leave time for the built-in fallback inside one request. */
export const STAR_TIMEOUT_MS = 40_000;

export function starConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env["AI_STAR_API_KEY"];
  if (!apiKey) return null;
  return { apiKey, model: process.env["AI_STAR_MODEL"] || STAR_DEFAULT_MODEL };
}

export function starProvider(apiKey: string) {
  return createOpenAI({ baseURL: STAR_BASE_URL, apiKey, name: "ai-star" });
}

export function logStarFailure(operation: string, error: unknown) {
  const status = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
  console.warn("AI STAR unavailable, using built-in AI", { operation, status: status ?? null });
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Streams text deltas from AI STAR chat completions. Throws before the first
 * delta when the key is exhausted or the service is down, so callers can fall back.
 */
export async function* streamStarChat(messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string> {
  const config = starConfig();
  if (!config) throw new Error("AI STAR not configured");
  const timeout = AbortSignal.timeout(STAR_TIMEOUT_MS);
  const response = await fetch(`${STAR_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.model, messages, stream: true }),
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
}
