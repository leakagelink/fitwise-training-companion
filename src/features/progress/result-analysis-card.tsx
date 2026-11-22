import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Droplets, Dumbbell, Loader2, Moon, Sparkles, TrendingDown, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ATTENTION_SCORE, todayISO, type ResultAnalysis, type ResultArea } from "@/lib/fitness";
import { analyzeResults, type CoachAnalysis } from "./analysis.functions";
import { resultAnalysisQuery } from "./queries";

const AREAS: Record<ResultArea, { label: string; icon: typeof Utensils; color: string }> = {
  diet: { label: "Diet adherence", icon: Utensils, color: "var(--energy)" },
  workout: { label: "Workout adherence", icon: Dumbbell, color: "var(--primary)" },
  water: { label: "Water intake", icon: Droplets, color: "var(--water)" },
  sleep: { label: "Sleep", icon: Moon, color: "var(--chart-2)" },
};

function detail(area: ResultArea, a: ResultAnalysis) {
  if (area === "diet") return a.diet.trackedDays ? `${a.diet.onTrackDays} of ${a.diet.trackedDays} tracked days on track` : "Log meals or tap “Diet followed” on Home";
  if (area === "workout") return `${a.workout.done} of ${a.workout.planned} planned workouts`;
  if (area === "water") return a.water.avgMl === null ? "Log water on Home or here" : `Avg ${(a.water.avgMl / 1000).toFixed(1)} L of ${(a.water.targetMl / 1000).toFixed(1)} L · ${a.water.trackedDays} days logged`;
  return a.sleep.avgHours === null ? "Add sleep in today's check-in" : `Avg ${a.sleep.avgHours} h of 7 h · ${a.sleep.trackedDays} days logged`;
}

export function weightMessage(a: ResultAnalysis) {
  const kg = a.weight.changeKg === null ? "" : ` (${a.weight.changeKg > 0 ? "+" : ""}${a.weight.changeKg} kg in ${a.weight.weeks} weeks)`;
  switch (a.weight.status) {
    case "on_track": return `Your weight is moving toward your goal${kg}. Keep going!`;
    case "stalled": return `Your weight hasn't moved much${kg}. Let's find out why.`;
    case "wrong_direction": return `Your weight is moving away from your goal${kg}. Let's find out why.`;
    default: return "Log your weight at least once a week to check whether results are coming.";
  }
}

/** Diet, workout, water and sleep adherence for the last 14 days with an on-demand coach review. */
export function ResultAnalysisCard() {
  const today = todayISO();
  const q = useQuery(resultAnalysisQuery(today));
  const analyze = useServerFn(analyzeResults);
  const [busy, setBusy] = useState(false);
  const [coach, setCoach] = useState<CoachAnalysis | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const a = q.data;

  async function run() {
    setBusy(true); setNote(null);
    try {
      const r = await analyze({ data: { date: today } });
      if (r.status === "ok") setCoach(r.analysis);
      else setNote(r.status === "locked" ? "Personal coach access is not active. Contact the administrator for plan access." : r.message);
    } catch {
      setNote("Could not reach your coach. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="result-analysis" aria-label="Result analysis" className="card-premium space-y-4 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Result analysis · last 14 days</p>
        <h2 className="mt-1 font-semibold">{a ? weightMessage(a) : "Checking your recent habits…"}</h2>
      </div>
      {q.isError && <p className="text-sm text-destructive">Could not load your analysis. Please try again later.</p>}
      {a && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(AREAS) as ResultArea[]).map((area) => {
            const { label, icon: Icon, color } = AREAS[area];
            const s = a[area].score;
            return (
              <div key={area} className="space-y-1.5 rounded-xl bg-secondary/60 p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium"><Icon className="size-4" style={{ color }} />{label}</span>
                  <span className={s !== null && s < ATTENTION_SCORE ? "font-bold text-destructive" : "font-bold"}>{s === null ? "—" : `${s}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={s ?? undefined}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${s ?? 0}%`, background: color }} />
                </div>
                <p className="text-xs text-muted-foreground">{s === null ? `Not enough data · ${detail(area, a)}` : detail(area, a)}</p>
              </div>
            );
          })}
        </div>
      )}

      {coach ? (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="flex items-start gap-2 font-medium"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />{coach.headline}</p>
          <ul className="space-y-1.5 text-sm">
            {coach.findings.map((f, i) => (
              <li key={`${f.area}-${i}`}><span className="font-semibold">{AREAS[f.area].label}:</span> <span className="text-muted-foreground">{f.insight}</span></li>
            ))}
          </ul>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Improve this week</p>
          <ol className="space-y-2 text-sm">
            {coach.suggestions.map((s, i) => (
              <li key={`${s.title}-${i}`} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <span><span className="font-medium">{s.title}</span><span className="block text-muted-foreground">{s.detail}</span></span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Suggestions are estimates, not medical advice. Your analysis refreshes once a day.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Button onClick={run} disabled={busy || !a}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Analyze my results</Button>
          {busy && <p className="text-sm text-muted-foreground">Your coach is reviewing your diet, workouts, water and sleep…</p>}
          {note && <p role="alert" className="text-sm text-destructive">{note}</p>}
        </div>
      )}
    </section>
  );
}

/** Home alert shown only when weight has stalled or moved away from the goal. */
export function ResultAlert() {
  const q = useQuery(resultAnalysisQuery(todayISO()));
  if (!q.data?.resultsSlowing) return null;
  const weakest = q.data.needsAttention[0];
  return (
    <Link to="/progress" hash="result-analysis" className="card-premium flex items-center gap-3 border-l-4 border-l-destructive p-4">
      <TrendingDown className="size-5 shrink-0 text-destructive" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Results slowing down?</span>
        <span className="block text-sm text-muted-foreground">{weightMessage(q.data)}{weakest ? ` Weakest area: ${AREAS[weakest].label.toLowerCase()}.` : ""}</span>
      </span>
      <span className="text-sm font-semibold text-primary">See why</span>
    </Link>
  );
}
