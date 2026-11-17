import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Navigation-only cache. Protected operations still verify the caller server-side.
export const authenticatedUserQuery = queryOptions({
  queryKey: ["authenticated-user"],
  staleTime: 30_000,
  retry: false,
  queryFn: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  },
});