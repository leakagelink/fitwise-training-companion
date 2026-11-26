import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GOAL_LABELS, type Goal } from "@/lib/fitness";
import { allowedForUser, hasGif, difficultyAllowed, type Exercise } from "@/features/exercise-library/catalog";

const planSchema = z.object({
  name: z.string(),
  summary: z.string(),
  days: z.array(
    z.object({
      title: z.string(),
      focus: z.string(),
      exercises: z.array(
        z.object({
          exercise_id: z.string(),
          sets: z.number().int(),
          reps: z.string(),
          rest_sec: z.number().int(),
          notes: z.string().nullable(),
        }),
      ),
    }),
  ),
});

type Result = { status: "ok"; planId: string } | { status: "locked" } | { status: "error"; message: string };

export const generateWorkoutPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Result> => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!p) return { status: "error", message: "Profile not found" };
    const { readUserLanguage } = await import('@/features/language/language.server');
    const language = await readUserLanguage(supabase, userId);
    const { readAccess } = await import("@/features/admin/access.server");
    const { workoutIsFree } = await import("@/features/admin/access");
    if (!workoutIsFree(p.workout_location) && !(await readAccess(supabase, userId, p.trial_started_at)).workouts) return { status: "locked" };

    const all = (await import("@/data/exercises.json")).default as Exercise[];
    const pool = all.filter(
      (e) =>
        hasGif(e.id) &&
        e.category !== "stretching" &&
        e.category !== "olympic" &&
        allowedForUser(e, p.workout_location, p.equipment) &&
        difficultyAllowed(e.difficulty, p.experience_level),
    );
    if (pool.length < 10) return { status: "error", message: "Not enough exercises match your equipment. Update your profile equipment." };
    const ids = new Set(pool.map((e) => e.id));
    const catalog = pool.map((e) => `${e.id}|${e.name}|${e.primary.join(",")}|${e.equipment ?? "bodyweight"}|${e.difficulty}`).join("\n");

    const days = Math.min(6, Math.max(1, p.workout_frequency ?? 3));
    const prompt = `Create a ${days}-day weekly workout program.
Goal: ${p.goal ? GOAL_LABELS[p.goal as Goal] : "general fitness"}. Level: ${p.experience_level}. Location: ${p.workout_location}. Session length: ${p.workout_duration_min ?? 45} min.
Age ${p.age}, ${p.gender}. ${p.medical_conditions ? `User-reported conditions/injuries (be conservative, avoid aggravating movements): ${p.medical_conditions}` : ""}

Rules:
- Use ONLY exercise_id values from the catalog below (format id|name|primary muscles|equipment|difficulty). Never invent ids.
- ${days} days, each with 4-7 exercises sized to fit the session length; balance muscle groups across the week.
- sets 2-5, reps as a string like "8-12" or "30s", rest_sec 30-180. notes: a short form cue or null.

CATALOG:
${catalog}`;

    const { generateCoachObject, friendlyAiError } = await import("@/lib/ai/ai.server");
    const { trackedGeneration } = await import("@/features/admin/generation.server");
    let plan: z.infer<typeof planSchema>;
    try {
      plan = await trackedGeneration(userId, "workout_plan", "openai/gpt-5.6-luna", () => generateCoachObject(prompt, "You are an expert strength & conditioning coach designing safe programs.", planSchema, undefined, language));
    } catch (error) {
      console.error("plan generation failed", error);
      return { status: "error", message: friendlyAiError(error) };
    }

    // Exercise IDs must resolve against the internal catalog.
    const cleanDays = plan.days
      .map((d) => ({ ...d, exercises: d.exercises.filter((x) => ids.has(x.exercise_id)) }))
      .filter((d) => d.exercises.length > 0);
    if (cleanDays.length === 0) return { status: "error", message: "The plan didn't match the exercise library. Please try again." };

    await supabase.from("workout_plans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    const { data: planRow, error } = await supabase
      .from("workout_plans")
      .insert({ user_id: userId, name: plan.name.slice(0, 120), summary: plan.summary.slice(0, 600) })
      .select("id")
      .single();
    if (error || !planRow) return { status: "error", message: "Could not save plan" };

    for (const [i, d] of cleanDays.entries()) {
      const { data: day, error: dErr } = await supabase
        .from("workout_days")
        .insert({ plan_id: planRow.id, user_id: userId, day_index: i, title: d.title.slice(0, 80), focus: d.focus.slice(0, 160) })
        .select("id")
        .single();
      if (dErr || !day) return { status: "error", message: "Could not save plan days" };
      const { error: xErr } = await supabase.from("workout_day_exercises").insert(
        d.exercises.map((x, j) => ({
          day_id: day.id,
          user_id: userId,
          exercise_id: x.exercise_id,
          position: j,
          sets: Math.min(10, Math.max(1, x.sets)),
          reps: x.reps.slice(0, 20),
          rest_sec: Math.min(600, Math.max(0, x.rest_sec)),
          notes: x.notes?.slice(0, 200) ?? null,
        })),
      );
      if (xErr) return { status: "error", message: "Could not save plan exercises" };
    }
    return { status: "ok", planId: planRow.id };
  });
