import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import type { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./run-id.ts";

export const COACH_MODEL = "openai/gpt-6-astra";

export const SAFETY_INSTRUCTIONS = `You are Fitness AI, a supportive, evidence-informed personal fitness and lifestyle coach.
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

/** Streams a single-turn completion and returns the final text (server-only). */
export async function generateCoachText(prompt: string, instructions: string): Promise<string> {
  const result = streamText({
    model: provider().responses(COACH_MODEL),
    instructions: `${SAFETY_INSTRUCTIONS}\n\n${instructions}`,
    prompt,
    providerOptions,
  });
  return (await result.text).trim();
}

/** Streams a structured (strict JSON schema) completion and returns the parsed object. */
export async function generateCoachObject<T>(prompt: string, instructions: string, schema: z.ZodType<T>): Promise<T> {
  const result = streamText({
    model: provider().responses(COACH_MODEL),
    instructions: `${SAFETY_INSTRUCTIONS}\n\n${instructions}`,
    prompt,
    output: Output.object({ schema }),
    providerOptions,
  });
  try {
    return (await result.output) as T;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try { return schema.parse(JSON.parse(error.text)); } catch { throw new Error("The coach returned an incomplete plan. Nothing was saved."); }
    }
    throw error;
  }
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
  if (status === 402) return "Insufficient AI credits. The workspace owner can add credits in Settings → Plans & credits.";
  if (status === 429) return "The coach is busy right now. Please try again in a minute.";
  if (status === 403) return "AI access is currently unavailable for this app.";
  return "The AI coach couldn't complete this request right now.";
}

/** Structured completion with an optional photo (data URL) attached. */
export async function generateVisionObject<T>(prompt: string, instructions: string, schema: z.ZodType<T>, imageDataUrl?: string): Promise<T> {
  const result = streamText({
    model: provider().responses(COACH_MODEL),
    instructions: `${SAFETY_INSTRUCTIONS}\n\n${instructions}`,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...(imageDataUrl ? [{ type: "image" as const, image: imageDataUrl }] : [])] }],
    output: Output.object({ schema }),
    providerOptions,
  });
  return (await result.output) as T;
}
