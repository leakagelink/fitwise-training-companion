import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCoachManagement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError || !roles?.some((r) => r.role === "admin" || r.role === "coach"))
      throw new Error("Coach management is restricted to authorized staff");
    const [bookings, profiles, slots] = await Promise.all([
      context.supabase
        .from("coach_bookings")
        .select("*,coach_slots(coach_name,starts_at)")
        .order("created_at", { ascending: false }),
      context.supabase.from("coach_profiles").select("*"),
      context.supabase.from("coach_slots").select("*").order("starts_at", { ascending: false }),
    ]);
    for (const result of [bookings, profiles, slots])
      if (result.error) throw new Error("Could not load coach management");
    return {
      bookings: bookings.data ?? [],
      profiles: profiles.data ?? [],
      slots: slots.data ?? [],
      userId: context.userId,
      isAdmin: roles.some((r) => r.role === "admin"),
    };
  });
const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  photo_url: z.union([z.literal(""), z.string().url().startsWith("https://")]),
  specialization: z.string().trim().max(200),
  bio: z.string().trim().max(1000),
  experience_years: z.number().int().min(0).max(70),
});
export const saveCoachProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.input<typeof profileSchema>) => profileSchema.parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("coach_profiles")
      .upsert({ ...data, user_id: context.userId });
    if (error) throw new Error("Could not save coach profile. Authorized staff only.");
    return { ok: true };
  });
const slotSchema = z.object({
  kind: z.enum(["call", "video"]),
  startsAt: z.string().datetime(),
  duration: z.number().int().min(10).max(180),
});
export const addCoachSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.input<typeof slotSchema>) => slotSchema.parse(v))
  .handler(async ({ context, data }) => {
    if (new Date(data.startsAt).getTime() <= Date.now())
      throw new Error("Choose a future appointment time");
    const profile = await context.supabase
      .from("coach_profiles")
      .select("name")
      .eq("user_id", context.userId)
      .single();
    if (profile.error) throw new Error("Save your coach profile first");
    const { error } = await context.supabase.from("coach_slots").insert({
      coach_user_id: context.userId,
      coach_name: profile.data.name,
      kind: data.kind,
      starts_at: data.startsAt,
      duration_min: data.duration,
    });
    if (error) throw new Error("Could not add appointment availability");
    return { ok: true };
  });
export const changeBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string; status: "confirmed" | "completed" | "cancelled" }) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["confirmed", "completed", "cancelled"]) })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!roles?.some((r) => r.role === "admin" || r.role === "coach"))
      throw new Error("Authorized staff only");
    const { data: row, error } = await context.supabase
      .from("coach_bookings")
      .update({ status: data.status })
      .eq("id", data.id)
      .in("status", ["pending", "confirmed"])
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not update booking status");
    return { ok: true };
  });
