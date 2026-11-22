# Reminders
- Reminder times and the missed-meal rule live in model.ts (tested in src/test/reminders.test.ts); the Android app schedules them on-device with Capacitor Local Notifications in one replaceable id block, and the browser only shows in-app check-ins — no server push or Firebase needed.
- Missed-meal answers are saved once per user/date/meal so a check-in never repeats after it is logged, skipped or closed.
