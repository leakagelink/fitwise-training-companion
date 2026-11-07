import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChefHat, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useProfile } from "@/hooks/use-profile";
import { dailyTargets, todayISO, trialStatus } from "@/lib/fitness";
import { dietSchema, nutrientsSchema, scaleMeal, totalNutrition, type Meal, type Nutrients } from "@/features/nutrition/model";
import { nutritionQuery, mealLogsQuery } from "@/features/nutrition/queries";
import { generateDiet } from "@/features/nutrition/nutrition.functions";
import { RecipeDialog } from "@/features/nutrition/recipe-dialog";
import { MealLogDialog } from "@/features/nutrition/meal-log-dialog";
import { GroceryList } from "@/features/grocery/grocery-list";
import bowl from "@/assets/nutrition-bowl.jpg";

export const Route = createFileRoute("/_authenticated/_app/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition & Recipes — Fitness AI" }, { name: "description", content: "Personal diet plans, recipes, grocery lists and your daily meal diary." }, { property: "og:title", content: "Nutrition & Recipes — Fitness AI" }, { property: "og:description", content: "Personalized meals and real nutrition tracking." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(nutritionQuery),
  component: Nutrition,
});

function dateOffset(date: string, offset: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + offset); return todayISO(d); }

function Nutrition() {
  const { data: plan } = useSuspenseQuery(nutritionQuery);
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const gen = useServerFn(generateDiet);
  const [date, setDate] = useState(todayISO());
  const [recipe, setRecipe] = useState<Meal | null>(null);
  const [logging, setLogging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(plan?.preferences ?? "");
  const [duration, setDuration] = useState<1 | 3 | 7 | 30>(3);
  const logs = useQuery(mealLogsQuery(date));
  const parsed = dietSchema.shape.days.safeParse(plan?.days ?? []);
  const days = parsed.success ? parsed.data : [];
  const dayIndex = plan ? Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${plan.start_date}T12:00:00`).getTime()) / 86400000) : -1;
  const meals = days[dayIndex]?.meals ?? [];
  const consumed = totalNutrition((logs.data ?? []).map(l => { const n = nutrientsSchema.safeParse(l.nutrition); return n.success ? n.data : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }; }));
  const planned = totalNutrition(meals.map(m => m.nutrition));
  if (!p) return <Loader2 className="m-6 animate-spin" />;
  const targets = dailyTargets({ weightKg: p.weight_kg ?? 70, heightCm: p.height_cm ?? 170, age: p.age ?? 30, gender: p.gender, activityLevel: p.activity_level, goal: p.goal });
  const active = trialStatus(p.trial_started_at).active;

  async function refresh() { await Promise.all([qc.invalidateQueries({ queryKey: ["nutrition-plan"] }), qc.invalidateQueries({ queryKey: ["meal-logs"] }), qc.invalidateQueries({ queryKey: ["checkins"] })]); }
  async function generate(index?: number) {
    setBusy(index === undefined ? "plan" : `replace-${index}`);
    try {
      const r = await gen({ data: { startDate: date, duration: index === undefined ? duration : 1, preferences, planId: index === undefined ? null : plan?.id ?? null, day: Math.max(0, dayIndex), meal: index ?? 0 } });
      if (r.status !== "ok") toast.error(r.message);
      else { toast.success(index === undefined ? "Your diet plan is ready" : "Meal replaced"); await refresh(); }
    } catch { toast.error("Could not reach your nutrition coach. Your previous plan is unchanged."); }
    finally { setBusy(null); }
  }
  async function log(name: string, type: string, nutrition: Nutrients, key?: string) {
    if (!p) return;
    const { error } = await supabase.from("meal_logs").upsert({ user_id: p.id, logged_on: date, name, meal_type: type, nutrition: nutrition as unknown as Json, meal_key: key ?? null }, { onConflict: "user_id,logged_on,meal_key" });
    if (error) { toast.error("Could not save meal"); throw error; }
    await refresh(); toast.success("Meal logged");
  }
  async function toggleMeal(meal: Meal, index: number) {
    const key = `${plan?.id}:${dayIndex}:${index}`;
    const existing = logs.data?.find(l => l.meal_key === key);
    setBusy(`log-${index}`);
    try {
      if (existing) { const { error } = await supabase.from("meal_logs").delete().eq("id", existing.id); if (error) throw error; }
      else await log(meal.name, meal.type, meal.nutrition, key);
      const completed = meals.every((_, i) => i === index ? !existing : logs.data?.some(l => l.meal_key === `${plan?.id}:${dayIndex}:${i}`));
      if (p) { const { error } = await supabase.from("daily_checkins").upsert({ user_id: p.id, date, diet_followed: completed }, { onConflict: "user_id,date" }); if (error) toast.error("Meal saved, but daily diet status could not update"); }
      await refresh();
    } catch { toast.error("Could not update meal completion"); } finally { setBusy(null); }
  }
  async function servings(index: number, value: number) {
    if (!plan || !Number.isFinite(value) || value <= 0 || value > 10 || value === 1) return;
    const next = days.map((d, i) => i === dayIndex ? { meals: d.meals.map((m, j) => j === index ? scaleMeal(m, value) : m) } : d);
    const { error } = await supabase.from("nutrition_plans").update({ days: next as unknown as Json }).eq("id", plan.id);
    if (error) toast.error("Could not adjust serving"); else await refresh();
  }
  return <div className="mx-auto max-w-5xl space-y-6 px-5 py-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-primary">Fuel your progress</p><h1 className="mt-1 text-3xl font-bold">Nutrition</h1></div><Button variant="secondary" onClick={() => setLogging(true)}><Plus /> Log meal</Button></header>
    <div className="flex items-center justify-between border-y border-border py-3"><Button size="icon" variant="ghost" aria-label="Previous date" onClick={() => setDate(dateOffset(date, -1))}><ChevronLeft /></Button><input aria-label="Nutrition date" type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} className="bg-transparent text-sm font-semibold" /><Button size="icon" variant="ghost" aria-label="Next date" onClick={() => setDate(dateOffset(date, 1))}><ChevronRight /></Button></div>
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">{([['Calories', consumed.calories, targets.calories, 'kcal', 'text-energy'], ['Protein', consumed.protein, targets.proteinG, 'g', 'text-protein'], ['Carbs', consumed.carbs, null, 'g', 'text-primary'], ['Fat', consumed.fat, null, 'g', 'text-water'], ['Fiber', consumed.fiber, null, 'g', 'text-muted-foreground']] as const).map(([label, value, target, unit, color]) => <div key={label} className="border-l-2 border-border pl-3"><p className={`text-xs font-semibold ${color}`}>{label}</p><p className="mt-1 text-2xl font-bold">{Math.round(value)} <span className="text-xs font-normal text-muted-foreground">{unit}</span></p><p className="text-xs text-muted-foreground">{target ? `/ ${target} target` : "consumed"}</p></div>)}</section>
    <p className="text-xs text-muted-foreground">Nutrition values are estimates. {p.diet_type?.replaceAll('_', ' ')} {p.allergies.length > 0 && `· Avoid: ${p.allergies.join(', ')}`}</p>
    <Tabs defaultValue="plan"><TabsList className="mb-5"><TabsTrigger value="plan">Meal plan</TabsTrigger><TabsTrigger value="diary">Diary</TabsTrigger><TabsTrigger value="groceries">Groceries</TabsTrigger></TabsList>
      <TabsContent value="plan" className="space-y-5">
        {!plan && <div className="relative overflow-hidden rounded-2xl"><img src={bowl} width={1200} height={800} alt="Chickpea, quinoa and vegetable bowl" className="h-56 w-full object-cover sm:h-72" /><div className="bg-card py-4"><h2 className="text-xl font-semibold">Your personal diet plan</h2><p className="mt-1 text-sm text-muted-foreground">{targets.calories} kcal · {targets.proteinG} g protein daily targets</p></div></div>}
        {plan && <div><h2 className="text-xl font-semibold">{plan.name}</h2><p className="mt-1 text-xs text-muted-foreground">{plan.duration_days}-day plan · starts {plan.start_date}</p></div>}
        {plan && meals.length === 0 && <div className="border-y border-border py-6"><p>No planned meals for this date.</p><Button className="mt-3" variant="outline" onClick={() => setDate(plan.start_date)}>View plan start</Button></div>}
        {meals.map((m, index) => { const done = logs.data?.some(l => l.meal_key === `${plan?.id}:${dayIndex}:${index}`); return <article key={`${plan?.id}-${dayIndex}-${index}`} className="rounded-2xl border border-border bg-card p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-primary">{m.type} · {m.time}</p><h3 className="mt-2 text-lg font-semibold">{m.name}</h3><p className="mt-1 text-sm text-muted-foreground">{m.quantity}</p></div><Button variant={done ? "default" : "outline"} size="icon" aria-label={`${done ? 'Unmark' : 'Complete'} ${m.type}`} title={done ? "Undo meal completion" : "Mark eaten"} disabled={!!busy} onClick={() => toggleMeal(m, index)}><Check /></Button></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"><span className="text-energy">{Math.round(m.nutrition.calories)} kcal</span><span>{m.nutrition.protein} g protein</span><span>{m.nutrition.carbs} g carbs</span><span>{m.nutrition.fat} g fat</span><span>{m.nutrition.fiber} g fiber</span></div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3"><Button variant="secondary" size="sm" onClick={() => setRecipe(m)}><ChefHat /> Recipe</Button><Button size="icon" variant="ghost" title="Replace meal with AI" disabled={!!busy || !active} onClick={() => generate(index)}>{busy === `replace-${index}` ? <Loader2 className="animate-spin" /> : <RefreshCw />}</Button><label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">Serving multiplier<Input key={JSON.stringify(m.nutrition)} aria-label={`${m.type} serving multiplier`} type="number" min={0.1} max={10} step={0.1} defaultValue={1} className="w-16" onBlur={e => servings(index, Number(e.target.value))} /></label></div></article>; })}
        {meals.length > 0 && <p className="text-sm text-muted-foreground">Planned total: {Math.round(planned.calories)} kcal · {Math.round(planned.protein)} g protein · {Math.round(planned.carbs)} g carbs · {Math.round(planned.fat)} g fat · {Math.round(planned.fiber)} g fiber</p>}
        <div className="space-y-3 border-t border-border pt-5"><label className="block text-sm font-medium" htmlFor="diet-preferences">Budget &amp; food preferences</label><Input id="diet-preferences" placeholder="e.g. affordable Indian meals, 20-minute recipes" value={preferences} maxLength={1000} onChange={e => setPreferences(e.target.value)} /><div className="flex flex-wrap gap-3"><select aria-label="Diet plan duration" value={duration} onChange={e => setDuration(Number(e.target.value) as 1 | 3 | 7 | 30)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value={1}>Daily</option><option value={3}>3-day trial</option><option value={7}>Weekly · premium</option><option value={30}>Monthly · premium</option></select><Button disabled={!!busy || !active} onClick={() => generate()}>{busy === "plan" ? <Loader2 className="animate-spin" /> : <Wand2 />}{busy === "plan" ? "Designing meals…" : plan ? "Generate new plan" : "Generate my diet plan"}</Button></div>{!active && <p role="status" className="text-sm text-muted-foreground">Your three-day trial has ended. Premium access arrives in Phase 6; your saved meals and diary remain available.</p>}</div>
      </TabsContent>
      <TabsContent value="diary"><div className="flex justify-between"><h2 className="text-xl font-semibold">Meals eaten</h2><Button variant="outline" size="sm" onClick={() => setLogging(true)}><Plus /> Add meal</Button></div>{logs.isError && <p role="alert">{logs.error.message}</p>}{!logs.data?.length && <p className="py-8 text-sm text-muted-foreground">No meals logged for this date.</p>}<div className="divide-y divide-border">{logs.data?.map(l => { const n = nutrientsSchema.safeParse(l.nutrition); return <div key={l.id} className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.meal_type} · {n.success ? `${Math.round(n.data.calories)} kcal · ${n.data.protein} g protein` : "Nutrition unavailable"}</p></div><Button variant="ghost" size="icon" title={`Delete ${l.name}`} onClick={async () => { const { error } = await supabase.from("meal_logs").delete().eq("id", l.id); if (error) toast.error("Could not delete meal"); else await refresh(); }}><Trash2 /></Button></div>; })}</div></TabsContent>
      <TabsContent value="groceries"><GroceryList days={days} planId={plan?.id} userId={p.id} /></TabsContent>
    </Tabs>
    <RecipeDialog meal={recipe} close={() => setRecipe(null)} /><MealLogDialog open={logging} close={() => setLogging(false)} save={log} />
  </div>;
}
