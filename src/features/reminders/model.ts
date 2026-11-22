import { z } from "zod";

export const FOLLOWUP_MEALS = ["breakfast", "lunch", "dinner"] as const;
export type FollowupMeal = (typeof FOLLOWUP_MEALS)[number];

/** A meal counts as missed this long after its reminder time with nothing logged. */
export const MISSED_GRACE_MINUTES = 120;

export const MISSED_REASONS = ["No time", "Not hungry", "Food not available", "Was travelling", "Ate something else", "Other"] as const;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

export const reminderSettingsSchema = z.object({
  breakfast_on: z.boolean(), breakfast_at: hhmm,
  lunch_on: z.boolean(), lunch_at: hhmm,
  dinner_on: z.boolean(), dinner_at: hhmm,
  water_on: z.boolean(), water_start: hhmm, water_end: hhmm, water_every_hours: z.number().int().min(1).max(6),
  workout_on: z.boolean(), workout_at: hhmm,
  missed_meal_followup: z.boolean(),
}).refine((s) => toMinutes(s.water_end) > toMinutes(s.water_start), { message: "Water end time must be after the start time", path: ["water_end"] });
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;

export const DEFAULT_REMINDERS: ReminderSettings = {
  breakfast_on: true, breakfast_at: "08:30",
  lunch_on: true, lunch_at: "13:30",
  dinner_on: true, dinner_at: "20:30",
  water_on: true, water_start: "09:00", water_end: "21:00", water_every_hours: 2,
  workout_on: true, workout_at: "18:00",
  missed_meal_followup: true,
};

/** Database `time` values come back as HH:MM:SS. */
export function shortTime(value: string) {
  return value.slice(0, 5);
}

export function toMinutes(time: string) {
  const [h = 0, m = 0] = shortTime(time).split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Water reminder times from start to end (inclusive), every N hours. */
export function waterTimes(start: string, end: string, everyHours: number) {
  const times: string[] = [];
  for (let t = toMinutes(start); t <= toMinutes(end); t += everyHours * 60) times.push(fromMinutes(t));
  return times;
}

export type ScheduledReminder = { id: number; title: string; body: string; hour: number; minute: number; path: string };

/** Native notification ids live in 9100-9199 so they can be replaced as one block. */
export const REMINDER_ID_BASE = 9100;

const MEAL_COPY: Record<FollowupMeal, { title: string; body: string }> = {
  breakfast: { title: "Breakfast time", body: "Have your breakfast and log it to stay on track." },
  lunch: { title: "Lunch time", body: "Time for lunch — log it in your diary." },
  dinner: { title: "Dinner time", body: "Have a light, balanced dinner and log it." },
};

export function reminderSchedule(s: ReminderSettings): ScheduledReminder[] {
  const items: ScheduledReminder[] = [];
  const at = (id: number, time: string, title: string, body: string, path: string) => {
    const [hour = 0, minute = 0] = shortTime(time).split(":").map(Number);
    items.push({ id: REMINDER_ID_BASE + id, title, body, hour, minute, path });
  };
  FOLLOWUP_MEALS.forEach((meal, i) => {
    if (s[`${meal}_on`]) at(i, s[`${meal}_at`], MEAL_COPY[meal].title, MEAL_COPY[meal].body, "/nutrition");
  });
  if (s.workout_on) at(3, s.workout_at, "Workout time", "Your workout is waiting. Even 20 minutes counts!", "/workout");
  if (s.water_on) waterTimes(s.water_start, s.water_end, s.water_every_hours).forEach((time, i) => at(10 + i, time, "Drink water", "Time for a glass of water.", "/home"));
  return items;
}

/**
 * Meals still open for a follow-up today: reminder on, follow-up on, grace period over,
 * nothing logged for that meal type and no follow-up answered yet.
 */
export function missedMeals(s: ReminderSettings, now: Date, loggedTypes: Iterable<string>, answered: Iterable<string>): FollowupMeal[] {
  if (!s.missed_meal_followup) return [];
  const logged = new Set([...loggedTypes].map((t) => t.trim().toLowerCase()));
  const done = new Set(answered);
  const minutes = now.getHours() * 60 + now.getMinutes();
  return FOLLOWUP_MEALS.filter((meal) => s[`${meal}_on`] && minutes >= toMinutes(s[`${meal}_at`]) + MISSED_GRACE_MINUTES && !logged.has(meal) && !done.has(meal));
}
