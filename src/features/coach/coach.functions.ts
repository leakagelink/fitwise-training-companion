import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bookingSchema } from "./model";

export const getCoachData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    const [threads, bookings, slots, coaches, role] = await Promise.all([
      supabase
        .from("coach_threads")
        .select("id,title,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("coach_bookings")
        .select("*,coach_slots(coach_name,starts_at,duration_min)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("coach_slots")
        .select("*")
        .eq("is_available", true)
        .gt("starts_at", new Date().toISOString())
        .order("starts_at"),
      supabase.from("coach_profiles").select("*").eq("is_active", true),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    for (const result of [threads, bookings, slots, coaches, role])
      if (result.error) throw new Error("Could not load coach information");
    return {
      threads: threads.data ?? [],
      bookings: bookings.data ?? [],
      slots: slots.data ?? [],
      coaches: coaches.data ?? [],
      canManage: role.data?.some((r) => r.role === "admin" || r.role === "coach") ?? false,
    };
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("coach_threads")
      .insert({ user_id: context.userId })
      .select("id")
      .single();
    if (error || !data) throw new Error("Could not create conversation");
    return data;
  });
export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const thread = await context.supabase
      .from("coach_threads")
      .select("id,title,generation_id")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (thread.error) throw new Error("Conversation not found");
    const messages = await context.supabase
      .from("coach_messages")
      .select("id,role,parts,created_at")
      .eq("thread_id", data.id)
      .eq("user_id", context.userId)
      .order("created_at");
    if (messages.error) throw new Error("Could not load conversation");
    return { thread: thread.data, messages: messages.data ?? [] };
  });
export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("coach_threads")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("generation_id", null);
    if (error) throw new Error("Could not delete conversation");
    return { ok: true };
  });
export const bookCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: z.input<typeof bookingSchema>) => bookingSchema.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("coach_bookings")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        slot_id: data.slotId,
        contact: data.contact,
        notes: data.notes,
      })
      .select("id,status")
      .single();
    if (error || !row)
      throw new Error(
        error?.code === "23505"
          ? "This slot has just been requested. Please choose another."
          : "Could not submit request. Check contact details and availability.",
      );
    return row;
  });
export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("coach_bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .in("status", ["pending", "confirmed"])
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not cancel this request");
    return { ok: true };
  });
