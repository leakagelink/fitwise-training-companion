import { queryOptions } from "@tanstack/react-query";
import { getMyAccess } from "./access.functions";
export const accessQuery = queryOptions({ queryKey: ["membership-access"], queryFn: () => getMyAccess(), staleTime: 0, refetchOnWindowFocus: true });