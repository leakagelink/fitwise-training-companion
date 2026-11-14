import { queryOptions, useQuery } from "@tanstack/react-query";
import { exerciseMap, loadExercises } from "./catalog";

export const exercisesQuery = queryOptions({ queryKey: ["exercises"], queryFn: loadExercises, staleTime: Infinity });
export const exerciseMapQuery = queryOptions({ queryKey: ["exercise-map"], queryFn: exerciseMap, staleTime: Infinity });
export const useExercises = () => useQuery(exercisesQuery);
export const useExerciseMap = () => useQuery(exerciseMapQuery);
