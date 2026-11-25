import { describe, it, expect } from "vitest";
import { workoutIsFree } from "@/features/admin/access";
describe("free features", () => {
  it("home workouts are free without subscription", () => expect(workoutIsFree("home")).toBe(true));
  it("gym workouts still need access", () => expect(workoutIsFree("gym")).toBe(false));
});
