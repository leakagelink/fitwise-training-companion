import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session?.user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.session.user.id)
      .single();
    if (error) throw error;
    return data;
  },
});

export function useProfile() {
  return useQuery(profileQuery);
}

export type Profile = NonNullable<ReturnType<typeof useProfile>["data"]>;
