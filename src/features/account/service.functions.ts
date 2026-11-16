import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const getAccountServices = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [tickets, notifications, preferences, requests] = await Promise.all([
    context.supabase.from("support_tickets").select("*,support_replies(*)").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100),
    context.supabase.from("user_notifications").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100),
    context.supabase.from("notification_preferences").select("*").eq("user_id", context.userId).maybeSingle(),
    context.supabase.from("privacy_requests").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }),
  ]);
  if ([tickets, notifications, preferences, requests].some(r => r.error)) throw new Error("Could not load account services");
  return { tickets: tickets.data ?? [], notifications: notifications.data ?? [], preferences: preferences.data ?? { announcements: true, expiry_reminders: true }, requests: requests.data ?? [] };
});
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ticket"), subject: z.string().trim().min(3).max(120), body: z.string().trim().min(3).max(4000) }),
  z.object({ action: z.literal("reply"), ticketId: z.string().uuid(), body: z.string().trim().min(1).max(4000) }),
  z.object({ action: z.literal("preferences"), announcements: z.boolean(), expiry_reminders: z.boolean() }),
  z.object({ action: z.literal("read"), id: z.string().uuid() }),
  z.object({ action: z.literal("privacy"), kind: z.enum(["delete", "export"]) }),
]);
export const saveAccountService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(schema).handler(async ({ context, data }) => {
  // All targets come from the verified session; private staff data never enters this endpoint.
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  let result;
  if (data.action === "ticket") result = await db.from("support_tickets").insert({ user_id: context.userId, subject: data.subject, body: data.body });
  else if (data.action === "preferences") result = await db.from("notification_preferences").upsert({ user_id: context.userId, announcements: data.announcements, expiry_reminders: data.expiry_reminders });
  else if (data.action === "read") result = await db.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", data.id).eq("user_id", context.userId);
  else if (data.action === "privacy") result = await db.from("privacy_requests").insert({ user_id: context.userId, kind: data.kind });
  else {
    const ticket = await context.supabase.from("support_tickets").select("id").eq("id", data.ticketId).eq("user_id", context.userId).single();
    if (ticket.error) throw new Error("Ticket unavailable");
    result = await db.from("support_replies").insert({ ticket_id: ticket.data.id, author_id: context.userId, body: data.body, from_staff: false });
  }
  if (result.error) throw new Error("Could not save. This request may already be pending.");
  return { ok: true };
});
export const exportMyData = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { exportUserData } = await import("@/features/admin/operations.server");
  return { json: await exportUserData(db, context.userId) };
});