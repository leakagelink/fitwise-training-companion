import { describe, expect, it } from "vitest";
import exercises from "@/data/exercises.json";
import { exerciseMotion } from "@/features/exercise-library/motion";

describe("exercise demonstration matching", () => {
  it("uses licensed clips for 27 exact catalog movements", () => {
    const matched = exercises.filter((exercise) => exerciseMotion(exercise.id));
    expect(matched).toHaveLength(27);
    for (const exercise of matched) {
      const media = exerciseMotion(exercise.id);
      expect(media?.video).toMatch(/\/__l5e\/assets-v1\/.*\.mp4$/);
      expect(media?.licenseUrl).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
      expect(media?.author).toBe("Goulart");
    }
  });
  it("never substitutes a different equipment or exercise variant", () => {
    expect(exerciseMotion("bench-press")).toBeDefined();
    expect(exerciseMotion("db-bench-press")).toBeDefined();
    expect(exerciseMotion("close-grip-bench-press")).toBeUndefined();
    expect(exerciseMotion("assisted-pull-ups")).toBeUndefined();
    expect(exerciseMotion("single-arm-tricep-pushdown")).toBeUndefined();
    expect(exerciseMotion("bodyweight-squat")).toBeUndefined();
  });
});