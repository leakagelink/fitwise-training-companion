import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dailyTargets, GOAL_LABELS, trialStatus, type Goal } from "@/lib/fitness";

type Result =
  | { status: "ok"; content: string }
  | { status: "locked" }
  | { status: "error"; message: string };

export const getDailyRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { date: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Invalid date");
    return input;
  })
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;

    const { data: cached } = await supabase
      .from("ai_recommendations")
      .select("content")
      .eq("user_id", userId)
      .eq("kind", "daily")
      .eq("for_date", data.date)
      .maybeSingle();
    if (cached) return { status: "ok", content: cached.content };

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (pErr || !profile) return { status: "error", message: "Profile not found" };

    // Server-side access control: AI features require an active trial (subscriptions arrive in Phase 6).
    if (!trialStatus(profile.trial_started_at).active) return { status: "locked" };

    const { data: checkins } = await supabase
      .from("daily_checkins")
      .select("date, water_ml, sleep_hours, energy_level, workout_done, diet_followed")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7);

    const targets =
      profile.weight_kg && profile.height_cm && profile.age
        ? dailyTargets({
            weightKg: Number(profile.weight_kg),
            heightCm: Number(profile.height_cm),
            age: profile.age,
            gender: profile.gender,
            activityLevel: profile.activity_level,
            goal: profile.goal,
          })
        : null;

    const prompt = `User profile:
- Goal: ${profile.goal ? GOAL_LABELS[profile.goal as Goal] : "not set"}
- Age ${profile.age ?? "?"}, ${profile.gender ?? "gender unspecified"}, ${profile.height_cm ?? "?"} cm, ${profile.weight_kg ?? "?"} kg, target ${profile.target_weight_kg ?? "?"} kg
- Diet: ${profile.diet_type ?? "?"}; allergies: ${profile.allergies.join(", ") || "none"}
- Trains at ${profile.workout_location ?? "?"}, ${profile.experience_level ?? "?"} level, ${profile.workout_frequency ?? "?"}x/week
- Medical notes: ${profile.medical_conditions ? "user reported conditions (be conservative)" : "none reported"}
${targets ? `- Estimated targets: ${targets.calories} kcal, ${targets.proteinG} g protein, ${targets.waterMl} ml water` : ""}
Last 7 days check-ins (newest first): ${JSON.stringify(checkins ?? [])}

Write today's recommendation: 2-3 short, specific, actionable sentences (max 60 words). No headings, no lists, no markdown.`;

    const { generateCoachText, friendlyAiError } = await import("@/lib/ai/ai.server");
    try {
      const content = await generateCoachText(prompt, "You write the user's daily coaching tip.");
      if (!content) return { status: "error", message: "The coach returned an empty response." };
      await supabase
        .from("ai_recommendations")
        .upsert({ user_id: userId, kind: "daily", for_date: data.date, content }, { onConflict: "user_id,kind,for_date" });
      return { status: "ok", content };
    } catch (error) {
      console.error("daily recommendation failed", error);
      return { status: "error", message: friendlyAiError(error) };
    }
  });
