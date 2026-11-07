import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getNutrition } from "./nutrition.functions";

export const nutritionQuery = queryOptions({ queryKey: ["nutrition-plan"], queryFn: () => getNutrition(), retry: false });
export const mealLogsQuery = (date: string) => queryOptions({ queryKey: ["meal-logs", date], queryFn: async () => {
  const { data, error } = await supabase.from("meal_logs").select("*").eq("logged_on", date).order("created_at");
  if (error) throw new Error("Could not load meal logs");
  return data;
} });