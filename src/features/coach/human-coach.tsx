import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Phone, Video, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { coachQuery } from "./queries";
import { bookCoach, cancelBooking } from "./coach.functions";

export function HumanCoach() {
  const { data } = useSuspenseQuery(coachQuery);
  const qc = useQueryClient();
  const book = useServerFn(bookCoach);
  const cancel = useServerFn(cancelBooking);
  const [kind, setKind] = useState<"call" | "video" | "callback" | null>(null);
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [slotId, setSlotId] = useState("");
  const [busy, setBusy] = useState(false);
  const slots = data.slots.filter((s) => s.kind === kind);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!kind) return;
    setBusy(true);
    try { await book({ data: { kind, slotId: kind === "callback" ? null : slotId, contact, notes } }); await qc.invalidateQueries({ queryKey: ["coach"] }); setKind(null); setNotes(""); toast.success("Request received — awaiting coach confirmation"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit request"); }
    finally { setBusy(false); }
  }
  return <section className="border-t border-border py-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Need Help From Human Coach?</h2>{data.canManage && <Link to="/coach/manage" className="text-xs text-primary underline">Manage coaches & bookings</Link>}</div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => { setKind("call"); setSlotId(""); }}><Phone />Schedule Call</Button>
      <Button variant="secondary" size="sm" onClick={() => { setKind("video"); setSlotId(""); }}><Video />Schedule Video Consultation</Button>
      <Button variant="outline" size="sm" onClick={() => setKind("callback")}><CalendarDays />Request Callback</Button>
    </div>
    {data.bookings.filter((b) => b.status !== "cancelled").length > 0 && <ul className="mt-3 space-y-2">{data.bookings.filter((b) => b.status !== "cancelled").map((b) => <li key={b.id} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0"><span className="font-medium capitalize">{b.kind}</span> · <span className="capitalize text-primary">{b.status === "pending" ? "Awaiting confirmation" : b.status}</span>{b.coach_slots && <span className="block text-muted-foreground">{b.coach_slots.coach_name} · {new Date(b.coach_slots.starts_at).toLocaleString()}</span>}</span>{["pending", "confirmed"].includes(b.status) && <Button variant="ghost" size="sm" disabled={busy} onClick={async () => { setBusy(true); try { await cancel({ data: { id: b.id } }); await qc.invalidateQueries({ queryKey: ["coach"] }); } catch { toast.error("Could not cancel request"); } finally { setBusy(false); } }}>Cancel</Button>}</li>)}</ul>}
    <Dialog open={kind !== null} onOpenChange={(open) => { if (!open && !busy) setKind(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{kind === "callback" ? "Request a callback" : kind === "video" ? "Schedule video consultation" : "Schedule a call"}</DialogTitle></DialogHeader>
      {kind !== "callback" && slots.length === 0 ? <div className="space-y-4"><p className="text-sm text-muted-foreground">No coach appointments are currently available.</p><Button onClick={() => setKind("callback")}>Request Callback</Button></div> : <form onSubmit={submit} className="space-y-4">
        {kind !== "callback" && <label className="block text-sm">Appointment<select required value={slotId} onChange={(e) => setSlotId(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2"><option value="">Choose a time</option>{slots.map((s) => <option key={s.id} value={s.id}>{s.coach_name} · {new Date(s.starts_at).toLocaleString()} · {s.duration_min} min</option>)}</select></label>}
        {kind !== "callback" && data.coaches.filter((c) => slots.some((s) => s.coach_user_id === c.user_id)).map((c) => <div key={c.user_id} className="flex gap-3 border-b border-border pb-3">{c.photo_url && <img src={c.photo_url} alt={c.name} className="size-12 rounded-full object-cover" />}<div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.specialization} · {c.experience_years} years experience</p><p className="text-sm">{c.bio}</p></div></div>)}
        <label className="block text-sm">Phone or email<input required minLength={5} maxLength={200} value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2" autoComplete="email" /></label>
        <label className="block text-sm">What would you like help with? <span className="text-muted-foreground">(optional)</span><textarea maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>
        <p className="text-xs text-muted-foreground">Your contact details and note will be shared with the coach team. This is a request, not a confirmed appointment.</p>
        <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" />}Submit request</Button>
      </form>}
    </DialogContent></Dialog>
  </section>;
}