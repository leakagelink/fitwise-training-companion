import { describe, expect, it } from "vitest";
import { resolveAccess } from "@/features/admin/access";
import { validateRecord } from "@/features/admin/resources";
const now = new Date("2026-11-16T12:00:00Z");
const row = { starts_at: "2026-11-16T10:00:00Z", ends_at: "2026-12-16T10:00:00Z", revoked_at: null, diet_days: 30, workout_access: true, coach_access: true, plan_name: "Admin-granted membership" };
describe("administrator membership rules", () => {
  it("manual activation unlocks a monthly diet and coaching after trial expiry", () => {
    expect(resolveAccess("2026-11-01", [row], now)).toEqual({ dietDays: 30, workouts: true, coach: true, plans: [row.plan_name] });
  });
  it("revoked access grants no permissions", () => {
    expect(resolveAccess("2026-11-01", [{ ...row, revoked_at: "2026-11-16T11:00:00Z" }], now).dietDays).toBe(0);
  });
  it("expired and future access do not unlock a plan", () => {
    expect(resolveAccess("2026-11-01", [{ ...row, ends_at: now.toISOString() }, { ...row, starts_at: "2026-11-17" }], now).coach).toBe(false);
  });
  it("plans keep their selected feature permissions", () => {
    expect(resolveAccess("2026-11-01", [{ ...row, diet_days: 7, workout_access: false, coach_access: false }], now)).toMatchObject({ dietDays: 7, workouts: false, coach: false });
  });
  it("profile edits cannot assign privileges or reset trial dates", () => {
    expect(() => validateRecord("profiles", { full_name: "Edited", role: "admin" }, false)).toThrow();
    expect(() => validateRecord("profiles", { trial_started_at: now.toISOString() }, false)).toThrow();
  });
  it("admin record edits reject fields outside the allowlist", () => {
    expect(() => validateRecord("meal_logs", { id: "forged" }, false)).toThrow();
  });
});