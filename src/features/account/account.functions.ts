import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the caller's account and every row they own. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Children (days, day exercises, sets) cascade from plans/sessions.
    const ownedTables = [
      "daily_checkins",
      "weight_logs",
      "body_measurements",
      "ai_recommendations",
      "user_favorites",
      "workout_sessions",
      "workout_plans",
      "meal_logs",
      "grocery_items",
      "nutrition_plans",
      "coach_bookings",
      "coach_threads",
      "coach_profiles",
    ] as const;
    for (const table of ownedTables) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
      if (error) throw new Error(`Could not delete ${table}: ${error.message}`);
    }
    // Coach slots with existing bookings retain only the minimum historical reference.
    const { error: slotError } = await supabaseAdmin
      .from("coach_slots")
      .update({ is_available: false, coach_name: "Former coach" })
      .eq("coach_user_id", userId);
    if (slotError) throw new Error("Could not remove coach availability");
    // profiles and user_roles cascade from auth.users.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
