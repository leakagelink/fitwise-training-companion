import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clockAt, countdown, toggleClock, type WorkoutClock } from "./timer";

export function WorkoutTimer({ restRequest }: { restRequest: { seconds: number; token: number } | null }) {
  const [clock, setClock] = useState<WorkoutClock>(() => countdown("ready", 5, Date.now()));
  useEffect(() => {
    if (restRequest) setClock(countdown("rest", restRequest.seconds, Date.now()));
  }, [restRequest]);
  useEffect(() => {
    const tick = setInterval(() => setClock((current) => clockAt(current, Date.now())), 200);
    return () => clearInterval(tick);
  }, []);

  const label = clock.mode === "ready" ? "Get ready" : clock.mode === "rest" ? "Rest" : "Set in progress";
  return (
    <section aria-label="Workout timer" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Timer className="size-4" />{label}{clock.paused && " · Paused"}</p>
        <p role="timer" aria-label={label} className="mt-1 text-3xl font-bold tabular-nums text-primary">{Math.floor(clock.seconds / 60)}:{String(clock.seconds % 60).padStart(2, "0")}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="secondary" size="icon" title={clock.paused ? "Resume timer" : "Pause timer"} aria-label={clock.paused ? "Resume timer" : "Pause timer"} onClick={() => setClock((current) => toggleClock(current, Date.now()))}>{clock.paused ? <Play /> : <Pause />}</Button>
        <Button variant="secondary" size="icon" title="Restart countdown" aria-label="Restart countdown" onClick={() => setClock(countdown("ready", 5, Date.now()))}><RotateCcw /></Button>
        {clock.mode === "rest" && <>
          <Button variant="secondary" size="sm" onClick={() => setClock((current) => ({ ...clockAt(current, Date.now()), seconds: clockAt(current, Date.now()).seconds + 15 }))}>+15s</Button>
          <Button variant="secondary" size="icon" title="Skip rest" aria-label="Skip rest" onClick={() => setClock({ mode: "active", seconds: 0, anchor: Date.now(), paused: false })}><SkipForward /></Button>
        </>}
      </div>
    </section>
  );
}