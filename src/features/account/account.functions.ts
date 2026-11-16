import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the caller's account and every row they own. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || role.data) throw new Error("Transfer administrator access before deleting this account");
    const { eraseAccount } = await import("./cleanup.server");
    await eraseAccount(supabaseAdmin, context.userId);
    return { ok: true as const };
  });
