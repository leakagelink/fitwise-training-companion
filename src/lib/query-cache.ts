import { QueryClient } from "@tanstack/react-query";

// Memory only: never persist private health data to shared browser storage.
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,
        gcTime: typeof window === "undefined" ? Infinity : 60 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
}

export function createCacheIdentityGuard(queryClient: QueryClient) {
  let identity: string | null | undefined;
  return (nextIdentity: string | null) => {
    const changed = identity !== undefined && identity !== nextIdentity;
    if (changed || nextIdentity === null) queryClient.clear();
    identity = nextIdentity;
    return changed;
  };
}
