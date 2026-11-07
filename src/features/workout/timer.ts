export type WorkoutClock = {
  mode: "ready" | "active" | "rest";
  seconds: number;
  anchor: number;
  paused: boolean;
};

export function countdown(mode: "ready" | "rest", seconds: number, now: number): WorkoutClock {
  return { mode, seconds, anchor: now, paused: false };
}

export function clockAt(clock: WorkoutClock, now: number): WorkoutClock {
  if (clock.paused) return clock;
  const elapsed = Math.max(0, Math.floor((now - clock.anchor) / 1000));
  if (clock.mode === "active") return { ...clock, seconds: clock.seconds + elapsed, anchor: clock.anchor + elapsed * 1000 };
  if (elapsed >= clock.seconds) return { mode: "active", seconds: elapsed - clock.seconds, anchor: clock.anchor + elapsed * 1000, paused: false };
  return { ...clock, seconds: clock.seconds - elapsed, anchor: clock.anchor + elapsed * 1000 };
}

export function toggleClock(clock: WorkoutClock, now: number): WorkoutClock {
  const current = clockAt(clock, now);
  return { ...current, anchor: now, paused: !current.paused };
}