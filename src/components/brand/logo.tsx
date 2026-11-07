import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M4 14l4-4 4 4 8-8" />
          <path d="M14 6h6v6" />
        </svg>
      </span>
      <span>
        Fitness<span className="text-primary">AI</span>
      </span>
    </span>
  );
}
