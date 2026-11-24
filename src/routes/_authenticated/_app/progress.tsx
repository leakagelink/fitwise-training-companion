import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayISO, weeklyWorkoutCounts, weightChange, workoutStreak } from "@/lib/fitness";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";
import { ProgressSummary } from "@/features/progress/summary";
import { ProgressPhotos } from "@/features/progress/photos";
import { ResultAnalysisCard } from "@/features/progress/result-analysis-card";
import { resultAnalysisQuery } from "@/features/progress/queries";

const progressQuery = queryOptions({
  queryKey: ["progress"],
  queryFn: async () => {
    const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
    const [w, c, m, s] = await Promise.all([
      supabase
        .from("weight_logs")
        .select("logged_on,weight_kg")
        .gte("logged_on", since)
        .order("logged_on"),
      supabase.from("daily_checkins").select("*").gte("date", since).order("date"),
      supabase
        .from("body_measurements")
        .select("*")
        .order("measured_on", { ascending: false })
        .limit(10),
      supabase
        .from("workout_sessions")
        .select("finished_at")
        .eq("status", "completed")
        .gte("started_at", since),
    ]);
    const err = [w, c, m, s].find((r) => r.error);
    if (err) throw new Error("Could not load your progress");
    return {
      weights: w.data ?? [],
      checkins: c.data ?? [],
      measurements: m.data ?? [],
      sessions: s.data ?? [],
    };
  },
});

export const Route = createFileRoute("/_authenticated/_app/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Fitness AI" },
      {
        name: "description",
        content: "Track weight, body measurements, sleep, water, energy and weekly workouts.",
      },
      { property: "og:title", content: "Progress — Fitness AI" },
      {
        property: "og:description",
        content: "Your fitness progress charts and daily lifestyle tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(resultAnalysisQuery(todayISO()));
    return context.queryClient.ensureQueryData({ ...progressQuery, revalidateIfStale: true });
  },
  errorComponent: ScreenLoadError,
  notFoundComponent: ScreenNotFound,
  component: Progress,
});

const tick = { fill: "var(--muted-foreground)", fontSize: 11 };
const short = (d: string) => d.slice(5);
const num = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return v === "" || v === null || Number.isNaN(n) ? null : n;
};

function Progress() {
  const { data } = useSuspenseQuery(progressQuery);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const today = todayISO();
  const todayRow = data.checkins.find((c) => c.date === today);
  const workoutDates = [
    ...data.sessions.flatMap((s) => (s.finished_at ? [todayISO(new Date(s.finished_at))] : [])),
    ...data.checkins.filter((c) => c.workout_done).map((c) => c.date),
  ];
  const weekly = weeklyWorkoutCounts([...new Set(workoutDates)], today, 8).map((w) => ({
    ...w,
    label: short(w.weekStart),
  }));
  const weights = data.weights.map((w) => ({ date: short(w.logged_on), kg: Number(w.weight_kg) }));
  const change = weightChange(data.weights.map((w) => ({ ...w, weight_kg: Number(w.weight_kg) })));
  const life = data.checkins
    .slice(-14)
    .map((c) => ({
      date: short(c.date),
      sleep: c.sleep_hours === null ? null : Number(c.sleep_hours),
      energy: c.energy_level,
      water: c.water_ml / 1000,
    }));

  async function run(fn: () => PromiseLike<{ error: unknown }>) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    toast.success("Saved");
    await qc.invalidateQueries({ queryKey: ["progress"] });
    await qc.invalidateQueries({ queryKey: ["checkins"] });
  }
  async function uid() {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) throw new Error("Please sign in again");
    return data.session.user.id;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-5 py-6">
      <h1 className="text-2xl font-bold">Progress</h1>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="This week" value={`${weekly.at(-1)?.count ?? 0} workouts`} />
        <Stat label="Streak" value={`${workoutStreak([...new Set(workoutDates)], today)} days`} />
        <Stat
          label="Weight change"
          value={change === null ? "—" : `${change > 0 ? "+" : ""}${change} kg`}
        />
      </div>

      <ProgressSummary />
      <ProgressPhotos />
      <ResultAnalysisCard />

      <Card>
        <CardHeader>
          <CardTitle>Today's check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            key={todayRow?.id ?? "new"}
            className="grid gap-3 sm:grid-cols-4 sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const sleep = num(f.get("sleep")),
                energy = num(f.get("energy")),
                water = num(f.get("water"));
              const user_id = await uid();
              await run(() =>
                supabase.from("daily_checkins").upsert(
                  {
                    user_id,
                    date: today,
                    sleep_hours: sleep,
                    energy_level: energy,
                    water_ml: water === null ? (todayRow?.water_ml ?? 0) : Math.round(water * 1000),
                    workout_done: todayRow?.workout_done ?? false,
                    diet_followed: todayRow?.diet_followed ?? false,
                  },
                  { onConflict: "user_id,date" },
                ),
              );
            }}
          >
            <Field
              name="sleep"
              label="Sleep (hours)"
              min={0}
              max={16}
              step={0.5}
              def={todayRow?.sleep_hours}
            />
            <Field
              name="energy"
              label="Energy (1–5)"
              min={1}
              max={5}
              step={1}
              def={todayRow?.energy_level}
            />
            <Field
              name="water"
              label="Water (litres)"
              min={0}
              max={10}
              step={0.25}
              def={todayRow ? todayRow.water_ml / 1000 : null}
            />
            <Button disabled={busy} type="submit">
              Save check-in
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workouts per week</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer>
            <BarChart data={weekly}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={tick} />
              <YAxis allowDecimals={false} tick={tick} width={28} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
              />
              <Bar dataKey="count" name="Workouts" fill="var(--primary)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex items-end gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const kg = num(new FormData(e.currentTarget).get("kg"));
              if (!kg || kg < 20 || kg > 400) {
                toast.error("Enter a weight between 20 and 400 kg");
                return;
              }
              const user_id = await uid();
              await run(() =>
                supabase.from("weight_logs").insert({ user_id, weight_kg: kg, logged_on: today }),
              );
              e.currentTarget?.reset();
            }}
          >
            <Field name="kg" label="Today's weight (kg)" min={20} max={400} step={0.1} />
            <Button disabled={busy} type="submit">
              Log weight
            </Button>
          </form>
          {weights.length ? (
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={weights}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={tick} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={tick} width={36} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  />
                  <Line dataKey="kg" stroke="var(--primary)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No weight logged yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep, energy & water (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          {life.length ? (
            <ResponsiveContainer>
              <LineChart data={life}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={tick} />
                <YAxis tick={tick} width={28} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                />
                <Line dataKey="sleep" name="Sleep (h)" stroke="var(--primary)" connectNulls />
                <Line dataKey="energy" name="Energy" stroke="var(--chart-2)" connectNulls />
                <Line dataKey="water" name="Water (L)" stroke="var(--chart-3)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Save a check-in to start your chart.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Body measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const row = {
                waist_cm: num(f.get("waist")),
                chest_cm: num(f.get("chest")),
                hips_cm: num(f.get("hips")),
                arm_cm: num(f.get("arm")),
                body_fat_pct: num(f.get("fat")),
              };
              if (Object.values(row).every((v) => v === null)) {
                toast.error("Enter at least one measurement");
                return;
              }
              const user_id = await uid();
              await run(() =>
                supabase
                  .from("body_measurements")
                  .upsert(
                    { user_id, measured_on: today, ...row },
                    { onConflict: "user_id,measured_on" },
                  ),
              );
            }}
          >
            <Field name="waist" label="Waist cm" min={30} max={250} step={0.5} />
            <Field name="chest" label="Chest cm" min={30} max={250} step={0.5} />
            <Field name="hips" label="Hips cm" min={30} max={250} step={0.5} />
            <Field name="arm" label="Arm cm" min={10} max={100} step={0.5} />
            <Field name="fat" label="Body fat %" min={2} max={70} step={0.1} />
            <Button disabled={busy} type="submit">
              Save
            </Button>
          </form>
          {data.measurements.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1">Date</th>
                    <th>Waist</th>
                    <th>Chest</th>
                    <th>Hips</th>
                    <th>Arm</th>
                    <th>Fat %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.measurements.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="py-1">{m.measured_on}</td>
                      <td>{m.waist_cm ?? "—"}</td>
                      <td>{m.chest_cm ?? "—"}</td>
                      <td>{m.hips_cm ?? "—"}</td>
                      <td>{m.arm_cm ?? "—"}</td>
                      <td>{m.body_fat_pct ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No measurements yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
function Field({
  name,
  label,
  min,
  max,
  step,
  def,
}: {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  def?: number | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        defaultValue={def ?? ""}
      />
    </div>
  );
}
