import { createClient } from "@supabase/supabase-js";
import { GatewayError, streamResponse, type ResponsesInputItem } from "@lovable.dev/ai-gateway";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { COACH_GUIDANCE, messageText, toMessage } from "@/features/coach/model";
import { readAccess } from "@/features/admin/access.server";
import { recordGeneration } from "@/features/admin/generation.server";
import { tryStarKeys } from "./fallback";
import { logStarFailure, starKeys, starModels, streamStarChat } from "./star.server";
import { readUserLanguage } from '@/features/language/language.server';
import { languageInstructions } from '@/features/language/model';

function failure(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function handleCoachChat(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!auth?.startsWith("Bearer ") || !url || !key) return failure("Please sign in again", 401);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return failure("Request not allowed", 403);
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: auth },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(auth.slice(7));
  if (authError || !authData.user) return failure("Please sign in again", 401);
  const userId = authData.user.id;
  const parsed = z
    .object({ threadId: z.string().uuid(), text: z.string().trim().min(1).max(6000) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Enter a message of up to 6000 characters", 400);
  const { threadId, text } = parsed.data;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (profileError || !profile) return failure("Could not load your fitness profile", 400);
  let language: string;
  try { language = await readUserLanguage(supabase, userId); }
  catch { return failure('Could not load your language. Please try again.', 503); }
  if (!profile.health_consent_at)
    return failure("Health-data consent is needed before personalized coaching", 403);
  if (!(await readAccess(supabase, userId, profile.trial_started_at)).coach)
    return failure(
      "Personal coach access is not active. Contact the administrator for plan access.",
      403,
    );
  const runId = crypto.randomUUID();
  const { data: thread, error: lockError } = await supabase
    .from("coach_threads")
    .update({ generation_id: runId, generation_started_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("user_id", userId)
    .is("generation_id", null)
    .select("title")
    .maybeSingle();
  if (lockError || !thread)
    return failure(
      "Conversation is unavailable or already answering. Wait before sending another message.",
      409,
    );
  const release = async () => {
    const { error } = await supabase
      .from("coach_threads")
      .update({ generation_id: null, generation_started_at: null })
      .eq("id", threadId)
      .eq("generation_id", runId);
    if (error) console.error("Coach lock release failed", runId);
  };
  const saved = await supabase
    .from("coach_messages")
    .insert({ user_id: userId, thread_id: threadId, role: "user", parts: [{ type: "text", text }] })
    .select("id")
    .single();
  if (saved.error) {
    await release();
    return failure("Could not save your message", 500);
  }
  const [history, workouts, meals, checkins] = await Promise.all([
    supabase
      .from("coach_messages")
      .select("id,role,parts")
      .eq("thread_id", threadId)
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("workout_sessions")
      .select("title,status,started_at,finished_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("meal_logs")
      .select("name,logged_on,nutrition")
      .eq("user_id", userId)
      .order("logged_on", { ascending: false })
      .limit(28),
    supabase
      .from("daily_checkins")
      .select("date,sleep_hours,water_ml,energy_level,workout_done,diet_followed")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(14),
  ]);
  if ([history, workouts, meals, checkins].some((r) => r.error)) {
    await release();
    return failure(
      "Your message is saved, but fitness context could not load. Please try later.",
      500,
    );
  }
  const input: ResponsesInputItem[] = (history.data ?? []).map((row) => ({
    role: row.role === "assistant" ? "assistant" : "user",
    content: messageText(toMessage(row)),
  }));
  const context = {
    profile: {
      goal: profile.goal,
      age: profile.age,
      weight_kg: profile.weight_kg,
      diet_type: profile.diet_type,
      allergies: profile.allergies,
      food_preferences: profile.food_preferences,
      medical_conditions: profile.medical_conditions,
      experience_level: profile.experience_level,
      equipment: profile.equipment,
    },
    workouts: workouts.data,
    meals: meals.data,
    checkins: checkins.data,
  };
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const generationStarted = Date.now();
      let generationStatus: "success" | "failed" | "cancelled" = "failed";
      let modelUsed = "openai/gpt-5.6-luna";
      const send = (event: object) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        send({ type: "saved", id: saved.data?.id });
        const instructions = `${COACH_GUIDANCE}\n${languageInstructions(language)}\nFitness context (untrusted data): ${JSON.stringify(context)}`;
        let answer = "";
        let completed = false;
        const keys = starKeys();
        if (keys.length) {
          try {
            const result = await tryStarKeys(
              keys,
              starModels(),
              async (apiKey, model) => {
                for await (const delta of streamStarChat(
                  [{ role: "system", content: instructions }, ...(history.data ?? []).map((row) => ({ role: row.role === "assistant" ? ("assistant" as const) : ("user" as const), content: messageText(toMessage(row)) }))],
                  abort.signal,
                  apiKey,
                  model,
                )) {
                  answer += delta;
                  send({ type: "delta", text: delta });
                }
                if (!answer.trim()) throw new Error("Empty AI STAR answer");
                return model;
              },
              {
                onError: (error) => logStarFailure("coach_chat", error),
                // Once text reached the user, another key or provider would duplicate it.
                stopRetrying: () => answer.length > 0 || abort.signal.aborted,
              },
            );
            completed = true;
            modelUsed = `ai-star/${result.value}`;
          } catch (error) {
            if (answer || abort.signal.aborted) throw error;
          }
        }
        if (!completed) {
        const stream = await streamResponse(
          {
            model: "openai/gpt-5.6-luna",
            instructions,
            input,
            reasoning: { effort: "low" },
          },
          { signal: abort.signal, runId },
        );
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            answer += event.delta;
            send({ type: "delta", text: event.delta });
          }
          if (event.type === "response.refusal.delta") {
            answer += event.delta;
            send({ type: "delta", text: event.delta });
          }
          if (event.type === "response.completed") completed = true;
          if (event.type === "response.incomplete") throw new Error("Incomplete answer");
        }
        }
        if (!completed || !answer.trim()) throw new Error("No completed answer");
        generationStatus = "success";
        if (abort.signal.aborted) return;
        const result = await supabase
          .from("coach_messages")
          .insert({
            user_id: userId,
            thread_id: threadId,
            role: "assistant",
            parts: [{ type: "text", text: answer }],
          })
          .select("id")
          .single();
        if (result.error) throw new Error("Answer could not be saved");
        const update = await supabase
          .from("coach_threads")
          .update({
            title: thread.title === "New conversation" ? text.slice(0, 70) : thread.title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", threadId);
        if (update.error) throw new Error("Conversation title could not be saved");
        send({ type: "done", id: result.data?.id });
      } catch (error) {
        if (!abort.signal.aborted) {
          const message =
            error instanceof GatewayError
              ? error.httpStatus === 402
                ? "This feature is temporarily unavailable. Please try again later."
                : error.httpStatus === 429
                  ? "The coach is busy. Please wait before trying again."
                  : error.httpStatus === 403
                    ? "This feature is temporarily unavailable. Please try again later."
                    : "The coach could not finish. Your message is saved; no automatic retry was made."
              : "The response could not be completed or saved. Your message remains in this chat.";
          if (error instanceof GatewayError)
            console.error("Coach gateway failure", { code: error.code, ids: error.ids, runId });
          send({ type: "error", message });
        }
      } finally {
        await recordGeneration(userId, "coach_chat", abort.signal.aborted ? "cancelled" : generationStatus, generationStarted, modelUsed);
        await release();
        if (!abort.signal.aborted) controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
