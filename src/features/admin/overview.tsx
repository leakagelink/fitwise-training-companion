import { ArrowUpRight, CalendarDays, CreditCard, Dumbbell, Users, UserCheck, Utensils, Activity, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

type OverviewData = {
  users: number; members: number; pendingBookings: number; workouts: number; meals: number;
  purchases: unknown[];
};

export function AdminOverview({ data, pending, selectSection, children }: { data: OverviewData | undefined; pending: boolean; selectSection: (id: string) => void; children: React.ReactNode }) {
  const metrics = [
    { label: "Registered users", value: data?.users, icon: Users, tone: "primary", section: "users" },
    { label: "Active members", value: data?.members, icon: UserCheck, tone: "water", section: "plans" },
    { label: "Pending bookings", value: data?.pendingBookings, icon: CalendarDays, tone: "energy", section: "coaches" },
    { label: "Completed workouts", value: data?.workouts, icon: Dumbbell, tone: "primary", section: "records" },
    { label: "Meals logged", value: data?.meals, icon: Utensils, tone: "water", section: "records" },
    { label: "Recent purchases", value: data?.purchases.length, icon: CreditCard, tone: "energy", section: "plans" },
  ];
  const totalLogs = (data?.workouts ?? 0) + (data?.meals ?? 0);
  return <div className="space-y-8">
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-3 sm:gap-4" aria-label="App statistics">
      {metrics.map(m => <article key={m.label} className={`admin-stat admin-tone-${m.tone}`}>
        <div className="flex items-start justify-between gap-2"><span className="admin-stat-icon"><m.icon className="size-5" /></span><Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={`View ${m.label.toLowerCase()}`} title={`View ${m.label.toLowerCase()}`} onClick={() => selectSection(m.section)}><ArrowUpRight className="size-4" /></Button></div>
        <p className={`mt-4 font-display text-3xl font-semibold tabular-nums sm:text-4xl ${pending ? "animate-pulse" : ""}`}>{m.value?.toLocaleString() ?? "—"}</p>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{m.label}</p>
      </article>)}
    </section>
    <section className="grid gap-8 border-b border-border pb-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div><div className="mb-5 flex items-center gap-2"><Activity className="size-4 text-primary" /><h2 className="text-lg font-semibold">Fitness activity</h2></div>
        <div className="flex items-baseline gap-2"><span className="font-display text-3xl font-semibold tabular-nums">{data ? totalLogs.toLocaleString() : "—"}</span><span className="text-sm text-muted-foreground">total logs</span></div>
        <div className="mt-5 flex h-3 overflow-hidden rounded-sm bg-muted" aria-label="Workout and meal log distribution">{totalLogs > 0 && <><div className="bg-primary" style={{ flex: data?.workouts ?? 0 }} /><div className="bg-water" style={{ flex: data?.meals ?? 0 }} /></>}</div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" />Workouts · {data?.workouts ?? "—"}</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-water" />Meals · {data?.meals ?? "—"}</span></div>
      </div>
      <div><h2 className="mb-5 text-lg font-semibold">Quick access</h2><div className="grid grid-cols-2 gap-3">{[{ label: "Manage users", icon: Users, id: "users" }, { label: "Coach bookings", icon: CalendarDays, id: "coaches" }, { label: "Support inbox", icon: Inbox, id: "support" }, { label: "Membership plans", icon: CreditCard, id: "plans" }].map(a => <Button key={a.id} variant="outline" className="h-auto min-h-14 justify-start gap-2 whitespace-normal px-3 py-3 text-left text-xs sm:text-sm" onClick={() => selectSection(a.id)}><a.icon className="size-4 shrink-0 text-muted-foreground" />{a.label}</Button>)}</div></div>
    </section>
    <section><div className="mb-2 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Recent activity</h2><Button variant="ghost" size="sm" className="text-primary" onClick={() => selectSection("audit")}>View all <ArrowUpRight className="size-4" /></Button></div>{children}</section>
  </div>;
}