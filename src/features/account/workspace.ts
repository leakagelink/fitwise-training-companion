import { queryOptions } from "@tanstack/react-query";
import { getAdminIdentity } from "@/features/admin/admin.functions";

export function workspaceDestination(isAdmin: boolean) {
  return isAdmin ? "/admin" as const : "/home" as const;
}

export const workspaceQuery = queryOptions({
  queryKey: ["admin-identity"],
  queryFn: () => getAdminIdentity(),
  staleTime: 0,
});