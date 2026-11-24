import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export async function eraseAccount(db: SupabaseClient<Database>, userId: string) {
  const photos = await db.from("progress_photos").select("storage_path").eq("user_id", userId);
  if (photos.error) throw new Error("Could not read progress photos for cleanup");
  if (photos.data.length) {
    const removed = await db.storage.from("progress-photos").remove(photos.data.map(p => p.storage_path));
    if (removed.error) throw new Error("Could not remove progress photo files");
  }
  for (const table of ["staff_notes", "support_replies"] as const) {
    const result = await db.from(table).update({ author_id: null }).eq("author_id", userId);
    if (result.error) throw new Error("Could not anonymize staff history");
  }
  const staffGrants = await db.from("staff_permissions").update({ granted_by: null }).eq("granted_by", userId);
  if (staffGrants.error) throw new Error("Could not anonymize staff permission history");
  // Preserve financial/access history without retaining the removed account identifier.
  for (const table of ["membership_access", "purchase_history"] as const) {
    const result = await db.from(table).update({ user_id: null }).eq("user_id", userId);
    if (result.error) throw new Error("Could not anonymize account history");
  }
  for (const field of ["actor_id", "target_user_id"] as const) {
    const result = await db.from("admin_activity").update(field === "actor_id" ? { actor_id: null } : { target_user_id: null }).eq(field, userId);
    if (result.error) throw new Error("Could not anonymize activity history");
  }
  const grants = await db.from("membership_access").update({ granted_by: null }).eq("granted_by", userId);
  if (grants.error) throw new Error("Could not anonymize access history");
  for (const table of ["daily_checkins", "weight_logs", "body_measurements", "ai_recommendations", "user_favorites", "workout_sessions", "workout_plans", "meal_logs", "grocery_items", "nutrition_plans", "coach_bookings", "coach_threads", "coach_profiles"] as const) {
    const result = await db.from(table).delete().eq("user_id", userId);
    if (result.error) throw new Error(`Could not remove account ${table}`);
  }
  const slots = await db.from("coach_slots").update({ is_available: false, coach_name: "Former coach" }).eq("coach_user_id", userId);
  if (slots.error) throw new Error("Could not remove coach availability");
  const result = await db.auth.admin.deleteUser(userId);
  if (result.error) throw new Error("Could not delete account");
}