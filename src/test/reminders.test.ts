import { describe, expect, it } from "vitest";
import { DEFAULT_REMINDERS, missedMeals, reminderSchedule, reminderSettingsSchema, waterTimes } from "@/features/reminders/model";

const at = (h: number, m = 0) => new Date(2026, 10, 23, h, m);

describe("daily reminders", () => {
  it("schedules breakfast, lunch, dinner and workout at the chosen times", () => {
    const items = reminderSchedule(DEFAULT_REMINDERS);
    const byTitle = Object.fromEntries(items.map((i) => [i.title, `${i.hour}:${i.minute}`]));
    expect(byTitle["Breakfast time"]).toBe("8:30");
    expect(byTitle["Lunch time"]).toBe("13:30");
    expect(byTitle["Dinner time"]).toBe("20:30");
    expect(byTitle["Workout time"]).toBe("18:0");
  });

  it("repeats the water reminder every N hours between start and end", () => {
    expect(waterTimes("09:00", "21:00", 2)).toEqual(["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"]);
    expect(reminderSchedule(DEFAULT_REMINDERS).filter((i) => i.title === "Drink water")).toHaveLength(7);
  });

  it("drops a reminder that is switched off", () => {
    const items = reminderSchedule({ ...DEFAULT_REMINDERS, lunch_on: false, water_on: false });
    expect(items.map((i) => i.title)).toEqual(["Breakfast time", "Dinner time", "Workout time"]);
  });

  it("keeps every notification id inside the app's reminder block", () => {
    const ids = reminderSchedule({ ...DEFAULT_REMINDERS, water_start: "00:00", water_end: "23:59", water_every_hours: 1 }).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.max(...ids)).toBeLessThan(9200);
  });

  it("rejects a water end time before the start time", () => {
    expect(reminderSettingsSchema.safeParse({ ...DEFAULT_REMINDERS, water_start: "20:00", water_end: "09:00" }).success).toBe(false);
  });
});

describe("missed-meal check-in", () => {
  it("asks about lunch 2 hours after the lunch reminder when nothing is logged", () => {
    expect(missedMeals(DEFAULT_REMINDERS, at(15, 29), ["breakfast"], [])).toEqual([]);
    expect(missedMeals(DEFAULT_REMINDERS, at(15, 30), ["breakfast"], [])).toEqual(["lunch"]);
  });

  it("does not ask when the meal was logged or already answered", () => {
    expect(missedMeals(DEFAULT_REMINDERS, at(23), ["Breakfast", "lunch"], ["dinner"])).toEqual([]);
  });

  it("does not ask when the check-in or that meal's reminder is off", () => {
    expect(missedMeals({ ...DEFAULT_REMINDERS, missed_meal_followup: false }, at(23), [], [])).toEqual([]);
    expect(missedMeals({ ...DEFAULT_REMINDERS, breakfast_on: false }, at(12), [], [])).toEqual([]);
  });
});
