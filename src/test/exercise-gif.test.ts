import { describe, expect, it } from "vitest";
import exercises from "@/data/exercises.json";
import gifs from "@/data/exercise-gifs.json";
import { exerciseGif } from "@/features/exercise-library/gif-motion";

describe("exercise GIF animations", () => {
  it("maps only real catalog exercises to the pinned GIF release", () => {
    const ids = new Set(exercises.map((exercise) => exercise.id));
    for (const id of Object.keys(gifs)) {
      expect(ids.has(id)).toBe(true);
      expect(exerciseGif(id)?.url).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/JahelCuadrado\/ExerciseGymGifsDB@v1\.1\.0\/[a-z-]+\/[a-z0-9-]+\.gif$/);
    }
    expect(Object.keys(gifs).length).toBe(405);
  });
  it("marks near matches as similar and leaves unmatched exercises on stills", () => {
    expect(exerciseGif("push-up")).toEqual({ url: expect.stringContaining("pectorals/push-up.gif"), similar: false });
    expect(exerciseGif("plank")?.similar).toBe(true);
    expect(exerciseGif("bird-dog")).toBeUndefined();
  });
});
