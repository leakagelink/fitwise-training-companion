import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { indianMobile, validSmsCode } from "./phone-auth";
import { sendPhoneOtp, verifyPhoneOtp } from "./phone-otp.functions";
export function PhoneLogin({ mode, onVerified }: { mode: "signin" | "signup"; onVerified: () => Promise<void> }) {
  const sendFn = useServerFn(sendPhoneOtp); const verifyFn = useServerFn(verifyPhoneOtp); const [number, setNumber] = useState(""); const [name, setName] = useState("");
  const [sentPhone, setSentPhone] = useState<string | null>(null); const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [cooldown, setCooldown] = useState(0);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(v => Math.max(0, v - 1)), 1000); return () => clearTimeout(timer); }, [cooldown]);
  async function send() {
    const phone = sentPhone ?? indianMobile(number);
    if (!phone) { setError("Enter a valid 10-digit Indian mobile number."); return; }
    if (mode === "signup" && !name.trim()) { setError("Enter your name."); return; }
    setBusy(true); setError("");
    try {
      await sendFn({ data: { phone, intent: mode } });
      setSentPhone(phone); setCooldown(60); setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send SMS");
    } finally { setBusy(false); }
  }
  async function verify() {
    if (!sentPhone || !validSmsCode(code)) { setError("Enter the six-digit SMS code."); return; }
    setBusy(true); setError("");
    try {
      const { tokenHash } = await verifyFn({ data: { phone: sentPhone, code, intent: mode, ...(mode === "signup" ? { name: name.trim() } : {}) } });
      const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      if (result.error) throw result.error;
      if (!result.data.session) throw new Error("Verification did not complete. Please try again.");
      await onVerified();
    } catch(e) { setError(e instanceof Error ? e.message : "Code could not be verified"); } finally { setBusy(false); }
  }
  return <form className="mt-6 space-y-4" onSubmit={e => { e.preventDefault(); void (sentPhone ? verify() : send()); }}>
    {sentPhone ? <><p className="break-words text-sm text-muted-foreground">Code sent to {sentPhone}</p><div className="space-y-1.5"><Label htmlFor="sms-code">SMS code</Label><Input id="sms-code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} required /></div></> : <>{mode === "signup" && <div className="space-y-1.5"><Label htmlFor="phone-name">Name</Label><Input id="phone-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} /></div>}<div className="space-y-1.5"><Label htmlFor="mobile-number">Mobile number (India, +91)</Label><Input id="mobile-number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={number} onChange={e => setNumber(e.target.value)} required maxLength={14} /></div></>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="h-11 w-full rounded-full" disabled={busy || (sentPhone !== null && !validSmsCode(code))}>{busy && <Loader2 className="size-4 animate-spin" />}{sentPhone ? "Verify & continue" : "Send SMS code"}</Button>
    {sentPhone && <div className="flex flex-wrap justify-between gap-2"><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setSentPhone(null); setCode(""); setError(""); }}><ArrowLeft /> Change number</Button><Button type="button" variant="ghost" size="sm" disabled={busy || cooldown > 0} onClick={() => void send()}>{cooldown ? `Resend in ${cooldown}s` : "Resend code"}</Button></div>}
  </form>;
}