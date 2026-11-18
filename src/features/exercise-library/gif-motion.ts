import gifs from "@/data/exercise-gifs.json";

/** Pinned release so animations never change underneath existing plans. */
export const GIF_SOURCE = "https://github.com/JahelCuadrado/ExerciseGymGifsDB";
const GIF_BASE = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/";

export interface ExerciseGif {
  url: string;
  /** True when the GIF shows a close variation rather than the exact catalog exercise. */
  similar: boolean;
}

const map = gifs as Record<string, [string, "e" | "c"]>;

export function exerciseGif(id: string): ExerciseGif | undefined {
  const entry = map[id];
  if (!entry) return undefined;
  return { url: `${GIF_BASE}${entry[0]}.gif`, similar: entry[1] === "c" };
}
