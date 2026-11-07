import { describe, expect, it } from "vitest";
import { dailyTargets, trialStatus, workoutStreak } from "@/lib/fitness";

const base = { weightKg: 80, heightCm: 180, age: 30, gender: "male", activityLevel: "moderate" };

describe("free trial", () => {
  it("lasts three days", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    expect(trialStatus(start, new Date("2026-01-03T23:00:00Z")).active).toBe(true);
    expect(trialStatus(start, new Date("2026-01-04T00:00:01Z")).active).toBe(false);
  });
});

describe("daily targets", () => {
  it("fat loss is a 20% deficit from maintenance", () => {
    const maint = dailyTargets({ ...base, goal: "maintenance" });
    const cut = dailyTargets({ ...base, goal: "fat_loss" });
    expect(cut.calories).toBeCloseTo(maint.calories * 0.8, -1);
  });
  it("never goes below 1200 kcal", () => {
    const t = dailyTargets({ weightKg: 40, heightCm: 145, age: 70, gender: "female", activityLevel: "sedentary", goal: "fat_loss" });
    expect(t.calories).toBe(1200);
  });
  it("muscle gain protein is 2 g per kg", () => {
    expect(dailyTargets({ ...base, goal: "muscle_gain" }).proteinG).toBe(160);
  });
});

describe("workout streak", () => {
  it("counts consecutive days ending today", () => {
    expect(workoutStreak(["2026-01-03", "2026-01-02", "2026-01-01"], "2026-01-03")).toBe(3);
  });
  it("still counts when today is not done yet", () => {
    expect(workoutStreak(["2026-01-02", "2026-01-01"], "2026-01-03")).toBe(2);
  });
});
