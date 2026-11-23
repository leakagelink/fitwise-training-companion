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

/** Finished workouts per Monday-start week, oldest first, for the last `weeks` weeks ending with today's week. */
export function weeklyWorkoutCounts(dates: string[], today: string, weeks = 8) {
  const t = new Date(today + "T00:00:00Z");
  const monday = new Date(t);
  monday.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  const out: { weekStart: string; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const s = new Date(monday);
    s.setUTCDate(monday.getUTCDate() - i * 7);
    const e = new Date(s);
    e.setUTCDate(s.getUTCDate() + 7);
    const a = s.toISOString().slice(0, 10), b = e.toISOString().slice(0, 10);
    out.push({ weekStart: a, count: dates.filter((d) => d >= a && d < b).length });
  }
  return out;
}

/** Change from the earliest to the latest logged weight (kg, 1 decimal); null with fewer than two logs. */
export function weightChange(logs: { logged_on: string; weight_kg: number }[]): number | null {
  if (logs.length < 2) return null;
  const s = [...logs].sort((x, y) => x.logged_on.localeCompare(y.logged_on));
  return Math.round((Number(s[s.length - 1]!.weight_kg) - Number(s[0]!.weight_kg)) * 10) / 10;
}

// ---------- Result analysis (adherence scores over a recent window) ----------

export const RESULT_WINDOW_DAYS = 14;
export const SLEEP_TARGET_HOURS = 7;
/** A score needs at least this many tracked days; otherwise it shows "not enough data". */
export const MIN_TRACKED_DAYS = 3;
/** Areas scoring below this are flagged for improvement. */
export const ATTENTION_SCORE = 70;
export const DEFAULT_WORKOUTS_PER_WEEK = 3;

export type ResultArea = "diet" | "workout" | "water" | "sleep";
export type WeightTrend = "on_track" | "stalled" | "wrong_direction" | "not_enough_data";

export interface ResultInput {
  today: string;
  goal: string | null;
  caloriesTarget: number;
  waterTargetMl: number;
  workoutsPerWeek: number | null;
  checkins: { date: string; diet_followed: boolean; water_ml: number; sleep_hours: number | null }[];
  meals: { date: string; calories: number }[];
  workoutDates: string[];
  weights: { logged_on: string; weight_kg: number }[];
}

export function addDaysISO(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const pct = (v: number) => Math.max(0, Math.min(100, Math.round(v * 100)));
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Weight direction vs goal using the first and last log of the last 28 days (needs ≥ 7 days between them). */
export function weightTrend(goal: string | null, weights: ResultInput["weights"], today: string) {
  const from = addDaysISO(today, -27);
  const s = weights.filter((w) => w.logged_on >= from && w.logged_on <= today).sort((a, b) => a.logged_on.localeCompare(b.logged_on));
  const first = s[0], last = s[s.length - 1];
  if (!first || !last) return { status: "not_enough_data" as WeightTrend, changeKg: null, weeks: 0 };
  const days = (Date.parse(last.logged_on) - Date.parse(first.logged_on)) / 864e5;
  if (days < 7) return { status: "not_enough_data" as WeightTrend, changeKg: null, weeks: 0 };
  const changeKg = Math.round((Number(last.weight_kg) - Number(first.weight_kg)) * 10) / 10;
  const weeks = days / 7;
  const rate = changeKg / weeks;
  let status: WeightTrend;
  if (goal === "fat_loss") status = rate <= -0.1 ? "on_track" : rate > 0.1 ? "wrong_direction" : "stalled";
  else if (goal === "weight_gain" || goal === "muscle_gain") status = rate >= 0.1 ? "on_track" : rate < -0.1 ? "wrong_direction" : "stalled";
  else status = Math.abs(changeKg) <= 1 ? "on_track" : "wrong_direction";
  return { status, changeKg, weeks: Math.round(weeks * 10) / 10 };
}

/**
 * Adherence over the last RESULT_WINDOW_DAYS days (today included). Scores are 0–100 or null when
 * fewer than MIN_TRACKED_DAYS days were tracked.
 * - Diet: a tracked day is one with logged meals or "diet followed"; on track = "diet followed" or logged calories within 80–115% of target.
 * - Workout: distinct workout days vs the planned weekly frequency (default 3) for the window.
 * - Water: average logged water vs target. Sleep: average sleep vs 7 hours.
 */
export function resultAnalysis(input: ResultInput, windowDays = RESULT_WINDOW_DAYS) {
  const from = addDaysISO(input.today, -(windowDays - 1));
  const inWindow = (d: string) => d >= from && d <= input.today;
  const checkins = input.checkins.filter((c) => inWindow(c.date));

  const calories = new Map<string, number>();
  for (const m of input.meals) if (inWindow(m.date)) calories.set(m.date, (calories.get(m.date) ?? 0) + Math.max(0, m.calories));
  const followed = new Set(checkins.filter((c) => c.diet_followed).map((c) => c.date));
  const dietDays = new Set([...calories.keys(), ...followed]);
  let onTrack = 0;
  for (const d of dietDays) {
    const kcal = calories.get(d);
    if (followed.has(d) || (kcal !== undefined && kcal >= input.caloriesTarget * 0.8 && kcal <= input.caloriesTarget * 1.15)) onTrack++;
  }
  const diet = { score: dietDays.size >= MIN_TRACKED_DAYS ? pct(onTrack / dietDays.size) : null, onTrackDays: onTrack, trackedDays: dietDays.size };

  const perWeek = input.workoutsPerWeek && input.workoutsPerWeek > 0 ? input.workoutsPerWeek : DEFAULT_WORKOUTS_PER_WEEK;
  const planned = Math.max(1, Math.round((perWeek * windowDays) / 7));
  const done = new Set(input.workoutDates.filter(inWindow)).size;
  const workout = { score: pct(done / planned), done, planned };

  const waterDays = checkins.filter((c) => c.water_ml > 0).map((c) => c.water_ml);
  const avgWater = waterDays.length ? Math.round(avg(waterDays)) : null;
  const water = { score: waterDays.length >= MIN_TRACKED_DAYS && avgWater !== null ? pct(avgWater / input.waterTargetMl) : null, avgMl: avgWater, targetMl: input.waterTargetMl, trackedDays: waterDays.length };

  const sleepDays = checkins.flatMap((c) => (c.sleep_hours === null ? [] : [Number(c.sleep_hours)]));
  const avgSleep = sleepDays.length ? Math.round(avg(sleepDays) * 10) / 10 : null;
  const sleep = { score: sleepDays.length >= MIN_TRACKED_DAYS && avgSleep !== null ? pct(avgSleep / SLEEP_TARGET_HOURS) : null, avgHours: avgSleep, trackedDays: sleepDays.length };

  const scores: Record<ResultArea, number | null> = { diet: diet.score, workout: workout.score, water: water.score, sleep: sleep.score };
  const needsAttention = (Object.keys(scores) as ResultArea[])
    .filter((a) => scores[a] !== null && scores[a]! < ATTENTION_SCORE)
    .sort((a, b) => scores[a]! - scores[b]!);
  const weight = weightTrend(input.goal, input.weights, input.today);
  return { windowDays, from, diet, workout, water, sleep, weight, needsAttention, resultsSlowing: weight.status === "stalled" || weight.status === "wrong_direction" };
}
export type ResultAnalysis = ReturnType<typeof resultAnalysis>;

// ---------- Meal scoring (food scanner) ----------

export type MealVerdict = "good" | "moderate" | "avoid_frequently";

/**
 * Scores one meal 0–100. Protein: share of calories from protein vs 30%. Health: fiber (7 g per 500 kcal)
 * and fat share (≤ 35% ideal), half each. Nutrition: 40% protein + 40% health + 20% portion fit
 * (portion fits when ≤ 120% of a third of the daily calorie target). Verdict: ≥ 70 good, ≥ 45 moderate.
 */
export function scoreMeal(n: { calories: number; protein: number; fat: number; fiber: number }, dailyCalories: number, remainingCalories: number) {
  const cal = Math.max(1, n.calories);
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const protein = clamp(((n.protein * 4) / cal / 0.3) * 100);
  const fiberPart = Math.min(1, n.fiber / ((cal / 500) * 7));
  const fatShare = (n.fat * 9) / cal;
  const fatPart = fatShare <= 0.35 ? 1 : Math.max(0, 1 - (fatShare - 0.35) / 0.3);
  const health = clamp(100 * (0.5 * fiberPart + 0.5 * fatPart));
  const mealTarget = dailyCalories / 3;
  const ratio = n.calories / mealTarget;
  const portion = ratio <= 1.2 ? 100 : clamp(100 - (ratio - 1.2) * 100);
  const nutrition = clamp(0.4 * protein + 0.4 * health + 0.2 * portion);
  const verdict: MealVerdict = nutrition >= 70 ? "good" : nutrition >= 45 ? "moderate" : "avoid_frequently";
  return { nutrition, protein, health, verdict, highProtein: protein >= 70, fitsToday: n.calories <= Math.max(0, remainingCalories) };
}
export type MealScore = ReturnType<typeof scoreMeal>;

/** Weekly nutrition report from per-day totals (calories/protein logged, planned vs missed meals). */
export function weeklyNutritionReport(days: { date: string; calories: number; protein: number; logged: number; missed: number }[], caloriesTarget: number, proteinTarget: number) {
  const tracked = days.filter((d) => d.logged > 0);
  const onTarget = (d: (typeof days)[number]) => d.calories >= caloriesTarget * 0.8 && d.calories <= caloriesTarget * 1.15;
  const dayScore = (d: (typeof days)[number]) => (onTarget(d) ? 50 : 0) + Math.min(50, (d.protein / proteinTarget) * 50);
  const avgCalories = tracked.length ? Math.round(tracked.reduce((a, d) => a + d.calories, 0) / tracked.length) : 0;
  const avgProtein = tracked.length ? Math.round(tracked.reduce((a, d) => a + d.protein, 0) / tracked.length) : 0;
  const best = [...tracked].sort((a, b) => dayScore(b) - dayScore(a)).slice(0, 2).map((d) => d.date);
  const logged = days.reduce((a, d) => a + d.logged, 0), missed = days.reduce((a, d) => a + d.missed, 0);
  const consistency = tracked.length ? Math.round((tracked.filter(onTarget).length / days.length) * 100) : 0;
  const improve: string[] = [];
  if (tracked.length < days.length - 2) improve.push("Log meals on more days");
  if (tracked.length && avgProtein < proteinTarget * 0.8) improve.push("Eat more protein");
  if (tracked.length && avgCalories > caloriesTarget * 1.15) improve.push("Reduce portion sizes");
  if (tracked.length && avgCalories < caloriesTarget * 0.8) improve.push("Eat enough to reach your calorie target");
  if (missed > 1) improve.push("Miss fewer meals");
  return { avgCalories, avgProtein, consistency, best, logged, missed, adherence: logged + missed ? Math.round((logged / (logged + missed)) * 100) : null, improve };
}

// ---------- Weekly progress score ----------

export const SCORE_WEIGHTS = { diet: 0.3, workout: 0.3, consistency: 0.2, goal: 0.2 } as const;
const GOAL_TREND_SCORE: Record<WeightTrend, number | null> = { on_track: 100, stalled: 50, wrong_direction: 20, not_enough_data: null };

/**
 * Last 7 days (today included), each 0–100:
 * - Diet / Workout: the result-analysis adherence over 7 days (diet null with < 3 tracked days).
 * - Consistency: share of the 7 days with anything tracked (check-in, meal, workout or weight).
 * - Overall transformation: 30% diet + 30% workout + 20% consistency + 20% weight-trend-vs-goal
 *   (on track 100, stalled 50, wrong direction 20); missing parts are left out and the rest re-weighted.
 */
export function weeklyProgressScore(input: ResultInput & { activityDates: string[] }) {
  const week = resultAnalysis(input, 7);
  const from = week.from;
  const active = new Set([...input.activityDates, ...input.workoutDates, ...input.meals.map((m) => m.date), ...input.weights.map((w) => w.logged_on)].filter((d) => d >= from && d <= input.today));
  const consistency = pct(active.size / 7);
  const goal = GOAL_TREND_SCORE[week.weight.status];
  const parts: [number | null, number][] = [[week.diet.score, SCORE_WEIGHTS.diet], [week.workout.score, SCORE_WEIGHTS.workout], [consistency, SCORE_WEIGHTS.consistency], [goal, SCORE_WEIGHTS.goal]];
  const used = parts.filter((p): p is [number, number] => p[0] !== null);
  const weight = used.reduce((a, [, w]) => a + w, 0);
  const overall = Math.round(used.reduce((a, [v, w]) => a + v * w, 0) / weight);
  return { from, diet: week.diet.score, workout: week.workout.score, consistency, goal, overall, activeDays: active.size };
}
export type WeeklyProgressScore = ReturnType<typeof weeklyProgressScore>;

// ---------- Before / after and goal prediction ----------

/** Share (0–100) of the way from the starting weight to the target; null without a target or when start equals target. */
export function goalProgressPct(startKg: number | null, currentKg: number | null, targetKg: number | null): number | null {
  if (startKg === null || currentKg === null || targetKg === null || Math.abs(startKg - targetKg) < 0.1) return null;
  return Math.max(0, Math.min(100, Math.round(((startKg - currentKg) / (startKg - targetKg)) * 100)));
}

export type MeasurementKey = "waist_cm" | "chest_cm" | "hips_cm" | "arm_cm" | "body_fat_pct";
export const MEASUREMENT_KEYS: MeasurementKey[] = ["waist_cm", "chest_cm", "hips_cm", "arm_cm", "body_fat_pct"];

/** First and latest recorded value per measurement (each field independently), with the change. */
export function measurementComparison(rows: ({ measured_on: string } & Partial<Record<MeasurementKey, number | string | null>>)[]) {
  const sorted = [...rows].sort((a, b) => a.measured_on.localeCompare(b.measured_on));
  return MEASUREMENT_KEYS.map((key) => {
    const values = sorted.flatMap((r) => (r[key] === null || r[key] === undefined ? [] : [{ date: r.measured_on, value: Number(r[key]) }]));
    const first = values[0] ?? null, last = values[values.length - 1] ?? null;
    return { key, start: first, current: last, change: first && last && values.length > 1 ? Math.round((last.value - first.value) * 10) / 10 : null };
  });
}

/** Predictions beyond this are reported as "very slow" instead of a date. */
export const MAX_PREDICTION_WEEKS = 104;
export type GoalPredictionStatus = "reached" | "on_track" | "very_slow" | "not_moving" | "maintenance" | "no_target" | "not_enough_data";

/**
 * Estimates when the target weight is reached at the recent pace (first vs last weight log of the
 * last 28 days, needing ≥ 7 days between them). Reached within 0.5 kg.
 */
export function goalPrediction(input: { goal: string | null; currentKg: number | null; targetKg: number | null; weights: ResultInput["weights"]; today: string }) {
  const base = { ratePerWeek: null as number | null, weeksLeft: null as number | null, etaDate: null as string | null, remainingKg: null as number | null };
  if (input.goal === "maintenance") return { ...base, status: "maintenance" as GoalPredictionStatus };
  if (input.targetKg === null || input.currentKg === null) return { ...base, status: "no_target" as GoalPredictionStatus };
  const remainingKg = Math.round((input.targetKg - input.currentKg) * 10) / 10;
  if (Math.abs(remainingKg) <= 0.5) return { ...base, remainingKg, status: "reached" as GoalPredictionStatus };
  const trend = weightTrend(input.goal, input.weights, input.today);
  if (trend.changeKg === null || !trend.weeks) return { ...base, remainingKg, status: "not_enough_data" as GoalPredictionStatus };
  const ratePerWeek = Math.round((trend.changeKg / trend.weeks) * 100) / 100;
  if (Math.sign(ratePerWeek) !== Math.sign(remainingKg) || Math.abs(ratePerWeek) < 0.05) return { ...base, remainingKg, ratePerWeek, status: "not_moving" as GoalPredictionStatus };
  const weeksLeft = Math.ceil(Math.abs(remainingKg) / Math.abs(ratePerWeek));
  if (weeksLeft > MAX_PREDICTION_WEEKS) return { ...base, remainingKg, ratePerWeek, weeksLeft, status: "very_slow" as GoalPredictionStatus };
  return { remainingKg, ratePerWeek, weeksLeft, etaDate: addDaysISO(input.today, weeksLeft * 7), status: "on_track" as GoalPredictionStatus };
}
export type GoalPrediction = ReturnType<typeof goalPrediction>;
