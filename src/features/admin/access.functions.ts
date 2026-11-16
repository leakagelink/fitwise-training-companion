import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const getMyAccess = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const profile = await context.supabase.from("profiles").select("trial_started_at").eq("id", context.userId).single();
  if (profile.error) throw new Error("Profile not found");
  const { readAccess } = await import("./access.server");
  return readAccess(context.supabase, context.userId, profile.data.trial_started_at);
});