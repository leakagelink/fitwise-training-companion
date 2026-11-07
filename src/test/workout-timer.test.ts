import { describe, expect, it } from "vitest";
import { clockAt, countdown, toggleClock } from "@/features/workout/timer";

describe("workout clock", () => {
  it("starts with five seconds and automatically begins the set", () => {
    const clock = countdown("ready", 5, 1000);
    expect(clockAt(clock, 3000).seconds).toBe(3);
    expect(clockAt(clock, 6000)).toMatchObject({ mode: "active", seconds: 0 });
  });
  it("rest counts down and accounts for time spent in another tab", () => {
    const clock = countdown("rest", 60, 1000);
    expect(clockAt(clock, 31000).seconds).toBe(30);
    expect(clockAt(clock, 64000)).toMatchObject({ mode: "active", seconds: 3 });
  });
  it("pause freezes the countdown and resume continues remaining time", () => {
    const paused = toggleClock(countdown("ready", 5, 1000), 3000);
    expect(clockAt(paused, 20000).seconds).toBe(3);
    const resumed = toggleClock(paused, 20000);
    expect(clockAt(resumed, 21000).seconds).toBe(2);
  });
});