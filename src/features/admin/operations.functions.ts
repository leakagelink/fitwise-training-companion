import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { capabilities, operationSchema, requiredCapability, rowsToCsv } from "./operations-model";

export const getOperationsIdentity = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [role, permissions] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.from("staff_permissions").select("capability").eq("user_id", context.userId),
  ]);
  if (role.error || permissions.error) throw new Error("Could not check staff permissions");
  return { isAdmin: role.data === true, capabilities: capabilities.filter(c => role.data === true || permissions.data.some(p => p.capability === c)) };
});
const dateFilter = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export const loadOperations = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator(dateFilter.extend({ section: z.enum(["support", "staff", "notifications", "privacy", "reports", "usage", "billing", "coaching"]) }))
  .handler(async ({ context, data }) => {
    const { requireCapability, auditRead } = await import("./operations.server");
    const permission = data.section === "staff" || data.section === "notifications" || data.section === "usage" ? "admin" : data.section;
    await requireCapability(context.supabase, context.userId, permission);
    if (data.from > data.to) throw new Error("Choose a valid date range");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    let result;
    if (data.section === "staff") result = await db.from("staff_permissions").select("*").order("created_at", { ascending: false }).limit(500);
    else if (data.section === "support") result = await db.from("support_tickets").select("*,support_replies(*)").gte("created_at", data.from).lte("created_at", `${data.to}T23:59:59.999Z`).order("created_at", { ascending: false }).limit(500);
    else if (data.section === "privacy") result = await db.from("privacy_requests").select("*").gte("created_at", data.from).lte("created_at", `${data.to}T23:59:59.999Z`).order("created_at", { ascending: false }).limit(500);
    else if (data.section === "usage") result = await db.from("generation_events").select("*").gte("created_at", data.from).lte("created_at", `${data.to}T23:59:59.999Z`).order("created_at", { ascending: false }).limit(500);
    else if (data.section === "billing") result = await db.from("purchase_history").select("*").gte("purchased_at", data.from).lte("purchased_at", `${data.to}T23:59:59.999Z`).order("purchased_at", { ascending: false }).limit(500);
    else if (data.section === "coaching") result = await db.from("coach_bookings").select("*,coach_slots(coach_name,starts_at)").gte("created_at", data.from).lte("created_at", `${data.to}T23:59:59.999Z`).order("created_at", { ascending: false }).limit(500);
    else if (data.section === "notifications") result = await db.from("user_notifications").select("*").eq("kind", "announcement").gte("created_at", data.from).lte("created_at", `${data.to}T23:59:59.999Z`).order("created_at", { ascending: false }).limit(500);
    else result = await db.from("private_data_access").select("*").gte("created_at", data.from).lte("created_at", `${data.to}T23:59:59.999Z`).order("created_at", { ascending: false }).limit(500);
    if (result.error) throw new Error("Could not load operations");
    await auditRead(db, context.userId, null, data.section, "Staff operations view");
    return { rows: JSON.stringify(result.data), limited: result.data.length === 500 };
  });
export const saveOperation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(operationSchema).handler(async ({ context, data }) => {
  const { requireCapability } = await import("./operations.server");
  await requireCapability(context.supabase, context.userId, requiredCapability(data.action));
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.rpc("staff_operation", { _actor: context.userId, _action: data.action, _payload: JSON.parse(JSON.stringify(data)) });
  if (result.error) throw new Error("Could not save. Check the user, request and permission.");
  return { ok: true };
});
export const loadStaffNotes = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ userId: z.string().uuid() })).handler(async ({ context, data }) => {
  const { requireCapability, auditRead } = await import("./operations.server");
  await requireCapability(context.supabase, context.userId, "support");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.from("staff_notes").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(500);
  if (result.error) throw new Error("Could not load staff notes");
  await auditRead(db, context.userId, data.userId, "staff_notes", "Support case review");
  return result.data;
});
export const exportPrivateData = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ userId: z.string().uuid(), reason: z.string().trim().min(3).max(500), confirmation: z.literal("EXPORT") })).handler(async ({ context, data }) => {
  const { requireCapability, auditRead, exportUserData } = await import("./operations.server");
  await requireCapability(context.supabase, context.userId, "privacy");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  await auditRead(db, context.userId, data.userId, "user_export", data.reason);
  return { json: await exportUserData(db, data.userId) };
});
export const exportReport = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(dateFilter.extend({ report: z.enum(["purchases", "memberships", "bookings"]), reason: z.string().trim().min(3).max(500) })).handler(async ({ context, data }) => {
  const { requireCapability, auditRead } = await import("./operations.server");
  await requireCapability(context.supabase, context.userId, "reports");
  if (data.from > data.to) throw new Error("Choose a valid date range");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const table = data.report === "purchases" ? "purchase_history" : data.report === "memberships" ? "membership_access" : "coach_bookings";
  const field = data.report === "purchases" ? "purchased_at" : "created_at";
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; offset <= 10000; offset += 500) {
    const result = await db.from(table).select("*").gte(field, data.from).lte(field, `${data.to}T23:59:59.999Z`).order("id").range(offset, offset + 499);
    if (result.error) throw new Error("Could not export report");
    rows.push(...result.data);
    if (rows.length > 10000) throw new Error("Narrow the date range; export exceeds 10,000 records");
    if (result.data.length < 500) break;
  }
  await auditRead(db, context.userId, null, `export_${data.report}`, data.reason);
  return { csv: rowsToCsv(rows), count: rows.length };
});