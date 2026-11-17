import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { resourceNames, resourceConfig, validateRecord } from "./resources";

async function requireAdmin(client: SupabaseClient<Database>, userId: string) {
  const result = await client.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (result.error || result.data !== true) throw new Error("Administrator access required");
}
export const getAdminIdentity = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const result = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (result.error) throw new Error("Could not verify workspace access. Please try again.");
  return { isAdmin: result.data === true };
});
export const getAdminOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context.supabase, context.userId);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const [users, workouts, meals, bookings, memberships, purchases, audit] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("workout_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
    db.from("meal_logs").select("id", { count: "exact", head: true }),
    db.from("coach_bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("membership_access").select("user_id").is("revoked_at", null).lte("starts_at", now).gt("ends_at", now),
    db.from("purchase_history").select("*").order("purchased_at", { ascending: false }).limit(100),
    db.from("admin_activity").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  if ([users, workouts, meals, bookings, memberships, purchases, audit].some(r => r.error)) throw new Error("Could not load administration records");
  return { users: users.count ?? 0, workouts: workouts.count ?? 0, meals: meals.count ?? 0, pendingBookings: bookings.count ?? 0, members: new Set(memberships.data?.map(r => r.user_id)).size, purchases: purchases.data ?? [], audit: audit.data ?? [] };
});
export const listAdminUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(1), search: z.string().max(200) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    // Search returns exact email matches, avoiding loading every auth account into the browser.
    let ids: string[] | null = null;
    if (data.search.trim()) {
      const { data: found, error } = await db.rpc("admin_find_users", { _search: data.search.trim() });
      if (error) throw new Error("Could not search users");
      ids = (found ?? []).map(r => r.id);
      if (!ids.length) return { users: [], total: 0 };
    }
    let query = db.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (ids) query = query.in("id", ids);
    const result = await query.range((data.page - 1) * 25, data.page * 25 - 1);
    if (result.error) throw new Error("Could not load users");
    const { auditRead } = await import("./operations.server");
    await auditRead(db, context.userId, null, "user_list", "Administrator user search");
    const users = await Promise.all((result.data ?? []).map(async p => {
      const [account, roles] = await Promise.all([db.auth.admin.getUserById(p.id), db.from("user_roles").select("role").eq("user_id", p.id)]);
      if (account.error || roles.error) throw new Error("Could not load account details");
      return { ...p, email: account.data.user.email ?? "", lastSignIn: account.data.user.last_sign_in_at ?? null, roles: roles.data?.map(r => r.role) ?? [] };
    }));
    return { users, total: result.count ?? 0 };
  });
export const getAdminUser = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ context, data }) => {
  await requireAdmin(context.supabase, context.userId);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const [profile, account, roles, access, purchases] = await Promise.all([
    db.from("profiles").select("*").eq("id", data.id).single(), db.auth.admin.getUserById(data.id),
    db.from("user_roles").select("role").eq("user_id", data.id),
    db.from("membership_access").select("*").eq("user_id", data.id).order("created_at", { ascending: false }),
    db.from("purchase_history").select("*").eq("user_id", data.id).order("purchased_at", { ascending: false }),
  ]);
  if (profile.error || account.error || roles.error || access.error || purchases.error) throw new Error("Could not load user details");
  const { auditRead } = await import("./operations.server");
  await auditRead(db, context.userId, data.id, "user_profile", "Administrator account review");
  return { profile: profile.data, email: account.data.user.email ?? "", bannedUntil: account.data.user.banned_until ?? null, roles: roles.data?.map(r => r.role) ?? [], access: access.data ?? [], purchases: purchases.data ?? [] };
});
export const listAdminRecords = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ resource: z.enum(resourceNames), userId: z.string().uuid().nullable(), page: z.number().int().min(1) })).handler(async ({ context, data }) => {
  await requireAdmin(context.supabase, context.userId);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const config = resourceConfig(data.resource);
  let query = db.from(data.resource).select("*", { count: "exact" }).order(config.key ?? "id", { ascending: false });
  if (data.userId && (config.owner || data.resource === "profiles")) query = query.eq(config.owner ?? "id", data.userId);
  const result = await query.range((data.page - 1) * 25, data.page * 25 - 1);
  if (result.error) throw new Error("Could not load records");
  const { auditRead } = await import("./operations.server");
  await auditRead(db, context.userId, data.userId, data.resource, "Administrator record review");
  return { rows: result.data as unknown as Record<string, Json>[], total: result.count ?? 0 };
});
export const saveAdminRecord = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ resource: z.enum(resourceNames), id: z.string().nullable(), values: z.record(z.unknown()), remove: z.boolean(), reason: z.string().trim().min(3).max(500) })).handler(async ({ context, data }) => {
  await requireAdmin(context.supabase, context.userId);
  const config = resourceConfig(data.resource);
  if ((!data.id && config.create === false) || (data.remove && config.remove === false)) throw new Error("This operation is not allowed");
  const values = data.remove ? {} : validateRecord(data.resource, data.values, !data.id);
  if (data.id && config.owner && config.owner in values) throw new Error("Record ownership cannot be changed");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  if (!data.remove && values["exercise_id"]) {
    const catalog = (await import("@/data/exercises.json")).default;
    if (!catalog.some(e => e.id === values["exercise_id"])) throw new Error("Choose an exercise from the catalog");
  }
  if (data.resource === "nutrition_plans" && values["days"]) {
    const { dietSchema, mealFitsDiet } = await import("@/features/nutrition/model");
    const old = data.id ? await db.from("nutrition_plans").select("user_id,duration_days").eq("id", data.id).single() : null;
    const owner = String(values["user_id"] ?? old?.data?.user_id ?? "");
    const profile = await db.from("profiles").select("diet_type,allergies").eq("id", owner).single();
    const days = dietSchema.shape.days.parse(values["days"]);
    if (profile.error || days.length !== Number(values["duration_days"] ?? old?.data?.duration_days) || days.some(d => d.meals.reduce((sum, m) => sum + m.nutrition.calories, 0) < 1200 || d.meals.some(m => !mealFitsDiet(m, profile.data.diet_type, profile.data.allergies) || Object.values(m.nutrition).some(n => n < 0)))) throw new Error("Recipe days must match duration and respect dietary restrictions and calorie safety");
  }
  for (const [field, table] of [["plan_id", "workout_plans"], ["day_id", "workout_days"]] as const) {
    if (values[field] && values["user_id"]) {
      const parent = await db.from(table).select("user_id").eq("id", String(values[field])).single();
      if (parent.error || parent.data.user_id !== values["user_id"]) throw new Error("Parent belongs to another user");
    }
  }
  if (data.resource === "coach_profiles" || data.resource === "coach_slots") {
    const owner = values["user_id"] ?? values["coach_user_id"] ?? (data.resource === "coach_profiles" ? data.id : null);
    if (owner && !data.remove) {
      const roles = await db.from("user_roles").select("role").eq("user_id", String(owner));
      if (!roles.data?.some(r => r.role === "coach" || r.role === "admin")) throw new Error("Assign the coach role first");
    }
  }
  const result = await db.rpc("admin_upsert_record", { _actor: context.userId, _table: data.resource, _id: data.id ?? "", _data: values as Json, _delete: data.remove, _reason: data.reason });
  if (result.error) throw new Error("Could not save record. Check related records and required values.");
  return { id: result.data };
});
export const manageMembership = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ userId: z.string().uuid(), planId: z.string().uuid().nullable(), endsAt: z.string().datetime({ offset: true }), reason: z.string().trim().min(3).max(500), revokeId: z.string().uuid().nullable() })).handler(async ({ context, data }) => {
  await requireAdmin(context.supabase, context.userId);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.rpc("admin_membership", { _actor: context.userId, _user: data.userId, _plan: data.planId ?? "00000000-0000-0000-0000-000000000000", _ends: data.endsAt, _reason: data.reason, ...data.revokeId ? { _revoke: data.revokeId } : {} });
  if (result.error) throw new Error("Could not change access. Check the plan and expiry date.");
  return { ok: true };
});
export const manageAdminRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ userId: z.string().uuid(), role: z.enum(["admin", "coach"]), remove: z.boolean() })).handler(async ({ context, data }) => {
  await requireAdmin(context.supabase, context.userId);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.rpc("admin_set_role", { _actor: context.userId, _user: data.userId, _role: data.role, _remove: data.remove });
  if (result.error) throw new Error("Could not change role. Your own/last admin role cannot be removed.");
  return { ok: true };
});
export const manageAdminAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ userId: z.string().uuid(), action: z.enum(["suspend", "restore", "delete"]), reason: z.string().trim().min(3).max(500) })).handler(async ({ context, data }) => {
  await requireAdmin(context.supabase, context.userId);
  if (data.userId === context.userId) throw new Error("You cannot suspend or delete your own admin account");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const admin = await db.rpc("has_role", { _user_id: data.userId, _role: "admin" });
  if (admin.error || admin.data) throw new Error("Remove administrator access before managing this account");
  if (data.action === "delete") {
    const { eraseAccount } = await import("@/features/account/cleanup.server");
    await eraseAccount(db, data.userId);
  } else {
    const result = await db.auth.admin.updateUserById(data.userId, { ban_duration: data.action === "suspend" ? "876000h" : "none" });
    if (result.error) throw new Error("Could not change account status");
  }
  const audit = await db.from("admin_activity").insert({ actor_id: context.userId, target_user_id: data.action === "delete" ? null : data.userId, action: data.action, resource: "account", reason: data.reason });
  if (audit.error) throw new Error("Account changed, but activity log could not be saved");
  return { ok: true };
});
export const inviteAdminUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ email: z.string().email(), name: z.string().trim().min(1).max(120) })).handler(async ({ context, data }) => {
  await requireAdmin(context.supabase, context.userId);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { getRequest } = await import("@tanstack/react-start/server");
  const origin = new URL(getRequest().url).origin;
  const result = await db.auth.admin.inviteUserByEmail(data.email, { data: { full_name: data.name }, redirectTo: `${origin}/auth` });
  if (result.error) throw new Error("Could not invite user. Check the email and email delivery settings.");
  await db.from("admin_activity").insert({ actor_id: context.userId, target_user_id: result.data.user.id, action: "invite", resource: "account" });
  return { ok: true };
});