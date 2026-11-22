import { REMINDER_ID_BASE, reminderSchedule, type ReminderSettings } from "@/features/reminders/model";

async function plugin() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("LocalNotifications")) return null;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export type NativePermission = "unsupported" | "granted" | "denied" | "prompt";

export async function nativeReminderPermission(request: boolean): Promise<NativePermission> {
  const notifications = await plugin();
  if (!notifications) return "unsupported";
  const current = await notifications.checkPermissions();
  if (current.display === "granted" || !request) return current.display === "granted" ? "granted" : current.display === "denied" ? "denied" : "prompt";
  const asked = await notifications.requestPermissions();
  return asked.display === "granted" ? "granted" : "denied";
}

async function cancelBlock(notifications: NonNullable<Awaited<ReturnType<typeof plugin>>>) {
  const pending = await notifications.getPending();
  const ours = pending.notifications.filter((n) => n.id >= REMINDER_ID_BASE && n.id < REMINDER_ID_BASE + 100);
  if (ours.length) await notifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
}

/** Replaces this device's daily reminders with the saved settings (only when permission is granted). */
export async function syncNativeReminders(settings: ReminderSettings): Promise<NativePermission> {
  const notifications = await plugin();
  if (!notifications) return "unsupported";
  const permission = await nativeReminderPermission(false);
  if (permission !== "granted") return permission;
  await cancelBlock(notifications);
  const items = reminderSchedule(settings);
  if (items.length) {
    await notifications.schedule({
      notifications: items.map((r) => ({
        id: r.id, title: r.title, body: r.body,
        schedule: { on: { hour: r.hour, minute: r.minute }, allowWhileIdle: true },
        extra: { path: r.path },
      })),
    });
  }
  return "granted";
}

export async function cancelNativeReminders() {
  const notifications = await plugin();
  if (notifications) await cancelBlock(notifications);
}

/** Opens the matching screen when a reminder is tapped. */
export async function onReminderTap(open: (path: string) => void) {
  const notifications = await plugin();
  if (!notifications) return undefined;
  return notifications.addListener("localNotificationActionPerformed", ({ notification }) => {
    const path = (notification.extra as { path?: unknown } | undefined)?.path;
    if (typeof path === "string" && ["/nutrition", "/workout", "/home"].includes(path)) open(path);
  });
}
