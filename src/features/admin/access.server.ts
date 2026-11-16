import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { resolveAccess } from "./access";
export async function readAccess(supabase: SupabaseClient<Database>, userId: string, trialStartedAt: string) {
  const [access, controls] = await Promise.all([
    supabase.from("membership_access").select("starts_at,ends_at,revoked_at,diet_days,workout_access,coach_access,plan_name").eq("user_id", userId),
    supabase.from("app_controls").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (access.error || controls.error) throw new Error("Could not verify membership access");
  const result = resolveAccess(trialStartedAt, access.data ?? []);
  return { ...result, dietDays: controls.data?.diet_enabled === false ? 0 : result.dietDays, workouts: result.workouts && controls.data?.workouts_enabled !== false, coach: result.coach && controls.data?.coach_enabled !== false, announcement: controls.data?.announcement ?? "" };
}