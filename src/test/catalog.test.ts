import { describe, expect, it } from "vitest";
import { allowedForUser, difficultyAllowed } from "@/features/exercise-library/catalog";
import data from "@/data/exercises.json";

describe("exercise catalog", () => {
  it("contains the 701 RepDB exercises, each with an image", () => {
    expect(data.length).toBe(701);
    expect(data.every((e) => e.start)).toBe(true);
  });
  it("home users only get equipment they own", () => {
    expect(allowedForUser({ equipment: "barbell" }, "home", ["Dumbbells"])).toBe(false);
    expect(allowedForUser({ equipment: "dumbbell" }, "home", ["Dumbbells"])).toBe(true);
    expect(allowedForUser({ equipment: null }, "home", [])).toBe(true);
  });
  it("gym users can use any equipment", () => {
    expect(allowedForUser({ equipment: "leg_press" }, "gym", [])).toBe(true);
  });
  it("beginners only get beginner exercises", () => {
    expect(difficultyAllowed("intermediate", "beginner")).toBe(false);
    expect(difficultyAllowed("intermediate", "intermediate")).toBe(true);
  });
});
