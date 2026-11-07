import { queryOptions } from "@tanstack/react-query";
import { getCoachData, getThread } from "./coach.functions";
export const coachQuery = queryOptions({ queryKey: ["coach"], queryFn: () => getCoachData() });
export const threadQuery = (id: string) => queryOptions({ queryKey: ["coach-thread", id], queryFn: () => getThread({ data: { id } }) });