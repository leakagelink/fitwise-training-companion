import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircleQuestion, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { todayISO } from "@/lib/fitness";
import { mealLogsQuery } from "@/features/nutrition/queries";
import { MISSED_REASONS, missedMeals, type FollowupMeal } from "./model";
import { mealFollowupsQuery, reminderSettingsQuery } from "./queries";
import { suggestMissedMeal, type MissedMealOption } from "./followup.functions";

const LABEL: Record<FollowupMeal, string> = { breakfast: "breakfast", lunch: "lunch", dinner: "dinner" };

/** Asks about the first missed meal today and offers AI alternatives that can be logged in one tap. */
export function MissedMealCard({ userId }: { userId: string }) {
  const today = todayISO();
  const qc = useQueryClient();
  const settings = useQuery(reminderSettingsQuery);
  const logs = useQuery(mealLogsQuery(today));
  const followups = useQuery(mealFollowupsQuery(today));
  const suggest = useServerFn(suggestMissedMeal);
  const [now, setNow] = useState<Date | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ message: string; options: MissedMealOption[] } | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  if (!now || !settings.data || !logs.data || !followups.data) return null;
  const meal = missedMeals(settings.data, now, logs.data.map((l) => l.meal_type), followups.data.map((f) => f.meal_type))[0];
  if (!meal) return null;

  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["meal-followups"] }),
      qc.invalidateQueries({ queryKey: ["meal-logs"] }),
      qc.invalidateQueries({ queryKey: ["progress"] }),
    ]);
  }
  async function close(status: "skipped" | "dismissed" | "logged", why: string | null) {
    const { error } = await supabase.from("meal_followups").upsert({ user_id: userId, date: today, meal_type: meal!, reason: why, status }, { onConflict: "user_id,date,meal_type" });
    if (error) throw error;
  }
  async function ask(why: string) {
    setReason(why);
    setBusy("ask");
    try {
      const time = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
      const r = await suggest({ data: { meal: meal!, reason: why, date: today, localTime: time } });
      if (r.status === "ok") setAnswer({ message: r.message, options: r.options });
      else toast.error(r.message);
    } catch {
      toast.error("Could not reach your coach. Please try again.");
    } finally {
      setBusy(null);
    }
  }
  async function logOption(option: MissedMealOption, index: number) {
    setBusy(`log-${index}`);
    try {
      const { error } = await supabase.from("meal_logs").insert({ user_id: userId, logged_on: today, name: option.name, meal_type: meal!, nutrition: option.nutrition as unknown as Json });
      if (error) throw error;
      await close("logged", reason);
      toast.success(`${option.name} logged`);
      await refresh();
      setAnswer(null); setReason(null);
    } catch {
      toast.error("Could not log this meal");
    } finally {
      setBusy(null);
    }
  }
  async function finish(status: "skipped" | "dismissed") {
    setBusy(status);
    try {
      await close(status, reason);
      await refresh();
      setAnswer(null); setReason(null);
    } catch {
      toast.error("Could not save. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label={`Missed ${LABEL[meal]} check-in`} className="card-premium space-y-4 border-l-4 border-l-energy p-5">
      <div className="flex items-start gap-3">
        <MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-energy" />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-energy">Coach check-in</p>
          <h2 className="mt-1 font-semibold">Missed your {LABEL[meal]}? That's okay.</h2>
          <p className="text-sm text-muted-foreground">{answer ? answer.message : "Why did you miss it? Tell me and I'll suggest what you can eat now."}</p>
        </div>
        <Button size="icon" variant="ghost" aria-label="Close check-in" disabled={!!busy} onClick={() => finish("dismissed")}><X /></Button>
      </div>

      {!answer && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {MISSED_REASONS.filter((r) => r !== "Other").map((r) => (
              <Button key={r} size="sm" variant={reason === r ? "default" : "secondary"} className="rounded-full" disabled={!!busy} onClick={() => ask(r)}>{r}</Button>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (other.trim()) void ask(other.trim()); }}>
            <Input aria-label="Other reason" placeholder="Other reason…" value={other} maxLength={200} onChange={(e) => setOther(e.target.value)} />
            <Button type="submit" variant="outline" disabled={!!busy || !other.trim()}>Ask</Button>
          </form>
          {busy === "ask" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Finding quick alternatives…</p>}
        </div>
      )}

      {answer && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">What you can have now</p>
          {answer.options.map((o, i) => (
            <div key={`${o.name}-${i}`} className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{o.name} <span className="text-sm font-normal text-muted-foreground">· {o.quantity}</span></p>
                <p className="text-xs text-muted-foreground">{Math.round(o.nutrition.calories)} kcal · {Math.round(o.nutrition.protein)} g protein · ~{Math.max(0, Math.round(o.prep_minutes))} min</p>
                <p className="text-xs text-muted-foreground">{o.why}</p>
              </div>
              <Button size="sm" disabled={!!busy} onClick={() => logOption(o, i)}>{busy === `log-${i}` ? <Loader2 className="animate-spin" /> : <Plus />} Log this</Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => { setAnswer(null); setReason(null); }}>Change reason</Button>
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => finish("skipped")}>Skip this meal</Button>
          </div>
          <p className="text-xs text-muted-foreground">Nutrition values are estimates.</p>
        </div>
      )}
    </section>
  );
}
