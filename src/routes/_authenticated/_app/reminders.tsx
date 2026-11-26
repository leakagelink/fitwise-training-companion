import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, ChevronLeft, Coffee, Droplets, Dumbbell, MessageCircleQuestion, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";
import { reminderSettingsQuery } from "@/features/reminders/queries";
import { MISSED_GRACE_MINUTES, reminderSettingsSchema, waterTimes, type ReminderSettings } from "@/features/reminders/model";
import { nativeReminderPermission, syncNativeReminders, type NativePermission } from "@/lib/native-reminders";
import { useLanguageStore } from '@/features/language/context';

export const Route = createFileRoute("/_authenticated/_app/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — Muscles Zone" },
      { name: "description", content: "Set breakfast, lunch, dinner, water and workout reminders, plus missed-meal check-ins." },
      { property: "og:title", content: "Reminders — Muscles Zone" },
      { property: "og:description", content: "Daily meal, water and workout reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reminderSettingsQuery),
  errorComponent: ScreenLoadError,
  notFoundComponent: ScreenNotFound,
  component: Reminders,
});

type TimedKey = "breakfast" | "lunch" | "dinner" | "workout";
const TIMED: { key: TimedKey; label: string; icon: typeof Sun }[] = [
  { key: "breakfast", label: "Breakfast reminder", icon: Coffee },
  { key: "lunch", label: "Lunch reminder", icon: Sun },
  { key: "dinner", label: "Dinner reminder", icon: Moon },
  { key: "workout", label: "Workout reminder", icon: Dumbbell },
];

function Reminders() {
  const language = useLanguageStore();
  const saved = useSuspenseQuery(reminderSettingsQuery);
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState<ReminderSettings>(saved.data);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NativePermission | null>(null);
  useEffect(() => { void nativeReminderPermission(false).then(setPermission).catch(() => setPermission("unsupported")); }, []);
  const set = <K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) => setForm((f) => ({ ...f, [key]: value }));
  const check = reminderSettingsSchema.safeParse(form);
  const error = check.success ? null : check.error.issues[0]?.message ?? "Check the times";

  async function save() {
    if (!p || !check.success) return;
    setBusy(true);
    try {
      const { error: saveError } = await supabase.from("reminder_settings").upsert({ user_id: p.id, ...check.data, updated_at: new Date().toISOString() });
      if (saveError) throw saveError;
      await qc.invalidateQueries({ queryKey: ["reminder-settings"] });
      let status = await nativeReminderPermission(true);
      if (status === "granted") status = await syncNativeReminders(check.data, language ? sources => language.resolve(sources) : undefined);
      setPermission(status);
      toast.success(status === "denied" ? "Saved. Allow notifications in phone settings to get reminders." : "Reminders saved");
    } catch {
      toast.error("Could not save reminders");
    } finally {
      setBusy(false);
    }
  }

  const waterCount = form.water_on && check.success ? waterTimes(form.water_start, form.water_end, form.water_every_hours).length : 0;
  return (
    <div className="mx-auto max-w-xl space-y-6 px-5 py-6">
      <header className="space-y-2">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="size-4" /> Profile</Link>
        <p className="text-xs font-semibold uppercase text-primary">Diet follow-up</p>
        <h1 className="text-3xl font-bold">Reminders</h1>
        <p className="text-sm text-muted-foreground">Daily reminders for meals, water and workouts.</p>
      </header>

      {permission === "unsupported" && <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground"><BellRing className="mr-1 inline size-4 text-primary" /> Pop-up reminders arrive in the Android app. Here, missed-meal check-ins appear on Home and Nutrition.</p>}
      {permission === "denied" && <p role="alert" className="border-l-2 border-destructive pl-3 text-sm">Notifications are blocked. Turn them on for Muscles Zone in your phone settings.</p>}

      <section className="card-premium divide-y divide-border">
        {TIMED.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-3 p-4">
            <Icon className="size-5 shrink-0 text-primary" />
            <label htmlFor={`${key}-on`} className="flex-1 text-sm font-medium">{label}</label>
            <Input aria-label={`${label} time`} type="time" value={form[`${key}_at`]} disabled={!form[`${key}_on`]} onChange={(e) => set(`${key}_at`, e.target.value)} className="w-32" />
            <Switch id={`${key}-on`} checked={form[`${key}_on`]} onCheckedChange={(v) => set(`${key}_on`, v)} />
          </div>
        ))}
      </section>

      <section className="card-premium space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Droplets className="size-5 shrink-0 text-water" />
          <label htmlFor="water-on" className="flex-1 text-sm font-medium">Water reminder</label>
          <Switch id="water-on" checked={form.water_on} onCheckedChange={(v) => set("water_on", v)} />
        </div>
        {form.water_on && (
          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <label className="space-y-1">From<Input type="time" value={form.water_start} onChange={(e) => set("water_start", e.target.value)} /></label>
            <label className="space-y-1">Until<Input type="time" value={form.water_end} onChange={(e) => set("water_end", e.target.value)} /></label>
            <label className="space-y-1">Every (hours)<Input type="number" min={1} max={6} value={form.water_every_hours} onChange={(e) => set("water_every_hours", Math.min(6, Math.max(1, Math.round(Number(e.target.value) || 1))))} /></label>
            {waterCount > 0 && <p className="col-span-3">{waterCount} water reminders a day.</p>}
          </div>
        )}
      </section>

      <section className="card-premium flex items-start gap-3 p-4">
        <MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-energy" />
        <div className="flex-1 space-y-1">
          <label htmlFor="followup-on" className="text-sm font-medium">Missed-meal check-in</label>
          <p className="text-xs text-muted-foreground">If a meal isn't logged {MISSED_GRACE_MINUTES / 60} hours after its reminder, the coach asks why and suggests a quick alternative.</p>
        </div>
        <Switch id="followup-on" checked={form.missed_meal_followup} onCheckedChange={(v) => set("missed_meal_followup", v)} />
      </section>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full rounded-full" disabled={busy || !!error} onClick={save}>{busy ? "Saving…" : "Save reminders"}</Button>
    </div>
  );
}
