import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const workoutPlanQuery = queryOptions({
  queryKey: ["plan"],
  queryFn: async () => {
    const { data, error } = await supabase.from("workout_plans")
      .select("id, name, summary, workout_days(id, day_index, title, focus, workout_day_exercises(id, exercise_id, position, sets, reps, rest_sec, notes))")
      .eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const workoutSessionsQuery = queryOptions({
  queryKey: ["sessions"],
  queryFn: async () => {
    const { data, error } = await supabase.from("workout_sessions")
      .select("id, title, status, started_at").order("started_at", { ascending: false }).limit(8);
    if (error) throw error;
    return data ?? [];
  },
});

export const sessionQuery = (sessionId: string) => queryOptions({
  queryKey: ["session", sessionId],
  staleTime: 0,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  queryFn: async () => {
    const [session, sets] = await Promise.all([
      supabase.from("workout_sessions").select("id, title, status, day_id").eq("id", sessionId).single(),
      supabase.from("workout_sets").select("id, exercise_id, set_index, reps, weight_kg, completed, skipped").eq("session_id", sessionId),
    ]);
    if (session.error) throw session.error;
    if (sets.error) throw sets.error;
    let order: { exercise_id: string; rest_sec: number; position: number }[] = [];
    if (session.data.day_id) {
      const result = await supabase.from("workout_day_exercises").select("exercise_id, rest_sec, position").eq("day_id", session.data.day_id);
      if (result.error) throw result.error;
      order = result.data ?? [];
    }
    return { session: session.data, rows: sets.data ?? [], order };
  },
});