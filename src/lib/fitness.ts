// Pure fitness calculations shared by client and server. All outputs are estimates.

export type Goal = "fat_loss" | "weight_gain" | "muscle_gain" | "maintenance";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: "Fat Loss",
  weight_gain: "Weight Gain",
  muscle_gain: "Muscle Gain",
  maintenance: "Maintenance",
};

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_CALORIE_ADJUST: Record<Goal, number> = {
  fat_loss: -0.2,
  weight_gain: 0.15,
  muscle_gain: 0.1,
  maintenance: 0,
};

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  fat_loss: 2.0,
  weight_gain: 1.8,
  muscle_gain: 2.0,
  maintenance: 1.6,
};

export interface TargetInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string | null;
  activityLevel: string | null;
  goal: string | null;
}

/** Mifflin–St Jeor BMR. Non-binary / unspecified uses the midpoint of the male and female offsets. */
export function bmr({ weightKg, heightCm, age, gender }: TargetInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const offset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  return base + offset;
}

export function dailyTargets(input: TargetInput) {
  const activity = (input.activityLevel as ActivityLevel) in ACTIVITY_MULTIPLIER
    ? (input.activityLevel as ActivityLevel)
    : "light";
  const goal = (input.goal as Goal) in GOAL_CALORIE_ADJUST ? (input.goal as Goal) : "maintenance";
  const tdee = bmr(input) * ACTIVITY_MULTIPLIER[activity];
  const calories = Math.round((tdee * (1 + GOAL_CALORIE_ADJUST[goal])) / 10) * 10;
  // Safety floor: never recommend below 1200 kcal.
  const safeCalories = Math.max(1200, calories);
  const proteinG = Math.round(input.weightKg * PROTEIN_G_PER_KG[goal]);
  const waterMl = Math.round((input.weightKg * 35) / 250) * 250;
  return { calories: safeCalories, proteinG, waterMl, tdee: Math.round(tdee) };
}

export const TRIAL_DAYS = 3;

export function trialStatus(trialStartedAt: string | Date, now: Date = new Date()) {
  const start = new Date(trialStartedAt).getTime();
  const end = start + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = end - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  return { active: msLeft > 0, daysLeft, endsAt: new Date(end) };
}

/** Consecutive days (ending today or yesterday) with a completed workout. */
export function workoutStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  const d = new Date(today + "T00:00:00Z");
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let streak = 0;
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
