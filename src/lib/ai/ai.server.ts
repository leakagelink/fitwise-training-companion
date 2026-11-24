import { createOpenAI } from "@ai-sdk/openai";
import { generateText, NoObjectGeneratedError, Output, streamText, type ModelMessage } from "ai";
import type { z } from "zod";

import { tryStarKeys, withFallback } from "./fallback.ts";
import { createLovableAiGatewayRunIdFetch } from "./run-id.ts";
import { logStarFailure, starKeys, starModels, starProvider, STAR_TIMEOUT_MS } from "./star.server.ts";

export const COACH_MODEL = "openai/gpt-5.6-luna";

export const SAFETY_INSTRUCTIONS = `You are Fitness AI, a supportive, evidence-informed personal fitness and lifestyle coach.
Never describe yourself or the app's features with the word "AI" or "artificial intelligence"; call yourself the user's personalized coach.
Never diagnose diseases or prescribe medication. For injuries, medical conditions or anything potentially dangerous, advise consulting a qualified healthcare professional.
Do not fabricate scientific references. Never promise guaranteed results; present predictions as estimates.
Be encouraging and never judgmental or shame-based.`;

function provider() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

const providerOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

/** Runs a request on each AI STAR key with balance, then on the built-in model if none answers. */
async function preferStar<T>(operation: string, viaStar: (model: ReturnType<ReturnType<typeof starProvider>["chat"]>) => Promise<T>, viaBuiltIn: () => Promise<T>, budgetMs?: number): Promise<T> {
  const keys = starKeys();
  const primary = keys.length
    ? async () => (await tryStarKeys(keys, starModels(operation === "vision" ? "vision" : "text"), (apiKey, model) => viaStar(starProvider(apiKey).chat(model)), { ...(budgetMs === undefined ? {} : { budgetMs }), onError: (error) => logStarFailure(operation, error) })).value
    : null;
  return (await withFallback(primary, viaBuiltIn, () => console.warn("AI STAR unavailable, using built-in AI", { operation }))).value;
}

/** Single-turn completion; returns the final text (server-only). */
export async function generateCoachText(prompt: string, instructions: string): Promise<string> {
  const system = `${SAFETY_INSTRUCTIONS}\n\n${instructions}`;
  return preferStar(
    "text",
    async (model) => {
      const result = await generateText({ model, instructions: system, prompt, maxRetries: 0, timeout: STAR_TIMEOUT_MS });
      const text = result.text.trim();
      if (!text) throw new Error("Empty AI STAR answer");
      return text;
    },
    async () => {
      const result = streamText({ model: provider().responses(COACH_MODEL), instructions: system, prompt, providerOptions });
      return (await result.text).trim();
    },
  );
}

async function builtInObject<T>(system: string, schema: z.ZodType<T>, input: { prompt: string } | { messages: ModelMessage[] }): Promise<T> {
  const result = streamText({ model: provider().responses(COACH_MODEL), instructions: system, ...input, output: Output.object({ schema }), providerOptions });
  try {
    return (await result.output) as T;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try { return schema.parse(JSON.parse(error.text)); } catch { throw new Error("The coach returned an incomplete plan. Nothing was saved."); }
    }
    throw error;
  }
}

async function starObject<T>(model: Parameters<typeof generateText>[0]["model"], system: string, schema: z.ZodType<T>, input: { prompt: string } | { messages: ModelMessage[] }, timeoutMs = STAR_TIMEOUT_MS): Promise<T> {
  const result = await generateText({ model, instructions: system, ...input, output: Output.object({ schema }), maxRetries: 0, timeout: timeoutMs });
  return schema.parse(result.output);
}

/** Structured (strict JSON schema) completion; returns the parsed object. */
export async function generateCoachObject<T>(prompt: string, instructions: string, schema: z.ZodType<T>, timeoutMs = STAR_TIMEOUT_MS): Promise<T> {
  const system = `${SAFETY_INSTRUCTIONS}\n\n${instructions}`;
  return preferStar("object", (model) => starObject(model, system, schema, { prompt }, timeoutMs), () => builtInObject(system, schema, { prompt }), timeoutMs * 2 + 5000);
}

export function friendlyAiError(error: unknown): string {
  const body = (error as { responseBody?: string })?.responseBody;
  if (body) {
    try {
      const parsed = JSON.parse(body);
      const message = parsed.message ?? parsed.error?.message;
      if (typeof message === "string") return message;
    } catch { /* Not a JSON gateway response. */ }
  }
  const status = (error as { statusCode?: number })?.statusCode;
  if (status === 402) return "This feature is temporarily unavailable. Please try again later.";
  if (status === 429) return "The coach is busy right now. Please try again in a minute.";
  if (status === 403) return "This feature is temporarily unavailable. Please try again later.";
  return "The coach couldn't complete this request right now.";
}

/** Structured completion with an optional photo (data URL) attached. */
export async function generateVisionObject<T>(prompt: string, instructions: string, schema: z.ZodType<T>, imageDataUrl?: string): Promise<T> {
  const system = `${SAFETY_INSTRUCTIONS}\n\n${instructions}`;
  const messages: ModelMessage[] = [{ role: "user", content: [{ type: "text", text: prompt }, ...(imageDataUrl ? [{ type: "image" as const, image: imageDataUrl }] : [])] }];
  return preferStar("vision", (model) => starObject(model, system, schema, { messages }), () => builtInObject(system, schema, { messages }));
}
