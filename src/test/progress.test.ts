import { describe, expect, it } from "vitest";
import { weeklyWorkoutCounts, weightChange } from "@/lib/fitness";

describe("progress", () => {
  it("counts workouts per Monday week", () => {
    // 2026-11-14 is Saturday; week starts Monday 2026-11-09
    const r = weeklyWorkoutCounts(["2026-11-09", "2026-11-14", "2026-11-08", "2026-10-01"], "2026-11-14", 2);
    expect(r).toEqual([{ weekStart: "2026-11-02", count: 1 }, { weekStart: "2026-11-09", count: 2 }]);
  });
  it("weight change uses earliest and latest logs", () => {
    expect(weightChange([{ logged_on: "2026-11-10", weight_kg: 78.4 }, { logged_on: "2026-11-01", weight_kg: 80 }])).toBe(-1.6);
    expect(weightChange([{ logged_on: "2026-11-01", weight_kg: 80 }])).toBeNull();
  });
});
