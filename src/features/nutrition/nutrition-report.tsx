import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDaysISO, weeklyNutritionReport } from "@/lib/fitness";
import { nutrientsSchema } from "./model";

const MAIN = ["breakfast", "lunch", "dinner"];
const weekQuery = (date: string) => queryOptions({
  queryKey: ["meal-logs", "week", date],
  queryFn: async () => {
    const from = addDaysISO(date, -6);
    const [logs, checkins, followups] = await Promise.all([
      supabase.from("meal_logs").select("logged_on,meal_type,nutrition").gte("logged_on", from).lte("logged_on", date),
      supabase.from("daily_checkins").select("date,water_ml").gte("date", from).lte("date", date),
      supabase.from("meal_followups").select("date,meal_type,status").gte("date", from).lte("date", date),
    ]);
    if (logs.error || checkins.error || followups.error) throw new Error("Could not load your nutrition report");
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDaysISO(from, i);
      const day = logs.data.filter((l) => l.logged_on === d);
      const n = day.flatMap((l) => { const r = nutrientsSchema.safeParse(l.nutrition); return r.success ? [r.data] : []; });
      const mains = new Set(day.map((l) => l.meal_type.toLowerCase()).filter((t) => MAIN.includes(t)));
      return {
        date: d,
        calories: Math.round(n.reduce((a, x) => a + x.calories, 0)),
        protein: Math.round(n.reduce((a, x) => a + x.protein, 0)),
        logged: mains.size,
        missed: followups.data.filter((f) => f.date === d && f.status !== "logged" && !mains.has(f.meal_type)).length,
        water: checkins.data.find((c) => c.date === d)?.water_ml ?? 0,
      };
    });
  },
});

const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric" });

/** Today's remaining targets, meal compliance and a 7-day nutrition report for the diary tab. */
export function NutritionReport({ date, targets }: { date: string; targets: { calories: number; proteinG: number; waterMl: number } }) {
  const q = useQuery(weekQuery(date));
  if (!q.data) return q.isError ? <p className="text-sm text-destructive">Could not load your nutrition report.</p> : null;
  const today = q.data[6]!;
  const r = weeklyNutritionReport(q.data, targets.calories, targets.proteinG);
  const pct = (a: number, b: number) => Math.min(100, Math.round((a / b) * 100));
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Box label="Calories left" value={`${Math.max(0, targets.calories - today.calories)} kcal`} />
        <Box label="Protein target" value={`${pct(today.protein, targets.proteinG)}%`} />
        <Box label="Water target" value={`${pct(today.water, targets.waterMl)}%`} />
        <Box label="Meals followed / missed" value={`${today.logged} / ${today.missed}`} />
      </section>
      <section className="card-premium space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Weekly nutrition report</p>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><p className="text-muted-foreground">Avg calories</p><p className="font-bold">{r.avgCalories} kcal</p></div>
          <div><p className="text-muted-foreground">Avg protein</p><p className="font-bold">{r.avgProtein} g</p></div>
          <div><p className="text-muted-foreground">Diet consistency</p><p className="font-bold">{r.consistency}%</p></div>
          <div><p className="text-muted-foreground">Diet adherence</p><p className="font-bold">{r.adherence === null ? "—" : `${r.adherence}%`}</p></div>
        </div>
        <p className="text-sm"><span className="font-semibold">Best days:</span> {r.best.length ? r.best.map(fmt).join(", ") : "Log meals to see your best days"}</p>
        <p className="text-sm"><span className="font-semibold">Improve:</span> {r.improve.length ? r.improve.join(" · ") : "Great week — keep it up!"}</p>
      </section>
    </div>
  );
}
function Box({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}
