import { it, expect } from "vitest";
import { loadExercises, exerciseMap } from "@/features/exercise-library/catalog";
import { exerciseGif } from "@/features/exercise-library/gif-motion";
it("library lists only exercises that have a GIF", async () => {
  const list = await loadExercises();
  expect(list.length).toBeGreaterThan(300);
  expect(list.every((e) => exerciseGif(e.id))).toBe(true);
});
it("saved plans can still resolve every catalog exercise", async () => {
  expect((await exerciseMap()).size).toBe(701);
});
