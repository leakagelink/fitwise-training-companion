export async function recordGeneration(userId: string, operation: string, status: "success" | "failed" | "cancelled", startedAt: number, model: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.from("generation_events").insert({ user_id: userId, operation, status, latency_ms: Math.max(0, Date.now() - startedAt), model });
  if (result.error) console.error("Generation usage could not be recorded");
}
export async function trackedGeneration<T>(userId: string, operation: string, model: string, generate: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await generate();
    await recordGeneration(userId, operation, "success", startedAt, model);
    return result;
  } catch (error) {
    await recordGeneration(userId, operation, "failed", startedAt, model);
    throw error;
  }
}