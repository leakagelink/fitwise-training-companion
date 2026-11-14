import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, CloudOff, Loader2, Plus, SkipForward, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { todayISO } from "@/lib/fitness";
import { human } from "@/features/exercise-library/catalog";
import { exerciseMapQuery, useExerciseMap } from "@/features/exercise-library/use-exercises";
import { ExerciseImage } from "@/features/exercise-library/exercise-image";
import { WorkoutTimer } from "@/features/workout/workout-timer";
import { sessionQuery } from "@/features/workout/queries";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";

export const Route = createFileRoute("/_authenticated/session/$sessionId")({
  head: () => ({ meta: [{ title: "Active workout — Fitness AI" }, { name: "description", content: "Track your sets, preparation countdown and rest." }, { property: "og:title", content: "Active workout — Fitness AI" }, { property: "og:description", content: "Track your workout with preparation and rest timers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Session,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.fetchQuery(sessionQuery(params.sessionId)),
      context.queryClient.ensureQueryData(exerciseMapQuery),
    ]);
  },
  errorComponent: ScreenLoadError,
  notFoundComponent: ScreenNotFound,
});

type SetRow = { id: string; exercise_id: string; set_index: number; reps: number | null; weight_kg: number | null; completed: boolean; skipped: boolean };
const PENDING_KEY = "fa-pending-sets";

function readPending(): Record<string, Partial<SetRow>> {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "{}"); } catch { return {}; }
}

function Session() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: map } = useExerciseMap();
  const [sets, setSets] = useState<SetRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [restRequest, setRestRequest] = useState<{ seconds: number; token: number } | null>(null);
  const [offline, setOffline] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const q = useSuspenseQuery({ ...sessionQuery(sessionId), refetchOnMount: false });

  // Merge server rows with any unsynced local edits.
  useEffect(() => {
    if (!q.data) return;
    const pending = readPending();
    setSets(q.data.rows.map((r) => ({ ...r, ...(pending[r.id] ?? {}) }) as SetRow));
  }, [q.data]);

  const exerciseIds = useMemo(() => {
    const seen: string[] = [];
    for (const s of sets) if (!seen.includes(s.exercise_id)) seen.push(s.exercise_id);
    const pos = new Map(q.data?.order.map((o) => [o.exercise_id, o.position]) ?? []);
    return seen.sort((a, b) => (pos.get(a) ?? 99) - (pos.get(b) ?? 99));
  }, [sets, q.data]);

  const prev = useQuery({
    queryKey: ["prev-perf", sessionId, exerciseIds.join(",")],
    enabled: exerciseIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("workout_sets").select("exercise_id, reps, weight_kg, session_id, updated_at").in("exercise_id", exerciseIds).eq("completed", true).neq("session_id", sessionId).order("updated_at", { ascending: false }).limit(100);
      const m = new Map<string, string>();
      for (const r of data ?? []) if (!m.has(r.exercise_id)) m.set(r.exercise_id, `${r.reps ?? "–"} reps${r.weight_kg ? ` @ ${r.weight_kg} kg` : ""}`);
      return m;
    },
  });

  const flush = useCallback(async () => {
    const pending = readPending();
    const ids = Object.keys(pending);
    if (ids.length === 0) { setOffline(false); return; }
    for (const id of ids) {
      const { error } = await supabase.from("workout_sets").update({ ...pending[id], updated_at: new Date().toISOString() }).eq("id", id);
      if (error) { setOffline(true); return; }
      delete pending[id];
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    }
    setOffline(false);
  }, []);

  useEffect(() => {
    const t = setInterval(flush, 5000);
    window.addEventListener("online", flush);
    return () => { clearInterval(t); window.removeEventListener("online", flush); };
  }, [flush]);

  function patch(id: string, p: Partial<SetRow>) {
    setSets((cur) => cur.map((s) => (s.id === id ? { ...s, ...p } : s)));
    qc.setQueryData(sessionQuery(sessionId).queryKey, (current) => current ? { ...current, rows: current.rows.map((row) => row.id === id ? { ...row, ...p } : row) } : current);
    const pending = readPending();
    pending[id] = { ...(pending[id] ?? {}), ...p };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    void flush();
  }

  const exId = exerciseIds[idx];
  const ex = exId ? map?.get(exId) : undefined;
  const exSets = sets.filter((s) => s.exercise_id === exId).sort((a, b) => a.set_index - b.set_index);
  const restSec = q.data?.order.find((o) => o.exercise_id === exId)?.rest_sec ?? 60;
  const done = sets.filter((s) => s.completed || s.skipped).length;

  async function addSet() {
    if (!exId) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { toast.error("Please sign in again"); return; }
    const last = exSets.at(-1);
    const { data, error } = await supabase.from("workout_sets").insert({ session_id: sessionId, user_id: auth.user.id, exercise_id: exId, set_index: (last?.set_index ?? -1) + 1, reps: last?.reps ?? null, weight_kg: last?.weight_kg ?? null }).select("id, exercise_id, set_index, reps, weight_kg, completed, skipped").single();
    if (error) { toast.error("Couldn't add set — check your connection"); return; }
    setSets((c) => [...c, data as SetRow]);
    qc.setQueryData(sessionQuery(sessionId).queryKey, (current) => current ? { ...current, rows: [...current.rows, data as SetRow] } : current);
  }

  async function finish(status: "completed" | "abandoned") {
    setFinishing(true);
    await flush();
    if (readPending() && Object.keys(readPending()).length) { setFinishing(false); toast.error("Some sets haven't synced yet. Check your connection and try again."); return; }
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("workout_sessions").update({ status, finished_at: new Date().toISOString() }).eq("id", sessionId);
    if (error) { setFinishing(false); toast.error(error.message); return; }
    if (status === "completed" && auth.user) {
      const today = todayISO();
      const { data: row } = await supabase.from("daily_checkins").select("id").eq("date", today).maybeSingle();
      if (row) await supabase.from("daily_checkins").update({ workout_done: true }).eq("id", row.id);
      else await supabase.from("daily_checkins").insert({ user_id: auth.user.id, date: today, workout_done: true });
      toast.success(`Workout complete — ${done} sets logged 💪`);
    }
    qc.invalidateQueries();
    navigate({ to: "/workout" });
  }

  if (q.isLoading || !map) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!q.data?.session) return <p className="p-10 text-center">Workout not found.</p>;
  if (q.data.session.status !== "active") return <div className="p-10 text-center"><p>This workout is finished.</p><Link to="/workout" className="text-primary">Back to workouts</Link></div>;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background px-5 pb-32 pt-5">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" onClick={() => finish("abandoned")} aria-label="Exit workout" className="size-10 rounded-full"><X className="size-5" /></Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{q.data.session.title}</p>
          <p className="text-xs text-muted-foreground">Exercise {idx + 1} of {exerciseIds.length}</p>
        </div>
        <span className="grid size-10 place-items-center">{offline && <CloudOff className="size-5 text-energy" aria-label="Saved offline, will sync" />}</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div className="h-full bg-primary" animate={{ width: `${(done / Math.max(1, sets.length)) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={exId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mt-6">
          {ex && <div className="grid grid-cols-2 gap-2">
            <figure className={cn(!ex.peak && "col-span-2 mx-auto w-full max-w-xs")}><ExerciseImage file={ex.start} alt={`${ex.name} — start position`} /><figcaption className="mt-1 text-center text-xs text-muted-foreground">Start position</figcaption></figure>
            {ex.peak && <figure><ExerciseImage file={ex.peak} alt={`${ex.name} — peak position`} /><figcaption className="mt-1 text-center text-xs text-muted-foreground">Peak position</figcaption></figure>}
          </div>}
          <h1 className="mt-4 text-2xl font-bold">{ex?.name}</h1>
          <p className="text-sm text-muted-foreground">{ex?.primary.map(human).join(", ")}</p>
          {prev.data?.get(exId ?? "") && <p className="mt-1 text-xs text-muted-foreground">Last time: {prev.data.get(exId ?? "")}</p>}

          {exId && <WorkoutTimer key={exId} restRequest={restRequest?.token === idx ? restRequest : null} />}

          <div className="mt-5 space-y-2">
            <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-1 text-xs text-muted-foreground"><span>Set</span><span>Reps</span><span>kg</span><span /></div>
            {exSets.map((s, i) => (
              <div key={s.id} className={cn("grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-2xl p-2", s.completed ? "bg-accent" : s.skipped ? "bg-surface opacity-50" : "bg-surface")}>
                <span className="text-center font-semibold">{i + 1}</span>
                <input type="number" inputMode="numeric" min={0} max={500} value={s.reps ?? ""} onChange={(e) => patch(s.id, { reps: e.target.value === "" ? null : Math.min(500, Math.max(0, Number(e.target.value))) })} className="h-10 rounded-xl bg-background px-3" aria-label={`Set ${i + 1} reps`} />
                <input type="number" inputMode="decimal" step="0.5" min={0} max={1000} value={s.weight_kg ?? ""} onChange={(e) => patch(s.id, { weight_kg: e.target.value === "" ? null : Math.min(1000, Math.max(0, Number(e.target.value))) })} className="h-10 rounded-xl bg-background px-3" aria-label={`Set ${i + 1} weight`} />
                <Button variant={s.completed ? "default" : "secondary"} size="icon" onClick={() => { const c = !s.completed; patch(s.id, { completed: c, skipped: false }); if (c) setRestRequest({ seconds: restSec, token: idx }); }} aria-label={s.completed ? `Undo set ${i + 1}` : `Complete set ${i + 1}`} className="size-10 rounded-xl"><Check className="size-5" /></Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={addSet} className="flex-1 rounded-full"><Plus className="size-4" /> Add set</Button>
            <Button variant="secondary" onClick={() => { exSets.forEach((s) => !s.completed && patch(s.id, { skipped: true })); if (idx < exerciseIds.length - 1) setIdx(idx + 1); }} className="flex-1 rounded-full"><SkipForward className="size-4" /> Skip exercise</Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-lg gap-2">
          <Button variant="secondary" size="icon" className="size-12 rounded-full" disabled={idx === 0} onClick={() => setIdx(idx - 1)} aria-label="Previous exercise"><ChevronLeft /></Button>
          {idx < exerciseIds.length - 1 ? (
            <Button className="h-12 flex-1 rounded-full font-semibold" onClick={() => setIdx(idx + 1)}>Next exercise <ChevronRight className="size-4" /></Button>
          ) : (
            <Button className="h-12 flex-1 rounded-full font-semibold" disabled={finishing} onClick={() => finish("completed")}>{finishing && <Loader2 className="size-4 animate-spin" />} Finish workout</Button>
          )}
        </div>
      </div>
    </div>
  );
}
