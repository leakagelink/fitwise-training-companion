import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
export const Route = createFileRoute("/api/public/jobs/membership-reminders")({
  server: { handlers: { POST: async ({ request }) => {
    const failure = await authenticateCronRequest(request);
    if (failure) return failure;
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const result = await db.rpc("send_expiry_notifications");
    if (result.error) return Response.json({ error: "Reminders unavailable" }, { status: 500 });
    return Response.json({ sent: result.data });
  } } },
});