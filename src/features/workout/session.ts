import { supabase } from "@/integrations/supabase/client";

export interface SessionItem {
  exercise_id: string;
  sets: number;
  reps: string;
}

const firstInt = (s: string) => {
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : null;
};

/** Creates an active session and pre-fills its sets (weights taken from the last time the exercise was done). */
export async function startSession(title: string, dayId: string | null, items: SessionItem[]) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const userId = auth.user.id;

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: userId, title, day_id: dayId })
    .select("id")
    .single();
  if (error || !session) throw error ?? new Error("Could not start workout");

  const { data: prev } = await supabase
    .from("workout_sets")
    .select("exercise_id, weight_kg, updated_at")
    .in("exercise_id", items.map((i) => i.exercise_id))
    .eq("completed", true)
    .order("updated_at", { ascending: false })
    .limit(200);
  const lastWeight = new Map<string, number | null>();
  for (const r of prev ?? []) if (!lastWeight.has(r.exercise_id)) lastWeight.set(r.exercise_id, r.weight_kg);

  const rows = items.flatMap((it) =>
    Array.from({ length: it.sets }, (_, k) => ({
      session_id: session.id,
      user_id: userId,
      exercise_id: it.exercise_id,
      set_index: k,
      reps: firstInt(it.reps),
      weight_kg: lastWeight.get(it.exercise_id) ?? null,
    })),
  );
  const { error: sErr } = await supabase.from("workout_sets").insert(rows);
  if (sErr) throw sErr;
  return session.id;
}
