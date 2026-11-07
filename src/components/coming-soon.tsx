import type { LucideIcon } from "lucide-react";

export function ComingSoon({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="card-premium mt-6 p-8 text-center">
        <Icon className="mx-auto size-10 text-primary" />
        <p className="mt-4 font-semibold">Coming in the next build phase</p>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
