import { describe, expect, it } from "vitest";
import { resolveAccess } from "@/features/admin/access";
import { validateRecord } from "@/features/admin/resources";
const now = new Date("2026-11-16T12:00:00Z");
const row = { starts_at: "2026-11-16T10:00:00Z", ends_at: "2026-12-16T10:00:00Z", revoked_at: null, diet_days: 30, workout_access: true, coach_access: true, plan_name: "Admin-granted membership" };
describe("administrator membership rules", () => {
  it("manual activation unlocks a monthly diet and coaching after trial expiry", () => {
    expect(resolveAccess("2026-11-01", [row], now)).toEqual({ dietDays: 30, workouts: true, coach: true, plans: [row.plan_name] });
  });
  it("revoked memberships do not remove the public diet duration", () => {
    expect(resolveAccess("2026-11-01", [{ ...row, revoked_at: "2026-11-16T11:00:00Z" }], now).dietDays).toBe(30);
  });
  it("expired and future access do not unlock a plan", () => {
    expect(resolveAccess("2026-11-01", [{ ...row, ends_at: now.toISOString() }, { ...row, starts_at: "2026-11-17" }], now).coach).toBe(false);
  });
  it("plans keep their selected feature permissions", () => {
    expect(resolveAccess("2026-11-01", [{ ...row, diet_days: 7, workout_access: false, coach_access: false }], now)).toMatchObject({ dietDays: 30, workouts: false, coach: false });
  });
  it("profile edits cannot assign privileges or reset trial dates", () => {
    expect(() => validateRecord("profiles", { full_name: "Edited", role: "admin" }, false)).toThrow();
    expect(() => validateRecord("profiles", { trial_started_at: now.toISOString() }, false)).toThrow();
  });
  it("admin record edits reject fields outside the allowlist", () => {
    expect(() => validateRecord("meal_logs", { id: "forged" }, false)).toThrow();
  });
});
describe("diet plans open to everyone", () => {
  it("permits 7 and 30 days for a new trial without membership", () => {
    const access = resolveAccess("2026-11-16T11:00:00Z", [], now);
    expect(access.dietDays).toBe(30);
    expect(7 <= access.dietDays).toBe(true);
  });
  it("permits 30 days after the trial ends without unlocking coaching/workouts", () => {
    expect(resolveAccess("2026-11-01", [], now)).toEqual({ dietDays: 30, workouts: false, coach: false, plans: [] });
  });
});
