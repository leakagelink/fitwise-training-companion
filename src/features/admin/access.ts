import { trialStatus } from "@/lib/fitness";
export type AccessRow = { starts_at: string; ends_at: string; revoked_at: string | null; diet_days: number; workout_access: boolean; coach_access: boolean; plan_name: string };
export function resolveAccess(trialStartedAt: string, rows: AccessRow[], now = new Date()) {
  const active = rows.filter(r => !r.revoked_at && Date.parse(r.starts_at) <= now.getTime() && Date.parse(r.ends_at) > now.getTime());
  const trial = trialStatus(trialStartedAt, now).active;
  return { dietDays: Math.max(trial ? 3 : 0, ...active.map(r => r.diet_days)), workouts: trial || active.some(r => r.workout_access), coach: trial || active.some(r => r.coach_access), plans: active.map(r => r.plan_name) };
}