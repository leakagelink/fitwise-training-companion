import { useQuery } from "@tanstack/react-query";
import { exerciseMap, loadExercises } from "./catalog";

export const useExercises = () => useQuery({ queryKey: ["exercises"], queryFn: loadExercises, staleTime: Infinity });
export const useExerciseMap = () => useQuery({ queryKey: ["exercise-map"], queryFn: exerciseMap, staleTime: Infinity });
