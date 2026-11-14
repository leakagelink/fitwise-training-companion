import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const checkinsQuery = queryOptions({
  queryKey: ["checkins"],
  queryFn: async () => {
    const { data, error } = await supabase.from("daily_checkins").select("*").order("date", { ascending: false }).limit(30);
    if (error) throw error;
    return data ?? [];
  },
});

export const homeWorkoutQuery = queryOptions({
  queryKey: ["plan-days-home"],
  queryFn: async () => {
    const [plan, sessions] = await Promise.all([
      supabase.from("workout_plans").select("workout_days(day_index, title, focus)").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("status", "completed").not("day_id", "is", null),
    ]);
    if (plan.error) throw plan.error;
    if (sessions.error) throw sessions.error;
    const days = [...(plan.data?.workout_days ?? [])].sort((a, b) => a.day_index - b.day_index);
    return days.length ? days[(sessions.count ?? 0) % days.length] : null;
  },
});