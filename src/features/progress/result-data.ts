import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { addDaysISO, dailyTargets, resultAnalysis, todayISO } from "@/lib/fitness";
import { nutrientsSchema } from "@/features/nutrition/model";

/** Loads the user's recent logs and computes adherence scores; shared by the Progress screen and the AI analysis. */
export async function loadResultAnalysis(db: SupabaseClient<Database>, userId: string, today: string) {
  const from = addDaysISO(today, -27);
  const [profile, checkins, meals, sessions, weights] = await Promise.all([
    db.from("profiles").select("goal,weight_kg,height_cm,age,gender,activity_level,workout_frequency,target_weight_kg,trial_started_at,medical_conditions").eq("id", userId).single(),
    db.from("daily_checkins").select("date,diet_followed,water_ml,sleep_hours,workout_done").eq("user_id", userId).gte("date", from),
    db.from("meal_logs").select("logged_on,nutrition").eq("user_id", userId).gte("logged_on", from),
    db.from("workout_sessions").select("finished_at").eq("user_id", userId).eq("status", "completed").gte("started_at", from),
    db.from("weight_logs").select("logged_on,weight_kg").eq("user_id", userId).gte("logged_on", from),
  ]);
  if (profile.error || !profile.data || checkins.error || meals.error || sessions.error || weights.error) throw new Error("Could not load your result analysis");
  const p = profile.data;
  const targets = dailyTargets({ weightKg: Number(p.weight_kg ?? 70), heightCm: Number(p.height_cm ?? 170), age: p.age ?? 30, gender: p.gender, activityLevel: p.activity_level, goal: p.goal });
  const input = {
    today,
    goal: p.goal,
    caloriesTarget: targets.calories,
    waterTargetMl: targets.waterMl,
    workoutsPerWeek: p.workout_frequency,
    checkins: checkins.data.map((c) => ({ ...c, sleep_hours: c.sleep_hours === null ? null : Number(c.sleep_hours) })),
    meals: meals.data.flatMap((m) => {
      const n = nutrientsSchema.safeParse(m.nutrition);
      return n.success ? [{ date: m.logged_on, calories: n.data.calories }] : [];
    }),
    workoutDates: [
      ...sessions.data.flatMap((s) => (s.finished_at ? [todayISO(new Date(s.finished_at))] : [])),
      ...checkins.data.filter((c) => c.workout_done).map((c) => c.date),
    ],
    weights: weights.data.map((w) => ({ logged_on: w.logged_on, weight_kg: Number(w.weight_kg) })),
  };
  return { analysis: resultAnalysis(input), input, profile: p, targets };
}
