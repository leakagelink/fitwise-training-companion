import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { indianMobile, OTP_LIMITS } from "./phone-auth";

const sendInput = z.object({ phone: z.string().max(20), intent: z.enum(["signin", "signup"]) });
const verifyInput = sendInput.extend({ code: z.string().regex(/^\d{6}$/), name: z.string().trim().max(80).optional() });

async function hash(phone: string, code: string) {
  const data = new TextEncoder().encode(`${phone}:${code}:${process.env["COMNEXA_API_KEY"]}`);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), b => b.toString(16).padStart(2, "0")).join("");
}
const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
async function findUser(phone: string) {
  const db = await admin();
  const { data, error } = await db.rpc("find_user_by_phone", { _phone: phone });
  if (error) throw new Error("Could not check this number. Please try again.");
  return data?.[0] ?? null;
}

export const sendPhoneOtp = createServerFn({ method: "POST" }).inputValidator((d: unknown) => sendInput.parse(d)).handler(async ({ data }) => {
  const phone = indianMobile(data.phone);
  if (!phone) throw new Error("Enter a valid 10-digit Indian mobile number.");
  const existing = await findUser(phone);
  if (data.intent === "signin" && !existing) throw new Error("No account with this number. Please create an account first.");
  if (data.intent === "signup" && existing) throw new Error("This number already has an account. Please sign in.");
  const db = await admin();
  const now = Date.now();
  const { data: row } = await db.from("phone_otps").select("*").eq("phone", phone).maybeSingle();
  let windowStart = now, windowCount = 1;
  if (row) {
    if (now - Date.parse(row.last_sent_at) < OTP_LIMITS.cooldownMs) throw new Error("Please wait a minute before asking for another code.");
    if (now - Date.parse(row.window_start) < OTP_LIMITS.windowMs) {
      if (row.window_count >= OTP_LIMITS.maxPerWindow) throw new Error("Too many codes requested. Please try again in an hour.");
      windowStart = Date.parse(row.window_start); windowCount = row.window_count + 1;
    }
  }
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
  const res = await fetch("https://comnexaapi.com/api/v1/otp/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env["COMNEXA_API_KEY"]}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: phone.slice(3), otp: code, channel: "sms" }),
  });
  if (!res.ok) { console.error("Comnexa send failed", res.status, await res.text().catch(() => "")); throw new Error("SMS could not be sent right now. Please try again later."); }
  await db.from("phone_otps").upsert({ phone, code_hash: await hash(phone, code), expires_at: new Date(now + OTP_LIMITS.ttlMs).toISOString(), attempts: 0, last_sent_at: new Date(now).toISOString(), window_start: new Date(windowStart).toISOString(), window_count: windowCount });
  return { phone };
});

export const verifyPhoneOtp = createServerFn({ method: "POST" }).inputValidator((d: unknown) => verifyInput.parse(d)).handler(async ({ data }) => {
  const phone = indianMobile(data.phone);
  if (!phone) throw new Error("Enter a valid 10-digit Indian mobile number.");
  const db = await admin();
  const { data: row } = await db.from("phone_otps").select("*").eq("phone", phone).maybeSingle();
  if (!row || Date.parse(row.expires_at) < Date.now()) throw new Error("This code has expired. Please request a new one.");
  if (row.attempts >= OTP_LIMITS.maxAttempts) throw new Error("Too many wrong codes. Please request a new one.");
  if (row.code_hash !== await hash(phone, data.code)) {
    await db.from("phone_otps").update({ attempts: row.attempts + 1 }).eq("phone", phone);
    throw new Error("Wrong code. Please check the SMS and try again.");
  }
  await db.from("phone_otps").update({ expires_at: new Date(0).toISOString() }).eq("phone", phone);
  const email = `m${phone.slice(1)}@phone.fitnessai.app`;
  let user = await findUser(phone);
  if (!user) {
    if (data.intent !== "signup") throw new Error("No account with this number. Please create an account first.");
    if (!data.name) throw new Error("Enter your name.");
    const created = await db.auth.admin.createUser({ phone: phone.slice(1), phone_confirm: true, email, email_confirm: true, user_metadata: { full_name: data.name } });
    if (created.error || !created.data.user) throw new Error("Account could not be created. Please try again.");
    user = { id: created.data.user.id, email };
  } else if (!user.email) {
    const updated = await db.auth.admin.updateUserById(user.id, { email, email_confirm: true });
    if (updated.error) throw new Error("Sign-in could not be completed. Please try again.");
    user = { ...user, email };
  }
  const link = await db.auth.admin.generateLink({ type: "magiclink", email: user.email! });
  if (link.error || !link.data.properties?.hashed_token) throw new Error("Sign-in could not be completed. Please try again.");
  return { tokenHash: link.data.properties.hashed_token };
});
