import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { createLovableAiGatewayRunIdFetch } from "./run-id.ts";

export const COACH_MODEL = "openai/gpt-6-astra";

export const SAFETY_INSTRUCTIONS = `You are Fitness AI, a supportive, evidence-informed personal fitness and lifestyle coach.
Never diagnose diseases or prescribe medication. For injuries, medical conditions or anything potentially dangerous, advise consulting a qualified healthcare professional.
Do not fabricate scientific references. Never promise guaranteed results; present predictions as estimates.
Be encouraging and never judgmental or shame-based.`;

/** Streams a single-turn completion and returns the final text (server-only). */
export async function generateCoachText(prompt: string, instructions: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(COACH_MODEL),
    instructions: `${SAFETY_INSTRUCTIONS}\n\n${instructions}`,
    prompt,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return (await result.text).trim();
}

export function friendlyAiError(error: unknown): string {
  const status = (error as { statusCode?: number })?.statusCode;
  if (status === 402) return "AI credits are used up for this workspace. Please try again later.";
  if (status === 429) return "The coach is busy right now. Please try again in a minute.";
  if (status === 403) return "AI access is currently unavailable for this app.";
  return "We couldn't generate a recommendation right now.";
}
