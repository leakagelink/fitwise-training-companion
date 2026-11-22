import { describe, expect, it } from "vitest";
import { resultAnalysis, weightTrend, type ResultInput } from "@/lib/fitness";

const today = "2026-11-22";
const base: ResultInput = { today, goal: "fat_loss", caloriesTarget: 2000, waterTargetMl: 3000, workoutsPerWeek: 4, checkins: [], meals: [], workoutDates: [], weights: [] };
const day = (n: number) => { const d = new Date(today + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const checkin = (n: number, o: Partial<ResultInput["checkins"][number]> = {}) => ({ date: day(n), diet_followed: false, water_ml: 0, sleep_hours: null, ...o });

describe("result analysis", () => {
  it("diet day is on track when marked followed or calories are 80–115% of target", () => {
    const r = resultAnalysis({ ...base, checkins: [checkin(0, { diet_followed: true })], meals: [{ date: day(1), calories: 1600 }, { date: day(2), calories: 2300 }, { date: day(3), calories: 2400 }] });
    expect(r.diet).toEqual({ score: 75, onTrackDays: 3, trackedDays: 4 });
  });
  it("diet needs at least 3 tracked days", () => {
    expect(resultAnalysis({ ...base, meals: [{ date: day(0), calories: 2000 }, { date: day(1), calories: 2000 }] }).diet.score).toBeNull();
  });
  it("workout adherence compares distinct workout days with the planned weekly frequency over 14 days", () => {
    const r = resultAnalysis({ ...base, workoutDates: [day(0), day(0), day(2), day(4), day(13), day(14)] });
    expect(r.workout).toEqual({ score: 38, done: 3, planned: 8 });
  });
  it("defaults to 3 workouts a week when frequency is unknown", () => {
    expect(resultAnalysis({ ...base, workoutsPerWeek: null }).workout.planned).toBe(6);
  });
  it("water and sleep average logged days against 3 L target and 7 hours", () => {
    const r = resultAnalysis({ ...base, checkins: [checkin(0, { water_ml: 1500, sleep_hours: 6 }), checkin(1, { water_ml: 3000, sleep_hours: 5 }), checkin(2, { water_ml: 1500, sleep_hours: 7 })] });
    expect(r.water.score).toBe(67);
    expect(r.sleep.score).toBe(86);
    expect(r.needsAttention).toEqual(["workout", "water"]);
  });
  it("ignores days outside the 14-day window", () => {
    const r = resultAnalysis({ ...base, checkins: [checkin(14, { water_ml: 3000 }), checkin(20, { water_ml: 3000 }), checkin(30, { water_ml: 3000 })] });
    expect(r.water.trackedDays).toBe(0);
  });
});

describe("weight trend", () => {
  it("fat loss stalls when weight barely moves", () => {
    expect(weightTrend("fat_loss", [{ logged_on: day(14), weight_kg: 80 }, { logged_on: day(0), weight_kg: 80.1 }], today).status).toBe("stalled");
  });
  it("fat loss on track when losing at least 0.1 kg a week", () => {
    expect(weightTrend("fat_loss", [{ logged_on: day(14), weight_kg: 80 }, { logged_on: day(0), weight_kg: 79.4 }], today)).toEqual({ status: "on_track", changeKg: -0.6, weeks: 2 });
  });
  it("muscle gain losing weight is the wrong direction", () => {
    expect(weightTrend("muscle_gain", [{ logged_on: day(14), weight_kg: 70 }, { logged_on: day(0), weight_kg: 69 }], today).status).toBe("wrong_direction");
  });
  it("needs logs at least 7 days apart", () => {
    expect(weightTrend("fat_loss", [{ logged_on: day(5), weight_kg: 80 }, { logged_on: day(0), weight_kg: 81 }], today).status).toBe("not_enough_data");
  });
  it("slowing results are flagged", () => {
    expect(resultAnalysis({ ...base, weights: [{ logged_on: day(10), weight_kg: 80 }, { logged_on: day(0), weight_kg: 81 }] }).resultsSlowing).toBe(true);
  });
});
