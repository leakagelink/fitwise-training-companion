import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadResultAnalysis } from "./result-data";

export const resultAnalysisQuery = (today: string) =>
  queryOptions({
    queryKey: ["progress", "results", today],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) throw new Error("Please sign in again");
      return (await loadResultAnalysis(supabase, data.session.user.id, today)).analysis;
    },
  });
