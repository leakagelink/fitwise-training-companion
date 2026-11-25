import { describe, it, expect } from "vitest";
import { workoutIsFree } from "@/features/admin/access";
describe("free features", () => {
  it("home workouts are free without subscription", () => expect(workoutIsFree("home")).toBe(true));
  it("gym workouts still need access", () => expect(workoutIsFree("gym")).toBe(false));
});
import { resolveAccess } from "@/features/admin/access";
describe("subscriptions paused", () => {
  it("expired trial user without plans still gets workouts and coach", () => {
    const a = resolveAccess("2020-01-01T00:00:00Z", []);
    expect(a.workouts).toBe(true); expect(a.coach).toBe(true);
  });
});
