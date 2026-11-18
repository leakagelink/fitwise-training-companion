// Client-safe helpers for the RepDB exercise catalog (bundled JSON, loaded lazily on the client).
// Exercise data by RepDB (https://repdb.co) — free tier, attribution required.

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  bodyPart: string;
  primary: string[];
  secondary: string[];
  equipment: string | null;
  bodyweight: boolean;
  unilateral: boolean;
  mechanic: string;
  instructions: string[];
  tips: string[];
  start: string;
  peak: string | null;
}

import { exerciseGif } from "./gif-motion";
export const hasGif = (id: string) => exerciseGif(id) !== undefined;

const IMG_BASE = "https://raw.githubusercontent.com/RepDB/exercise-dataset/main/images/flat/";
export const imageUrl = (file: string) => IMG_BASE + file;

export const human = (s: string | null | undefined) =>
  s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Bodyweight";

let cache: Promise<Exercise[]> | null = null;
function loadAll(): Promise<Exercise[]> {
  cache ??= import("@/data/exercises.json").then((m) => m.default as Exercise[]);
  return cache;
}

/** Exercises users can browse or pick: only those with a GIF animation. */
export async function loadExercises(): Promise<Exercise[]> {
  return (await loadAll()).filter((e) => hasGif(e.id));
}

/** Full map so older saved plans still resolve exercises that are now hidden. */
export async function exerciseMap(): Promise<Map<string, Exercise>> {
  return new Map((await loadAll()).map((e) => [e.id, e]));
}

/** Maps onboarding equipment labels to RepDB equipment ids. `null` = bodyweight. */
const EQUIPMENT_MAP: Record<string, (string | null)[]> = {
  "Bodyweight only": [null],
  Dumbbells: ["dumbbell"],
  Barbell: ["barbell", "ez_bar", "plates", "trap_bar"],
  "Resistance bands": ["resistance_band", "loop_band"],
  Kettlebell: ["kettlebell"],
  "Pull-up bar": ["pull_up_bar"],
  Bench: ["flat_bench"],
};

/** Returns whether an exercise can be done with the user's setup. Gym / "Full gym machines" allows everything. */
export function allowedForUser(ex: Pick<Exercise, "equipment">, location: string | null, equipment: string[]): boolean {
  if (location === "gym" || equipment.includes("Full gym machines")) return true;
  if (ex.equipment === null) return true;
  const allowed = new Set(equipment.flatMap((e) => EQUIPMENT_MAP[e] ?? []));
  return allowed.has(ex.equipment);
}

export function difficultyAllowed(difficulty: string, level: string | null): boolean {
  if (level === "advanced") return true;
  if (level === "intermediate") return difficulty !== "advanced";
  return difficulty === "beginner";
}
