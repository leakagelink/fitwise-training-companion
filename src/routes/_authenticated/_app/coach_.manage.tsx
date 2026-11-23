import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";
import {
  getCoachManagement,
  saveCoachProfile,
  addCoachSlot,
  changeBookingStatus,
} from "@/features/coach/manage.functions";
const managementQuery = queryOptions({
  queryKey: ["coach-management"],
  staleTime: 15_000,
  queryFn: () => getCoachManagement(),
});
export const Route = createFileRoute("/_authenticated/_app/coach_/manage")({
  head: () => ({
    meta: [
      { title: "Coach management — Fitness AI" },
      { name: "description", content: "Manage coach profiles, availability and booking requests." },
      { property: "og:title", content: "Coach management — Fitness AI" },
      { property: "og:description", content: "Authorized coach appointment management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ ...managementQuery, revalidateIfStale: true }),
  errorComponent: ManageError,
  notFoundComponent: ScreenNotFound,
  component: Management,
});
function ManageError({ error }: ErrorComponentProps) {
  if (!/restricted/i.test(error instanceof Error ? error.message : "")) return <ScreenLoadError />;
  return (
    <div className="mx-auto max-w-md space-y-4 px-5 py-10 text-center">
      <h1 className="text-xl font-bold">Coaches only</h1>
      <p className="text-sm text-muted-foreground">This page is for authorized coaches and staff.</p>
      <Button asChild>
        <Link to="/coach">Back to AI Coach</Link>
      </Button>
    </div>
  );
}
function Management() {
  const { data } = useSuspenseQuery(managementQuery);
  const qc = useQueryClient();
  const save = useServerFn(saveCoachProfile);
  const add = useServerFn(addCoachSlot);
  const change = useServerFn(changeBookingStatus);
  const [busy, setBusy] = useState(false);
  const me = data.profiles.find((p) => p.user_id === data.userId);
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["coach"] }),
        qc.invalidateQueries({ queryKey: ["coach-management"] }),
      ]);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  const inputClass = "mt-1 w-full rounded-md border border-input bg-background p-2";
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-6">
      <Link to="/coach" className="text-sm text-primary">
        ← AI Coach
      </Link>
      <h1 className="text-2xl font-bold">Coach management</h1>
      <section>
        <h2 className="mb-3 font-semibold">My coach profile</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(() =>
              save({
                data: {
                  name: String(f.get("name")),
                  photo_url: String(f.get("photo")),
                  specialization: String(f.get("specialization")),
                  experience_years: Number(f.get("experience")),
                  bio: String(f.get("bio")),
                },
              }),
            );
          }}
        >
          <label className="text-sm">
            Name
            <input name="name" required defaultValue={me?.name} className={inputClass} />
          </label>
          <label className="text-sm">
            Specialization
            <input name="specialization" defaultValue={me?.specialization} className={inputClass} />
          </label>
          <label className="text-sm">
            Experience (years)
            <input
              name="experience"
              type="number"
              min={0}
              max={70}
              defaultValue={me?.experience_years ?? 0}
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            Photo URL
            <input
              name="photo"
              type="url"
              placeholder="https://…"
              defaultValue={me?.photo_url}
              className={inputClass}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            About me
            <textarea name="bio" maxLength={1000} defaultValue={me?.bio} className={inputClass} />
          </label>
          <Button disabled={busy} type="submit">
            Save profile
          </Button>
        </form>
      </section>
      <section className="border-t border-border pt-5">
        <h2 className="mb-3 font-semibold">Add availability</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const kind = f.get("kind") === "video" ? "video" : "call";
            void act(() =>
              add({
                data: {
                  kind,
                  startsAt: new Date(String(f.get("time"))).toISOString(),
                  duration: Number(f.get("duration")),
                },
              }),
            );
          }}
        >
          <label className="text-sm">
            Type
            <select name="kind" className={inputClass}>
              <option value="call">Call</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label className="text-sm">
            Date & time
            <input type="datetime-local" name="time" required className={inputClass} />
          </label>
          <label className="text-sm">
            Minutes
            <input
              type="number"
              name="duration"
              min={10}
              max={180}
              defaultValue={30}
              className={inputClass}
            />
          </label>
          <Button disabled={busy} type="submit">
            Add slot
          </Button>
        </form>
        <ul className="mt-3 space-y-2 text-sm">
          {data.slots
            .filter((s) => data.isAdmin || s.coach_user_id === data.userId)
            .map((s) => (
              <li key={s.id}>
                {s.coach_name} · {new Date(s.starts_at).toLocaleString()} · {s.kind} ·{" "}
                {s.duration_min} min
              </li>
            ))}
        </ul>
      </section>
      <section className="border-t border-border pt-5">
        <h2 className="mb-3 font-semibold">Booking requests</h2>
        {!data.bookings.length && <p className="text-sm text-muted-foreground">No requests yet</p>}
        <ul className="divide-y divide-border">
          {data.bookings.map((b) => (
            <li key={b.id} className="space-y-2 py-4">
              <p className="font-semibold capitalize">
                {b.kind} · {b.status}
              </p>
              <p className="break-words text-sm">{b.contact}</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{b.notes}</p>
              {b.coach_slots && (
                <p className="text-sm">
                  {b.coach_slots.coach_name} · {new Date(b.coach_slots.starts_at).toLocaleString()}
                </p>
              )}
              {["pending", "confirmed"].includes(b.status) && (
                <div className="flex flex-wrap gap-2">
                  {(["confirmed", "completed", "cancelled"] as const).map((status) => (
                    <Button
                      variant="secondary"
                      size="sm"
                      key={status}
                      disabled={busy || b.status === status}
                      onClick={() => act(() => change({ data: { id: b.id, status } }))}
                    >
                      {status === "confirmed"
                        ? "Confirm"
                        : status === "completed"
                          ? "Complete"
                          : "Cancel"}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
