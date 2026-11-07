import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Droplets, Dumbbell, Flame, UserRound, Utensils } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { ActivityRings } from "@/components/activity-rings";
import { dailyTargets, GOAL_LABELS, todayISO, trialStatus, workoutStreak, type Goal } from "@/lib/fitness";
import { getDailyRecommendation } from "@/features/dashboard/recommendation.functions";

export const Route = createFileRoute("/_authenticated/_app/home")({
  head: () => ({ meta: [{ title: "Home — Fitness AI" }, { name: "description", content: "Your daily Fitness AI dashboard." }, { property: "og:title", content: "Home — Fitness AI" }, { property: "og:description", content: "Your daily dashboard." }] }),
  component: Home,
});

function Home() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const today = todayISO();
  const recFn = useServerFn(getDailyRecommendation);
  const checkins = useQuery({
    queryKey: ["checkins"],
    queryFn: async () => (await supabase.from("daily_checkins").select("*").order("date", { ascending: false }).limit(30)).data ?? [],
  });
  const rec = useQuery({ queryKey: ["rec", today], queryFn: () => recFn({ data: { date: today } }), staleTime: Infinity, retry: false });

  if (!p) return null;
  const t = dailyTargets({ weightKg: Number(p.weight_kg), heightCm: Number(p.height_cm), age: p.age ?? 30, gender: p.gender, activityLevel: p.activity_level, goal: p.goal });
  const todayRow = checkins.data?.find((c) => c.date === today);
  const water = todayRow?.water_ml ?? 0;
  const streak = workoutStreak((checkins.data ?? []).filter((c) => c.workout_done).map((c) => c.date), today);
  const trial = trialStatus(p.trial_started_at);

  async function update(patch: { water_ml?: number; workout_done?: boolean; diet_followed?: boolean }) {
    const { error } = await supabase.from("daily_checkins").upsert({ user_id: p!.id, date: today, water_ml: water, workout_done: todayRow?.workout_done ?? false, diet_followed: todayRow?.diet_followed ?? false, ...patch }, { onConflict: "user_id,date" });
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["checkins"] });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-5 py-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hello,</p>
          <h1 className="text-2xl font-bold">{p.full_name ?? "Athlete"}</h1>
        </div>
        <Link to="/profile" aria-label="Profile" className="grid size-11 place-items-center rounded-full bg-secondary"><UserRound className="size-5" /></Link>
      </header>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">{GOAL_LABELS[p.goal as Goal]}</span>
        <span className="rounded-full bg-secondary px-3 py-1">{trial.active ? `Free trial · ${trial.daysLeft} day(s) left` : "Trial ended"}</span>
        <span className="rounded-full bg-secondary px-3 py-1">{p.weight_kg} kg → {p.target_weight_kg} kg</span>
      </div>

      <section className="card-premium bg-hero p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Coach tip for today</p>
        <p className="mt-2 leading-relaxed">
          {rec.isLoading ? "Your coach is thinking…" : rec.data?.status === "ok" ? rec.data.content : rec.data?.status === "locked" ? "Your trial has ended — premium plans arrive soon." : rec.data?.status === "error" ? rec.data.message : "Unavailable right now."}
        </p>
      </section>

      <section className="card-premium flex items-center gap-6 p-5">
        <ActivityRings rings={[
          { label: "Workout", value: todayRow?.workout_done ? 1 : 0, colorVar: "var(--primary)" },
          { label: "Diet", value: todayRow?.diet_followed ? 1 : 0, colorVar: "var(--energy)" },
          { label: "Water", value: water / t.waterMl, colorVar: "var(--water)" },
        ]} />
        <div className="space-y-2 text-sm">
          <p><span className="text-primary">●</span> Workout {todayRow?.workout_done ? "done" : "pending"}</p>
          <p><span className="text-energy">●</span> Diet {todayRow?.diet_followed ? "followed" : "pending"}</p>
          <p><span className="text-water">●</span> Water {water} / {t.waterMl} ml</p>
          <p className="text-muted-foreground">🔥 {streak}-day workout streak</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card-premium p-4"><Flame className="size-5 text-energy" /><p className="mt-2 text-2xl font-bold">{t.calories}</p><p className="text-xs text-muted-foreground">est. daily kcal target</p></div>
        <div className="card-premium p-4"><Utensils className="size-5 text-protein" /><p className="mt-2 text-2xl font-bold">{t.proteinG} g</p><p className="text-xs text-muted-foreground">est. daily protein target</p></div>
        <div className="card-premium p-4"><Droplets className="size-5 text-water" /><p className="mt-2 text-2xl font-bold">{t.waterMl} ml</p><p className="text-xs text-muted-foreground">daily water target</p></div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <button onClick={() => update({ water_ml: Math.min(15000, water + 250) })} className="rounded-2xl bg-secondary p-4 text-sm font-medium"><Droplets className="mx-auto mb-1 size-5 text-water" />+250 ml</button>
        <button onClick={() => update({ workout_done: !todayRow?.workout_done })} className="rounded-2xl bg-secondary p-4 text-sm font-medium"><Dumbbell className="mx-auto mb-1 size-5 text-primary" />Workout done</button>
        <button onClick={() => update({ diet_followed: !todayRow?.diet_followed })} className="rounded-2xl bg-secondary p-4 text-sm font-medium"><Utensils className="mx-auto mb-1 size-5 text-energy" />Diet followed</button>
      </section>
    </div>
  );
}
