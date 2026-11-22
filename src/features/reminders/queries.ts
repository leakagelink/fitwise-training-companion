import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_REMINDERS, shortTime, type ReminderSettings } from "./model";

export const reminderSettingsQuery = queryOptions({
  queryKey: ["reminder-settings"],
  queryFn: async (): Promise<ReminderSettings> => {
    const { data, error } = await supabase.from("reminder_settings").select("*").maybeSingle();
    if (error) throw new Error("Could not load reminders");
    if (!data) return DEFAULT_REMINDERS;
    return {
      breakfast_on: data.breakfast_on, breakfast_at: shortTime(data.breakfast_at),
      lunch_on: data.lunch_on, lunch_at: shortTime(data.lunch_at),
      dinner_on: data.dinner_on, dinner_at: shortTime(data.dinner_at),
      water_on: data.water_on, water_start: shortTime(data.water_start), water_end: shortTime(data.water_end), water_every_hours: data.water_every_hours,
      workout_on: data.workout_on, workout_at: shortTime(data.workout_at),
      missed_meal_followup: data.missed_meal_followup,
    };
  },
});

export const mealFollowupsQuery = (date: string) => queryOptions({
  queryKey: ["meal-followups", date],
  queryFn: async () => {
    const { data, error } = await supabase.from("meal_followups").select("meal_type,status,reason").eq("date", date);
    if (error) throw new Error("Could not load meal follow-ups");
    return data;
  },
});
