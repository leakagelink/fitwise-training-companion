import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Library, Loader2, Play, RefreshCw, Repeat, Trash2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfile } from "@/hooks/use-profile";
import { allowedForUser, human, type Exercise } from "@/features/exercise-library/catalog";
import { useExerciseMap, useExercises } from "@/features/exercise-library/use-exercises";
import { ExerciseImage } from "@/features/exercise-library/exercise-image";
import { generateWorkoutPlan } from "@/features/workout/plan.functions";
import { startSession } from "@/features/workout/session";

export const Route = createFileRoute("/_authenticated/_app/workout")({
  head: () => ({ meta: [{ title: "Workout — Fitness AI" }, { name: "description", content: "Your AI workout plan." }, { property: "og:title", content: "Workout — Fitness AI" }, { property: "og:description", content: "Your AI workout plan." }] }),
  component: Workout,
});

type DayEx = { id: string; exercise_id: string; position: number; sets: number; reps: string; rest_sec: number; notes: string | null };

function Workout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const gen = useServerFn(generateWorkoutPlan);
  const { data: map } = useExerciseMap();
  const [generating, setGenerating] = useState(false);
  const [replacing, setReplacing] = useState<DayEx | null>(null);

  const plan = useQuery({
    queryKey: ["plan"],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_plans")
        .select("id, name, summary, workout_days(id, day_index, title, focus, workout_day_exercises(id, exercise_id, position, sets, reps, rest_sec, notes))")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await supabase.from("workout_sessions").select("id, title, status, started_at").order("started_at", { ascending: false }).limit(8)).data ?? [],
  });

  async function generate() {
    setGenerating(true);
    const r = await gen().catch(() => ({ status: "error" as const, message: "Request failed" }));
    setGenerating(false);
    if (r.status === "ok") { toast.success("Your new plan is ready"); qc.invalidateQueries({ queryKey: ["plan"] }); }
    else if (r.status === "locked") toast.error("Your free trial has ended. Premium plans are coming soon.");
    else toast.error(r.message);
  }

  async function updateEx(id: string, patch: Partial<DayEx>) {
    const { error } = await supabase.from("workout_day_exercises").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["plan"] });
  }

  async function start(day: { id: string; title: string; workout_day_exercises: DayEx[] }) {
    try {
      const items = [...day.workout_day_exercises].sort((a, b) => a.position - b.position);
      const id = await startSession(day.title, day.id, items);
      navigate({ to: "/session/$sessionId", params: { sessionId: id } });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not start"); }
  }

  const active = sessions.data?.find((s) => s.status === "active");
  const days = [...(plan.data?.workout_days ?? [])].sort((a, b) => a.day_index - b.day_index);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Workout</h1>
          {plan.data && <p className="mt-1 text-muted-foreground">{plan.data.name}</p>}
        </div>
        <Link to="/exercises" className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium"><Library className="size-4" /> Library</Link>
      </div>

      {active && (
        <Link to="/session/$sessionId" params={{ sessionId: active.id }} className="card-premium flex items-center justify-between border-primary p-4">
          <span><span className="text-xs font-semibold uppercase text-primary">In progress</span><span className="block font-semibold">{active.title}</span></span>
          <Play className="size-5 text-primary" />
        </Link>
      )}

      {plan.isLoading ? <Loader2 className="mx-auto size-6 animate-spin text-primary" /> : !plan.data ? (
        <div className="card-premium bg-hero p-8 text-center">
          <Wand2 className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Build your AI workout plan</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">We'll design a weekly program from 700+ exercises that match your goal, level and equipment.</p>
          <Button onClick={generate} disabled={generating} className="mt-6 h-11 rounded-full px-6 font-semibold">
            {generating ? <><Loader2 className="size-4 animate-spin" /> Designing your plan…</> : "Generate my plan"}
          </Button>
        </div>
      ) : (
        <>
          {plan.data.summary && <p className="text-sm text-muted-foreground">{plan.data.summary}</p>}
          {days.map((d) => (
            <section key={d.id} className="card-premium p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">Day {d.day_index + 1}</p>
                  <h2 className="text-lg font-semibold">{d.title}</h2>
                  {d.focus && <p className="text-sm text-muted-foreground">{d.focus}</p>}
                </div>
                <Button onClick={() => start(d)} className="rounded-full"><Play className="size-4" /> Start</Button>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {[...d.workout_day_exercises].sort((a, b) => a.position - b.position).map((x) => {
                  const ex = map?.get(x.exercise_id);
                  return (
                    <li key={x.id} className="flex items-center gap-3 py-3">
                      <Link to="/exercises/$exerciseId" params={{ exerciseId: x.exercise_id }} className="w-14 shrink-0">
                        {ex && <ExerciseImage file={ex.start} alt={ex.name} />}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{ex?.name ?? x.exercise_id}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <input aria-label="Sets" type="number" min={1} max={10} defaultValue={x.sets} onBlur={(e) => Number(e.target.value) !== x.sets && updateEx(x.id, { sets: Math.min(10, Math.max(1, Number(e.target.value))) })} className="w-10 rounded-md bg-surface px-1.5 py-0.5 text-foreground" />
                          sets ×
                          <input aria-label="Reps" defaultValue={x.reps} maxLength={20} onBlur={(e) => e.target.value !== x.reps && updateEx(x.id, { reps: e.target.value || "10" })} className="w-14 rounded-md bg-surface px-1.5 py-0.5 text-foreground" />
                          · rest {x.rest_sec}s · {human(ex?.primary[0])}
                        </div>
                      </div>
                      <button onClick={() => setReplacing(x)} aria-label="Replace exercise" className="grid size-9 place-items-center rounded-full hover:bg-secondary"><Repeat className="size-4" /></button>
                      <button onClick={async () => { await supabase.from("workout_day_exercises").delete().eq("id", x.id); qc.invalidateQueries({ queryKey: ["plan"] }); }} aria-label="Remove exercise" className="grid size-9 place-items-center rounded-full hover:bg-secondary"><Trash2 className="size-4" /></button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <Button variant="secondary" onClick={generate} disabled={generating} className="w-full rounded-full">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Generate a new plan
          </Button>
        </>
      )}

      {sessions.data && sessions.data.some((s) => s.status === "completed") && (
        <section>
          <h2 className="text-lg font-semibold">Recent workouts</h2>
          <ul className="mt-3 space-y-2">
            {sessions.data.filter((s) => s.status === "completed").map((s) => (
              <li key={s.id} className="flex justify-between rounded-2xl bg-surface px-4 py-3 text-sm"><span>{s.title}</span><span className="text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</span></li>
            ))}
          </ul>
        </section>
      )}

      <ReplaceDialog current={replacing} onClose={() => setReplacing(null)} onPick={async (id) => { if (replacing) await updateEx(replacing.id, { exercise_id: id }); setReplacing(null); }} />
    </div>
  );
}

function ReplaceDialog({ current, onClose, onPick }: { current: DayEx | null; onClose: () => void; onPick: (id: string) => void }) {
  const { data: all } = useExercises();
  const { data: p } = useProfile();
  const cur = all?.find((e) => e.id === current?.exercise_id);
  const options: Exercise[] = cur && all && p
    ? all.filter((e) => e.id !== cur.id && e.category === cur.category && e.primary.some((m) => cur.primary.includes(m)) && allowedForUser(e, p.workout_location, p.equipment)).slice(0, 30)
    : [];
  return (
    <Dialog open={!!current} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Replace {cur?.name}</DialogTitle></DialogHeader>
        {options.length === 0 ? <p className="text-sm text-muted-foreground">No alternatives for your equipment.</p> : (
          <ul className="space-y-1">
            {options.map((o) => (
              <li key={o.id}>
                <button onClick={() => onPick(o.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-secondary">
                  <ExerciseImage file={o.start} alt={o.name} className="w-12" />
                  <span><span className="block text-sm font-medium">{o.name}</span><span className="text-xs text-muted-foreground">{human(o.equipment)} · {human(o.difficulty)}</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
