import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Capability } from "./operations-model";
export async function requireCapability(client: SupabaseClient<Database>, userId: string, capability: Capability | "admin") {
  const result = capability === "admin"
    ? await client.rpc("has_role", { _user_id: userId, _role: "admin" })
    : await client.rpc("has_staff_permission", { _user: userId, _capability: capability });
  if (result.error || result.data !== true) throw new Error("You do not have permission for this action");
}
export async function auditRead(db: SupabaseClient<Database>, actor: string, target: string | null, resource: string, reason: string) {
  const result = await db.from("private_data_access").insert({ actor_id: actor, target_user_id: target, resource, reason });
  if (result.error) throw new Error("Could not record private data access");
}
export async function exportUserData(db: SupabaseClient<Database>, userId: string) {
  const output: Record<string, unknown> = {};
  for (const table of ["profiles", "daily_checkins", "weight_logs", "body_measurements", "meal_logs", "grocery_items", "nutrition_plans", "workout_plans", "workout_days", "workout_day_exercises", "workout_sessions", "workout_sets", "user_favorites", "coach_bookings", "coach_threads", "coach_messages", "membership_access", "purchase_history", "support_tickets", "user_notifications", "notification_preferences", "privacy_requests"] as const) {
    const result = table === "profiles" ? await db.from("profiles").select("*").eq("id", userId).limit(10001) : await db.from(table).select("*").eq("user_id", userId).limit(10001);
    if (result.error || (result.data?.length ?? 0) > 10000) throw new Error("Export is too large or unavailable. Please contact support.");
    output[table] = result.data ?? [];
  }
  const tickets = await db.from("support_tickets").select("id").eq("user_id", userId);
  if (tickets.error) throw new Error("Could not export support history");
  const ticketIds = tickets.data.map(row => row.id);
  if (ticketIds.length) {
    const replies = await db.from("support_replies").select("id,ticket_id,from_staff,body,created_at").in("ticket_id", ticketIds).limit(10001);
    if (replies.error || (replies.data?.length ?? 0) > 10000) throw new Error("Could not export support replies");
    output["support_replies"] = replies.data;
  }
  return JSON.stringify({ exportedAt: new Date().toISOString(), data: output }, null, 2);
}