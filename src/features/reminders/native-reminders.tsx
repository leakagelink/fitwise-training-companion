import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { onReminderTap, syncNativeReminders } from "@/lib/native-reminders";
import { reminderSettingsQuery } from "./queries";
import { useLanguageStore } from '@/features/language/context';

/** Keeps the Android app's scheduled reminders in step with the saved settings. */
export function NativeReminders() {
  const router = useRouter();
  const settings = useQuery(reminderSettingsQuery);
  const language = useLanguageStore();
  useEffect(() => {
    if (!settings.data) return;
    void syncNativeReminders(settings.data, language ? sources => language.resolve(sources) : undefined).catch((error) => console.error("Reminders could not be scheduled", error));
  }, [settings.data, language]);
  useEffect(() => {
    let disposed = false;
    let remove: (() => Promise<void>) | undefined;
    void onReminderTap((path) => void router.navigate({ to: path })).then((listener) => {
      if (!listener) return;
      if (disposed) void listener.remove();
      else remove = () => listener.remove();
    }).catch(() => undefined);
    return () => { disposed = true; void remove?.(); };
  }, [router]);
  return null;
}
