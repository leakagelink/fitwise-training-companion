import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Apple, Bot, Dumbbell, Home, LineChart, UserRound } from "lucide-react";
import { profileQuery } from "@/hooks/use-profile";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    const profile = await context.queryClient.ensureQueryData({ ...profileQuery, revalidateIfStale: true });
    if (!profile.onboarded_at) throw redirect({ to: "/onboarding" });
  },
  component: AppShell,
});

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Apple },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/coach", label: "AI Coach", icon: Bot },
] as const;

function AppShell() {
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar p-5 md:flex">
        <Logo className="text-lg" />
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-foreground [&>svg]:text-primary" }}
            >
              <n.icon className="size-5" /> {n.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-foreground" }}
        >
          <UserRound className="size-5" /> Profile &amp; settings
        </Link>
      </aside>

      <main className="min-w-0 flex-1 pb-28 md:pb-10">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="group flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "!text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-colors", isActive && "bg-accent")}>
                    <n.icon className="size-5" />
                  </span>
                  {n.label}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
